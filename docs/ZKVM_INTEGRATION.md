# zkVM Integration Guide

## Overview

The Abunfi platform integrates RISC Zero zkVM for social account verification using zero-knowledge proofs. The zkVM prover runs locally on the backend server and is invoked directly by the Node.js backend (not via HTTP).

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend  │────────▶│   Backend   │────────▶│ zkVM Prover  │
│  (React)    │  HTTP   │  (Node.js)  │ Process │   (Rust)     │
└─────────────┘         └─────────────┘         └──────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │  Blockchain │
                        │  (Sepolia)  │
                        └─────────────┘
```

### Components

1. **Frontend (React)**
   - Initiates verification requests
   - Polls for verification status
   - Displays results to users

2. **Backend (Node.js)**
   - Exposes REST API endpoints for verification
   - Spawns zkVM prover as child process
   - Manages verification request lifecycle
   - Stores verification results

3. **zkVM Prover (Rust)**
   - RISC Zero host program
   - Generates zero-knowledge proofs
   - Verifies OAuth tokens
   - Runs as a subprocess invoked by backend

4. **Smart Contracts (Solidity)**
   - Store verification results on-chain
   - Validate proofs
   - Manage social account registry

## API Endpoints

### Start Verification

**POST** `/api/zkvm/verify`

Request:
```json
{
  "platform": "twitter",
  "oauth_token": "mock_twitter_token_12345",
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "request_id": "optional-blockchain-request-id"
}
```

Response:
```json
{
  "success": true,
  "verificationId": "uuid-v4",
  "status": "pending",
  "message": "Verification started"
}
```

### Check Verification Status

**GET** `/api/zkvm/status/:verificationId`

Response:
```json
{
  "success": true,
  "id": "uuid-v4",
  "platform": "twitter",
  "walletAddress": "0x1234...",
  "status": "completed",
  "result": {
    "verification_success": true,
    "social_account_hash": "0xabcd...",
    "account_age": 86400,
    "follower_count": 1000,
    "proof_hash": "0x1234...",
    "receipt": "base64-encoded-receipt"
  },
  "createdAt": 1234567890,
  "completedAt": 1234567900
}
```

### Health Check

**GET** `/api/zkvm/health`

Response:
```json
{
  "success": true,
  "service": "zkVM",
  "status": "operational",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Deployment

### Local Development

The zkVM prover is built and included in the backend Docker container:

```bash
# Start all services including zkVM-enabled backend
docker-compose up -d --build

# Check backend logs
docker logs -f abunfi-backend
```

### Production Deployment

The production deployment uses the same zkVM-enabled backend:

```bash
# Build and start production services
docker-compose -f docker-compose.production.yml up -d --build

# Verify zkVM is available
docker exec abunfi-backend-prod /app/bin/zkvm-prover --help
```

## Environment Variables

### Backend Configuration

```bash
# Path to zkVM prover binary
ZKVM_PROVER_PATH=/app/bin/zkvm-prover

# Verification timeout in milliseconds (default: 5 minutes)
ZKVM_TIMEOUT=300000
```

### Frontend Configuration

```bash
# Backend API URL (zkVM endpoints are under /api/zkvm)
REACT_APP_API_URL=http://localhost:3001/api
```

## Docker Configuration

### Multi-Stage Build

The `backend/Dockerfile.with-zkvm` uses a multi-stage build:

1. **Stage 1: zkVM Builder**
   - Uses `rust:1.75-alpine`
   - Builds the RISC Zero prover binary
   - Outputs to `/zkvm/risc0-social-verifier/target/release/host`

2. **Stage 2: Node.js Backend**
   - Uses `node:18-alpine`
   - Copies the zkVM binary to `/app/bin/zkvm-prover`
   - Installs Node.js dependencies
   - Runs the backend server

### Volume Mounts

Development mode mounts:
- `./backend:/app` - Backend source code
- `/app/node_modules` - Node modules (not overwritten)
- `/app/bin` - zkVM binary (not overwritten)

## Supported Platforms

The zkVM verifier supports the following social platforms:

- **Twitter** - Minimum 30 days old, 10 followers
- **Discord** - Minimum 14 days old
- **GitHub** - Minimum 90 days old, 5 followers
- **Telegram** - Minimum 30 days old
- **LinkedIn** - Minimum 60 days old, 10 followers

## Verification Flow

1. **User initiates verification** on frontend
2. **Frontend calls smart contract** to create verification request
3. **Frontend calls backend API** `/api/zkvm/verify` with OAuth token
4. **Backend spawns zkVM prover** as child process
5. **zkVM prover generates proof** (takes 1-5 minutes)
6. **Backend stores result** in memory
7. **Frontend polls** `/api/zkvm/status/:id` for completion
8. **Frontend submits proof** to smart contract
9. **Smart contract validates** and stores verification

## Troubleshooting

### zkVM Binary Not Found

```bash
# Check if binary exists in container
docker exec abunfi-backend ls -la /app/bin/

# Rebuild with zkVM support
docker-compose build --no-cache backend
```

### Verification Timeout

```bash
# Increase timeout in environment
ZKVM_TIMEOUT=600000  # 10 minutes

# Check prover logs
docker logs abunfi-backend | grep zkVM
```

### Build Failures

```bash
# Check Rust toolchain in builder stage
docker build --target zkvm-builder -f backend/Dockerfile.with-zkvm .

# Verify contracts-submodule exists
ls -la contracts-submodule/risc0-social-verifier/
```

## Security Considerations

1. **OAuth Token Handling**
   - Tokens are passed to zkVM prover but never stored
   - Tokens are only used within the zkVM guest program
   - Only proof hash is stored on-chain

2. **Process Isolation**
   - zkVM runs as a separate process
   - Limited resource access
   - Timeout protection

3. **Proof Verification**
   - All proofs are verified on-chain
   - Smart contract validates RISC Zero receipts
   - Prevents replay attacks with nonces

## Performance

- **Proof Generation**: 1-5 minutes per verification
- **Memory Usage**: ~512MB per verification
- **Concurrent Verifications**: Limited by server resources
- **Cleanup**: Old requests cleaned up after 1 hour

## Future Improvements

- [ ] Add database persistence for verification requests
- [ ] Implement queue system for concurrent verifications
- [ ] Add metrics and monitoring
- [ ] Support batch verifications
- [ ] Add webhook notifications for completion

