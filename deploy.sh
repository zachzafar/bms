#!/bin/bash
VPS_USER="root"
VPS_HOST="147.182.188.77"
REMOTE_DIR="/root/bms"

# Build the applications locally
pnpm build

# Create a temporary archive of the project (excluding macOS attributes)
tar --exclude='node_modules' \
    --exclude='.git' \
    --no-xattrs \
    --no-mac-metadata \
    -czf deploy.tar.gz .

# Clean remote directory and copy archive
ssh $VPS_USER@$VPS_HOST "rm -rf $REMOTE_DIR/* && mkdir -p $REMOTE_DIR"
scp deploy.tar.gz $VPS_USER@$VPS_HOST:$REMOTE_DIR/

# Extract and set up on remote
ssh $VPS_USER@$VPS_HOST "cd $REMOTE_DIR && \
    tar -xzf deploy.tar.gz && \
    rm deploy.tar.gz && \
    pnpm install && \
    pm2 delete all || true && \
    pm2 start ecosystem.config.js"

# Clean up local archive
rm deploy.tar.gz