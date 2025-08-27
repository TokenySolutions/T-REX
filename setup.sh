#!/bin/bash

ROOT_DIR=$(pwd)

check_tools() {
    command -v git >/dev/null || { echo "ERROR: git is required but not found"; exit 1; }
    command -v npm >/dev/null || { echo "ERROR: npm is required but not found"; exit 1; }
}

clone_or_update() {
    local repo_url=$1
    local dir_name=$2
    local branch=$3
    
    echo "Setting up $dir_name..."
    
    if [ -d "$dir_name/.git" ]; then
        echo "  - Directory exists, updating..."
        cd "$ROOT_DIR/$dir_name"
        if ! git fetch origin; then
            echo "  - Fetch failed, re-cloning..."
            cd "$ROOT_DIR"
            rm -rf "$dir_name"
            if ! git clone -b "$branch" "$repo_url" "$dir_name"; then
                echo "  - ERROR: Failed to clone $dir_name"
                return 1
            fi
        else
            git checkout "$branch" || true
            git pull origin "$branch" || true
        fi
    else
        echo "  - Cloning fresh copy..."
        rm -rf "$dir_name"
        if ! git clone -b "$branch" "$repo_url" "$dir_name"; then
            echo "  - ERROR: Failed to clone $dir_name"
            return 1
        fi
    fi
    cd "$ROOT_DIR"
    
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
        echo "Directory $dir_name exists"
    fi
}

if [ "$npm_lifecycle_event" == "preinstall" ]; then
    echo "Setting up dependencies..."
    
    check_tools
    
    if git submodule status >/dev/null 2>&1; then
        echo "Attempting git submodule update..."
        if ! git submodule update --init --recursive; then
            echo "Submodule update failed, will clone manually..."
        fi
    else
        echo "Not a git repo or submodules not configured, will clone directly..."
    fi
    
    verify_and_clone_if_missing "https://github.com/Brianspha/micro-eth-signer.git" "micro-eth-signer" "main"
    verify_and_clone_if_missing "https://github.com/Brianspha/solidity.git" "solidity" "main"
    verify_and_clone_if_missing "https://github.com/paritytech/polkadot-sdk.git" "polkadot-sdk" "master"
    verify_and_clone_if_missing "https://github.com/Brianspha/hardhat-polkadot-trex.git" "hardhat-polkadot" "main"

    if [ -d "micro-eth-signer" ]; then
        echo "Building micro-eth-signer..."
        cd "$ROOT_DIR/micro-eth-signer"
        if npm install --silent --no-save --no-audit --no-fund; then
            npm run build || echo "micro-eth-signer build failed"
        else
            echo "micro-eth-signer install failed"
        fi
        cd "$ROOT_DIR"
    else
        echo "WARNING: micro-eth-signer directory not found"
    fi

    if [ -d "hardhat-polkadot" ]; then
        echo "Building hardhat-polkadot..."
        cd "$ROOT_DIR/hardhat-polkadot"
        if command -v pnpm >/dev/null; then
            if pnpm i; then
                pnpm build || echo "hardhat-polkadot build failed"
            else
                echo "hardhat-polkadot install failed"
            fi
        else
            echo "pnpm not found, skipping hardhat-polkadot build"
        fi
        cd "$ROOT_DIR"
    else
        echo "WARNING: hardhat-polkadot directory not found"
    fi

    if [ -d "solidity" ]; then
        echo "Building solidity..."
        cd "$ROOT_DIR/solidity"
        if npm install --silent --no-save --no-audit --no-fund; then
            npm run build || echo "solidity build failed"
        else
            echo "solidity install failed"
        fi
        cd "$ROOT_DIR"
    else
        echo "WARNING: solidity directory not found"
    fi
fi

if [ "$npm_lifecycle_event" == "postinstall" ]; then
    echo "Setting up symlinks..."
    mkdir -p node_modules/@onchain-id
    
    rm -rf node_modules/micro-eth-signer
    rm -rf node_modules/@onchain-id/solidity
    rm -rf node_modules/@parity/hardhat-polkadot

    if [ -d "micro-eth-signer" ]; then
        if ln -sfn "$ROOT_DIR/micro-eth-signer" node_modules/micro-eth-signer; then
            echo "micro-eth-signer symlink created"
        else
            echo "Failed to create micro-eth-signer symlink"
        fi
    else
        echo "micro-eth-signer directory not found, skipping symlink"
    fi
    
    if [ -d "hardhat-polkadot" ]; then
        echo "Setting up hardhat-polkadot workspace packages..."
        mkdir -p node_modules/@parity
        
        for pkg_dir in hardhat-polkadot/packages/*/; do
            if [ -f "$pkg_dir/package.json" ]; then
                pkg_name=$(grep '"name"' "$pkg_dir/package.json" | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | sed 's/@parity\///')
                pkg_path="$pkg_dir"
                
                if [ -n "$pkg_name" ] && [[ "$pkg_name" =~ ^hardhat-polkadot ]]; then
                    rm -rf "node_modules/@parity/$pkg_name"
                    if ln -sfn "$ROOT_DIR/$pkg_path" "node_modules/@parity/$pkg_name"; then
                        echo "@parity/$pkg_name symlink created"
                    else
                        echo "Failed to create @parity/$pkg_name symlink"
                    fi
                fi
            fi
        done
    else
        echo "hardhat-polkadot directory not found, skipping symlinks"
    fi

    if [ -d "solidity" ]; then
        if ln -sfn "$ROOT_DIR/solidity" node_modules/@onchain-id/solidity; then
            echo "solidity symlink created"
        else
            echo "Failed to create solidity symlink"
        fi
    else
        echo "solidity directory not found, skipping symlink"
    fi
    
    if [ -f "node_modules/.bin/patch-package" ]; then
        npx patch-package || true
    fi
    
    if command -v cargo >/dev/null 2>&1 && [ -d "polkadot-sdk" ]; then
        cd "$ROOT_DIR/polkadot-sdk"
        echo "Building Polkadot SDK..."
        if cargo build -p pallet-revive-eth-rpc --bin eth-rpc --release; then
            echo "eth-rpc build completed"
        else
            echo "eth-rpc build failed"
        fi
        if cargo build --bin substrate-node --release; then
            echo "substrate-node build completed"
        else
            echo "substrate-node build failed"
        fi
        cd "$ROOT_DIR"
    else
        if [ ! -d "polkadot-sdk" ]; then
            echo "polkadot-sdk directory not found, skipping Rust build"
        else
            echo "cargo not found, skipping Polkadot SDK build"
        fi
    fi
    
    echo "Setup complete!"
fi

exit 0