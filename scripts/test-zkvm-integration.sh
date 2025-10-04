#!/bin/bash

# Test zkVM Integration Script
# This script tests the zkVM verification endpoints

set -e

echo "🧪 Testing zkVM Integration"
echo "=============================="
echo ""

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
API_URL="${BACKEND_URL}/api/zkvm"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo "----------------------"
HEALTH_RESPONSE=$(curl -s "${API_URL}/health")
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Start Verification
echo "📋 Test 2: Start Verification"
echo "----------------------------"
VERIFY_RESPONSE=$(curl -s -X POST "${API_URL}/verify" \
    -H "Content-Type: application/json" \
    -d '{
        "platform": "twitter",
        "oauth_token": "mock_twitter_token_12345",
        "wallet_address": "0x1234567890123456789012345678901234567890"
    }')

echo "Response: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Verification started${NC}"
    
    # Extract verification ID
    VERIFICATION_ID=$(echo "$VERIFY_RESPONSE" | grep -o '"verificationId":"[^"]*"' | cut -d'"' -f4)
    echo "Verification ID: $VERIFICATION_ID"
else
    echo -e "${RED}❌ Failed to start verification${NC}"
    exit 1
fi
echo ""

# Test 3: Check Status
echo "📋 Test 3: Check Verification Status"
echo "-----------------------------------"
if [ -n "$VERIFICATION_ID" ]; then
    sleep 2  # Wait a bit before checking status
    
    STATUS_RESPONSE=$(curl -s "${API_URL}/status/${VERIFICATION_ID}")
    echo "Response: $STATUS_RESPONSE"
    
    if echo "$STATUS_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Status check passed${NC}"
        
        # Check status
        STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo "Current status: $STATUS"
        
        if [ "$STATUS" = "pending" ]; then
            echo -e "${YELLOW}⏳ Verification is pending (this is expected)${NC}"
        elif [ "$STATUS" = "completed" ]; then
            echo -e "${GREEN}✅ Verification completed${NC}"
        elif [ "$STATUS" = "failed" ]; then
            echo -e "${RED}❌ Verification failed${NC}"
        fi
    else
        echo -e "${RED}❌ Status check failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping status check (no verification ID)${NC}"
fi
echo ""

# Test 4: Invalid Platform
echo "📋 Test 4: Invalid Platform (Should Fail)"
echo "----------------------------------------"
INVALID_RESPONSE=$(curl -s -X POST "${API_URL}/verify" \
    -H "Content-Type: application/json" \
    -d '{
        "platform": "invalid_platform",
        "oauth_token": "mock_token",
        "wallet_address": "0x1234567890123456789012345678901234567890"
    }')

echo "Response: $INVALID_RESPONSE"

if echo "$INVALID_RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ Correctly rejected invalid platform${NC}"
else
    echo -e "${RED}❌ Should have rejected invalid platform${NC}"
    exit 1
fi
echo ""

# Test 5: Missing Required Fields
echo "📋 Test 5: Missing Required Fields (Should Fail)"
echo "-----------------------------------------------"
MISSING_RESPONSE=$(curl -s -X POST "${API_URL}/verify" \
    -H "Content-Type: application/json" \
    -d '{
        "platform": "twitter"
    }')

echo "Response: $MISSING_RESPONSE"

if echo "$MISSING_RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ Correctly rejected missing fields${NC}"
else
    echo -e "${RED}❌ Should have rejected missing fields${NC}"
    exit 1
fi
echo ""

# Summary
echo "=============================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "zkVM Integration is working correctly!"
echo ""
echo "Next steps:"
echo "1. Test through the frontend UI"
echo "2. Monitor backend logs: docker logs -f abunfi-backend"
echo "3. Check zkVM binary: docker exec abunfi-backend ls -la /app/bin/"
echo ""

