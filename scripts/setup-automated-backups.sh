#!/bin/bash

# Setup Automated Backups for Abunfi Production
# This script configures cron jobs for automated backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up Automated Backups for Abunfi${NC}"
echo -e "${BLUE}===========================================${NC}"

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup.sh"

# Check if backup script exists
if [[ ! -f "$BACKUP_SCRIPT" ]]; then
    echo -e "${RED}❌ Backup script not found at $BACKUP_SCRIPT${NC}"
    exit 1
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Create log directory for backup logs
BACKUP_LOG_DIR="/var/log/abunfi/backups"
sudo mkdir -p "$BACKUP_LOG_DIR"
sudo chown -R $USER:$USER "$BACKUP_LOG_DIR"

echo -e "\n${YELLOW}📋 Backup Configuration:${NC}"
echo -e "   Project Directory: $PROJECT_DIR"
echo -e "   Backup Script: $BACKUP_SCRIPT"
echo -e "   Log Directory: $BACKUP_LOG_DIR"

# Backup schedule options
echo -e "\n${YELLOW}⏰ Select Backup Schedule:${NC}"
echo -e "   1) Daily at 2:00 AM (Recommended)"
echo -e "   2) Daily at 3:00 AM"
echo -e "   3) Twice daily (2:00 AM and 2:00 PM)"
echo -e "   4) Custom schedule"
read -p "Enter your choice (1-4): " schedule_choice

case $schedule_choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        SCHEDULE_DESC="Daily at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 3 * * *"
        SCHEDULE_DESC="Daily at 3:00 AM"
        ;;
    3)
        CRON_SCHEDULE="0 2,14 * * *"
        SCHEDULE_DESC="Twice daily at 2:00 AM and 2:00 PM"
        ;;
    4)
        echo -e "${YELLOW}Enter cron schedule (e.g., '0 2 * * *' for daily at 2 AM):${NC}"
        read -p "Cron schedule: " CRON_SCHEDULE
        SCHEDULE_DESC="Custom: $CRON_SCHEDULE"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Using default: Daily at 2:00 AM${NC}"
        CRON_SCHEDULE="0 2 * * *"
        SCHEDULE_DESC="Daily at 2:00 AM"
        ;;
esac

echo -e "\n${GREEN}✅ Selected schedule: $SCHEDULE_DESC${NC}"

# Create cron job entry
CRON_JOB="$CRON_SCHEDULE cd $PROJECT_DIR && $BACKUP_SCRIPT >> $BACKUP_LOG_DIR/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo -e "\n${YELLOW}⚠️  Backup cron job already exists${NC}"
    read -p "Do you want to replace it? (y/n): " replace_choice
    if [[ $replace_choice != "y" ]]; then
        echo -e "${YELLOW}Keeping existing cron job${NC}"
        exit 0
    fi
    # Remove existing backup cron job
    crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo -e "\n${GREEN}✅ Automated backup configured successfully!${NC}"

# Display current crontab
echo -e "\n${YELLOW}📋 Current Cron Jobs:${NC}"
crontab -l | grep -v "^#" | grep -v "^$" || echo "No cron jobs found"

# Optional: Configure off-site backup
echo -e "\n${YELLOW}🌐 Off-site Backup Configuration (Optional)${NC}"
read -p "Do you want to configure off-site backup to AWS S3? (y/n): " s3_choice

if [[ $s3_choice == "y" ]]; then
    echo -e "\n${BLUE}AWS S3 Configuration:${NC}"
    read -p "S3 Bucket Name: " S3_BUCKET
    read -p "AWS Region (e.g., us-east-1): " AWS_REGION
    
    # Create S3 backup script
    S3_BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup-to-s3.sh"
    
    cat > "$S3_BACKUP_SCRIPT" << 'EOF'
#!/bin/bash

# Backup to S3 Script
# This script uploads local backups to AWS S3

set -e

# Configuration
S3_BUCKET="__S3_BUCKET__"
AWS_REGION="__AWS_REGION__"
BACKUP_DIR="./backups"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

# Find the most recent backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.tar.gz 2>/dev/null | head -1)

if [[ -z "$LATEST_BACKUP" ]]; then
    echo "❌ No backup files found"
    exit 1
fi

echo "📤 Uploading $LATEST_BACKUP to S3..."

# Upload to S3
aws s3 cp "$LATEST_BACKUP" \
    "s3://$S3_BUCKET/abunfi-backups/$(basename $LATEST_BACKUP)" \
    --region "$AWS_REGION" \
    --storage-class STANDARD_IA

echo "✅ Backup uploaded successfully"

# Optional: Clean up old S3 backups (keep last 30 days)
echo "🧹 Cleaning up old S3 backups..."
aws s3 ls "s3://$S3_BUCKET/abunfi-backups/" --region "$AWS_REGION" | \
    while read -r line; do
        createDate=$(echo $line | awk {'print $1" "$2'})
        createDate=$(date -d "$createDate" +%s)
        olderThan=$(date -d "30 days ago" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo $line | awk {'print $4'})
            if [[ $fileName != "" ]]; then
                echo "Deleting old backup: $fileName"
                aws s3 rm "s3://$S3_BUCKET/abunfi-backups/$fileName" --region "$AWS_REGION"
            fi
        fi
    done

echo "✅ S3 backup complete"
EOF

    # Replace placeholders
    sed -i "s|__S3_BUCKET__|$S3_BUCKET|g" "$S3_BACKUP_SCRIPT"
    sed -i "s|__AWS_REGION__|$AWS_REGION|g" "$S3_BACKUP_SCRIPT"
    
    chmod +x "$S3_BACKUP_SCRIPT"
    
    # Add S3 backup to cron (runs 30 minutes after local backup)
    S3_CRON_SCHEDULE=$(echo "$CRON_SCHEDULE" | awk '{print $1+30, $2, $3, $4, $5}')
    S3_CRON_JOB="$S3_CRON_SCHEDULE cd $PROJECT_DIR && $S3_BACKUP_SCRIPT >> $BACKUP_LOG_DIR/s3-backup.log 2>&1"
    
    (crontab -l 2>/dev/null; echo "$S3_CRON_JOB") | crontab -
    
    echo -e "${GREEN}✅ S3 backup configured successfully!${NC}"
    echo -e "${YELLOW}⚠️  Make sure AWS CLI is installed and configured with proper credentials${NC}"
    echo -e "${YELLOW}   Run: aws configure${NC}"
fi

# Create backup monitoring script
MONITOR_SCRIPT="$PROJECT_DIR/scripts/check-backup-status.sh"

cat > "$MONITOR_SCRIPT" << 'EOF'
#!/bin/bash

# Backup Status Monitoring Script
# Checks if backups are running successfully

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
BACKUP_LOG="/var/log/abunfi/backups/backup.log"

echo -e "${YELLOW}📊 Backup Status Report${NC}"
echo -e "${YELLOW}======================${NC}"

# Check last backup
if [[ -d "$BACKUP_DIR" ]]; then
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.tar.gz 2>/dev/null | head -1)
    if [[ -n "$LATEST_BACKUP" ]]; then
        BACKUP_AGE=$(( ($(date +%s) - $(stat -f %m "$LATEST_BACKUP" 2>/dev/null || stat -c %Y "$LATEST_BACKUP")) / 3600 ))
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        
        echo -e "\n${GREEN}✅ Latest Backup:${NC}"
        echo -e "   File: $(basename $LATEST_BACKUP)"
        echo -e "   Size: $BACKUP_SIZE"
        echo -e "   Age: $BACKUP_AGE hours ago"
        
        if [[ $BACKUP_AGE -gt 48 ]]; then
            echo -e "   ${RED}⚠️  WARNING: Backup is older than 48 hours!${NC}"
        fi
    else
        echo -e "\n${RED}❌ No backup files found${NC}"
    fi
else
    echo -e "\n${RED}❌ Backup directory not found${NC}"
fi

# Check backup log
if [[ -f "$BACKUP_LOG" ]]; then
    echo -e "\n${YELLOW}📝 Recent Backup Log (last 10 lines):${NC}"
    tail -10 "$BACKUP_LOG"
    
    # Check for errors
    ERROR_COUNT=$(grep -c "ERROR\|Failed\|❌" "$BACKUP_LOG" 2>/dev/null || echo "0")
    if [[ $ERROR_COUNT -gt 0 ]]; then
        echo -e "\n${RED}⚠️  Found $ERROR_COUNT errors in backup log${NC}"
    fi
else
    echo -e "\n${YELLOW}⚠️  Backup log not found${NC}"
fi

# Check cron job
if crontab -l 2>/dev/null | grep -q "backup.sh"; then
    echo -e "\n${GREEN}✅ Backup cron job is configured${NC}"
    echo -e "   Schedule: $(crontab -l | grep backup.sh | awk '{print $1, $2, $3, $4, $5}')"
else
    echo -e "\n${RED}❌ Backup cron job not found${NC}"
fi

echo -e "\n${YELLOW}💾 Disk Usage:${NC}"
df -h "$BACKUP_DIR" 2>/dev/null || df -h .

echo ""
EOF

chmod +x "$MONITOR_SCRIPT"

echo -e "\n${GREEN}✅ Backup monitoring script created: $MONITOR_SCRIPT${NC}"

# Summary
echo -e "\n${BLUE}📋 Setup Summary:${NC}"
echo -e "${GREEN}✅ Automated backups configured${NC}"
echo -e "   Schedule: $SCHEDULE_DESC"
echo -e "   Backup script: $BACKUP_SCRIPT"
echo -e "   Log file: $BACKUP_LOG_DIR/backup.log"
echo -e "   Monitor script: $MONITOR_SCRIPT"

if [[ $s3_choice == "y" ]]; then
    echo -e "${GREEN}✅ S3 off-site backup configured${NC}"
    echo -e "   S3 Bucket: $S3_BUCKET"
    echo -e "   Region: $AWS_REGION"
fi

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo -e "   1. Test backup manually: $BACKUP_SCRIPT"
echo -e "   2. Check backup status: $MONITOR_SCRIPT"
echo -e "   3. Monitor logs: tail -f $BACKUP_LOG_DIR/backup.log"
if [[ $s3_choice == "y" ]]; then
    echo -e "   4. Configure AWS credentials: aws configure"
    echo -e "   5. Test S3 backup: $S3_BACKUP_SCRIPT"
fi

echo -e "\n${GREEN}🎉 Automated backup setup complete!${NC}"

