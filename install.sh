#!/bin/bash
set -e

REPO="portdeveloper/claude-historian"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

echo "Installing claude-historian..."

# Detect platform
case "$(uname -s)-$(uname -m)" in
    Darwin-arm64)   platform="darwin-arm64" ;;
    Darwin-x86_64)  platform="darwin-x64" ;;
    Linux-x86_64)   platform="linux-x64" ;;
    Linux-aarch64)  platform="linux-arm64" ;;
    *)
        echo "Error: Unsupported platform: $(uname -s)-$(uname -m)"
        exit 1
        ;;
esac

echo "Detected platform: $platform"

# Get latest version from GitHub
echo "Fetching latest version..."
version=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$version" ]; then
    echo "Error: Could not determine latest version"
    exit 1
fi

echo "Latest version: $version"

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Download binary
download_url="https://github.com/$REPO/releases/download/$version/claude-historian-$platform"
echo "Downloading from: $download_url"

if ! curl -fsSL "$download_url" -o "$INSTALL_DIR/claude-historian"; then
    echo "Error: Download failed"
    exit 1
fi

# Make executable
chmod +x "$INSTALL_DIR/claude-historian"

echo ""
echo "✅ claude-historian $version installed to $INSTALL_DIR/claude-historian"
echo ""

# Check if install dir is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "⚠️  $INSTALL_DIR is not in your PATH"
    echo "   Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo ""
    echo "   export PATH=\"\$PATH:$INSTALL_DIR\""
    echo ""
fi

echo "Run 'claude-historian' to browse your Claude Code sessions!"
