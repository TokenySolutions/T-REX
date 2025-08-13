#!/bin/bash

ROOT_DIR=$(pwd)

clone_or_update() {
    local repo_url=$1
    local dir_name=$2
    local branch=$3
    
    echo "Setting up $dir_name..."
    
    if [ -d "$dir_name/.git" ]; then
        echo "  - Directory exists, updating..."
        cd "$ROOT_DIR/$dir_name"
        git fetch origin 2>/dev/null || {
            echo "  - Fetch failed, re-cloning..."
            cd "$ROOT_DIR"
            rm -rf "$dir_name" --force
            git clone -b "$branch" "$repo_url" "$dir_name"
        }
        git checkout "$branch" 2>/dev/null || true
        git pull origin "$branch" 2>/dev/null || true
    else
        echo "  - Cloning fresh copy..."
        rm -rf "$dir_name"
        git clone -b "$branch" "$repo_url" "$dir_name"
    fi
    cd "$ROOT_DIR"
    
    # Verify the directory was created
    if [ ! -d "$dir_name" ]; then
        echo "  - ERROR: Failed to clone $dir_name"
        return 1
    else
        echo "  - SUCCESS: $dir_name ready"
        return 0
    fi
}

verify_and_clone_if_missing() {
    local repo_url=$1
    local dir_name=$2
    local branch=$3
    
    if [ ! -d "$dir_name" ]; then
        echo "Directory $dir_name missing, cloning manually..."
        clone_or_update "$repo_url" "$dir_name" "$branch"
    else
        echo "Directory $dir_name exists ✓"
    fi
}

if [ "$npm_lifecycle_event" == "preinstall" ]; then
    echo "Setting up dependencies..."
    
    if git submodule status >/dev/null 2>&1; then
        echo "Attempting git submodule update..."
        git submodule update --init --recursive --force 2>/dev/null || {
            echo "Submodule update failed, will clone manually..."
        }
    else
        echo "Not a git repo or submodules not configured, will clone directly..."
    fi
    
    verify_and_clone_if_missing "https://github.com/Brianspha/micro-eth-signer.git" "micro-eth-signer" "main"
    verify_and_clone_if_missing "https://github.com/Brianspha/solidity.git" "solidity" "main"
    verify_and_clone_if_missing "https://github.com/paritytech/polkadot-sdk.git" "polkadot-sdk" "at/sizes"
    
    if [ -d "micro-eth-signer" ]; then
        echo "Building micro-eth-signer..."
        cd "$ROOT_DIR/micro-eth-signer"
        npm install --silent --no-save --no-audit --no-fund 2>/dev/null
        npm run build 2>/dev/null || echo "micro-eth-signer build failed"
        cd "$ROOT_DIR"
    else
        echo "WARNING: micro-eth-signer directory not found"
    fi
    
    if [ -d "solidity" ]; then
        echo "Building solidity..."
        cd "$ROOT_DIR/solidity"
        npm install --silent --no-save --no-audit --no-fund 2>/dev/null
        npm run build 2>/dev/null || echo "solidity build failed"
        cd "$ROOT_DIR"
    else
        echo "WARNING: solidity directory not found"
    fi
fi

if [ "$npm_lifecycle_event" == "postinstall" ]; then
    echo "Setting up symlinks..."
    mkdir -p node_modules/@onchain-id
    
    rm -rf node_modules/micro-eth-signer --force
    rm -rf node_modules/@onchain-id/solidity --force
    
    if [ -d "micro-eth-signer" ]; then
        ln -sfn "$ROOT_DIR/micro-eth-signer" node_modules/micro-eth-signer
        echo "✓ micro-eth-signer symlink created"
    else
        echo "⚠ micro-eth-signer directory not found, skipping symlink"
    fi
    
    if [ -d "solidity" ]; then
        ln -sfn "$ROOT_DIR/solidity" node_modules/@onchain-id/solidity
        echo "✓ solidity symlink created"
    else
        echo "⚠ solidity directory not found, skipping symlink"
    fi
    
    [ -f "node_modules/.bin/patch-package" ] && npx patch-package 2>/dev/null || true
    
    if command -v cargo >/dev/null 2>&1 && [ -d "polkadot-sdk" ]; then
        cd "$ROOT_DIR/polkadot-sdk"
        echo "Building Polkadot SDK..."
        cargo build -p pallet-revive-eth-rpc --bin eth-rpc --release 2>&1 | tail -1
        cargo build --bin substrate-node --release 2>&1 | tail -1
        cd "$ROOT_DIR"
    else
        if [ ! -d "polkadot-sdk" ]; then
            echo "⚠ polkadot-sdk directory not found, skipping Rust build"
        else
            echo "⚠ cargo not found, skipping Polkadot SDK build"
        fi
    fi
    
    echo "Setup complete!"
fi

exit 0