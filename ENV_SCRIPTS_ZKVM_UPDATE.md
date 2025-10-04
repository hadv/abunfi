# Environment Scripts - zkVM Integration Update

## Summary

Both environment generation scripts have been updated to include zkVM configuration:

### ✅ Updated Scripts

1. **`scripts/generate-env-prod.sh`** - Production environment
2. **`scripts/generate-env-local.sh`** - Local development environment

---

## Changes Made

### 1. Production Script (`generate-env-prod.sh`)

#### Added zkVM Configuration Section (Lines 156-165):
```bash
# =============================================================================
# ZKVM CONFIGURATION
# =============================================================================
# Path to zkVM prover binary (built into Docker container)
ZKVM_PROVER_PATH=/app/bin/zkvm-prover

# Verification timeout in milliseconds (5 minutes)
ZKVM_TIMEOUT=300000
```

#### Updated Production Notes:
- ✅ Added note: "zkVM prover automatically built in Docker container"
- ✅ Added checklist item: "zkVM prover path configured for Docker"

**Key Points:**
- Production uses Docker path: `/app/bin/zkvm-prover`
- zkVM binary is automatically built during Docker image build
- No manual build steps required for production

---

### 2. Local Development Script (`generate-env-local.sh`)

#### Added zkVM Configuration Section (Lines 191-200):
```bash
# =============================================================================
# ZKVM CONFIGURATION
# =============================================================================
# Path to zkVM prover binary
ZKVM_PROVER_PATH=./bin/zkvm-prover

# Verification timeout in milliseconds (5 minutes)
ZKVM_TIMEOUT=300000
```

#### Updated Development Notes:
- ✅ Added note: "zkVM prover configured for local development"

#### Updated Quick Start Commands:
Added zkVM build instructions as Step 2:
```bash
# 2. Build zkVM prover (required for local dev):
#    cd contracts-submodule/risc0-social-verifier
#    cargo build --release --bin host
#    mkdir -p ../../backend/bin
#    cp target/release/host ../../backend/bin/zkvm-prover
#    cd ../..
```

**Key Points:**
- Local uses relative path: `./bin/zkvm-prover`
- Manual build required for local development (unless using Docker)
- Docker Compose automatically builds zkVM

---

## Environment Variables Added

### Both Scripts Now Include:

| Variable | Production Value | Local Value | Description |
|----------|-----------------|-------------|-------------|
| `ZKVM_PROVER_PATH` | `/app/bin/zkvm-prover` | `./bin/zkvm-prover` | Path to zkVM prover binary |
| `ZKVM_TIMEOUT` | `300000` | `300000` | Verification timeout (5 minutes) |

---

## Usage

### Generate Production Environment:
```bash
./scripts/generate-env-prod.sh
```

**Output:** `.env.prod` with zkVM configuration

**Includes:**
- ✅ zkVM prover path for Docker
- ✅ Verification timeout
- ✅ All other production settings

### Generate Local Development Environment:
```bash
./scripts/generate-env-local.sh
```

**Output:** `.env.local` with zkVM configuration

**Includes:**
- ✅ zkVM prover path for local development
- ✅ Verification timeout
- ✅ Build instructions in comments
- ✅ All other development settings

---

## Verification

### Check Production Environment:
```bash
# Generate production env
./scripts/generate-env-prod.sh

# Verify zkVM variables
grep "ZKVM" .env.prod
```

**Expected Output:**
```
ZKVM_PROVER_PATH=/app/bin/zkvm-prover
ZKVM_TIMEOUT=300000
```

### Check Local Environment:
```bash
# Generate local env
./scripts/generate-env-local.sh

# Verify zkVM variables
grep "ZKVM" .env.local
```

**Expected Output:**
```
ZKVM_PROVER_PATH=./bin/zkvm-prover
ZKVM_TIMEOUT=300000
```

---

## Deployment Workflows

### Production Deployment:
```bash
# 1. Generate production environment
./scripts/generate-env-prod.sh

# 2. Deploy with Docker (zkVM built automatically)
docker-compose -f docker-compose.production.yml up -d --build

# 3. Verify zkVM is available
docker exec abunfi-backend-prod ls -la /app/bin/zkvm-prover

# 4. Test zkVM endpoint
curl https://your-domain.com/api/zkvm/health
```

### Local Development:

**Option A: Docker (Recommended)**
```bash
# 1. Generate local environment
./scripts/generate-env-local.sh

# 2. Start with Docker (zkVM built automatically)
docker-compose up -d --build

# 3. Verify zkVM
docker exec abunfi-backend ls -la /app/bin/zkvm-prover
```

**Option B: Manual Setup**
```bash
# 1. Generate local environment
./scripts/generate-env-local.sh

# 2. Build zkVM prover manually
cd contracts-submodule/risc0-social-verifier
cargo build --release --bin host
mkdir -p ../../backend/bin
cp target/release/host ../../backend/bin/zkvm-prover
cd ../..

# 3. Start services
cd backend && npm run dev &
cd frontend && npm start
```

---

## Troubleshooting

### Issue: zkVM variables not in generated file

**Solution:**
```bash
# Re-run the script
./scripts/generate-env-prod.sh  # or generate-env-local.sh

# Check if variables exist
grep "ZKVM" .env.prod  # or .env.local
```

### Issue: Wrong zkVM path in local environment

**Check:**
```bash
# Should be relative path for local
grep "ZKVM_PROVER_PATH" .env.local
# Expected: ZKVM_PROVER_PATH=./bin/zkvm-prover

# Should be absolute path for production
grep "ZKVM_PROVER_PATH" .env.prod
# Expected: ZKVM_PROVER_PATH=/app/bin/zkvm-prover
```

### Issue: zkVM binary not found after using script

**For Local Development:**
```bash
# Build the binary manually
cd contracts-submodule/risc0-social-verifier
cargo build --release --bin host
mkdir -p ../../backend/bin
cp target/release/host ../../backend/bin/zkvm-prover
chmod +x ../../backend/bin/zkvm-prover
cd ../..
```

**For Docker:**
```bash
# Rebuild with zkVM
docker-compose build --no-cache backend
```

---

## Summary

### ✅ What's Now Included:

1. **Production Script:**
   - zkVM prover path for Docker containers
   - Verification timeout configuration
   - Updated documentation

2. **Local Script:**
   - zkVM prover path for local development
   - Verification timeout configuration
   - Build instructions in comments
   - Updated quick start guide

3. **Both Scripts:**
   - Consistent timeout values (5 minutes)
   - Clear documentation
   - Proper path configuration for each environment

### 🎯 Result:

Running either script now generates a **complete environment file** with all necessary zkVM configuration for the respective environment (production or local development).

No manual editing of environment files needed for zkVM integration! 🎉

