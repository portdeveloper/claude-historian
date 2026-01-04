#!/bin/bash
set -e

REPO="portdeveloper/claude-historian"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

echo ""
echo "        ╭──────────────────────────────────────╮"
echo "        │                                      │"
echo "        │     ██████╗██╗  ██╗                  │"
echo "        │    ██╔════╝██║  ██║                  │"
echo "        │    ██║     ███████║                  │"
echo "        │    ██║     ██╔══██║                  │"
echo "        │    ╚██████╗██║  ██║                  │"
echo "        │     ╚═════╝╚═╝  ╚═╝                  │"
echo "        │                                      │"
echo "        │    claude-historian                  │"
echo "        │    Browse & resume Claude sessions   │"
echo "        │                                      │"
echo "        ╰──────────────────────────────────────╯"
echo ""

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

printf "  Detecting platform... "
echo "$platform"

# Get latest version from GitHub
printf "  Fetching latest version... "
version=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$version" ]; then
    echo "failed"
    echo "  Error: Could not determine latest version"
    exit 1
fi
echo "$version"

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Download binary
printf "  Downloading binary... "
download_url="https://github.com/$REPO/releases/download/$version/claude-historian-$platform"

if ! curl -fsSL "$download_url" -o "$INSTALL_DIR/claude-historian"; then
    echo "failed"
    echo "  Error: Download failed"
    exit 1
fi
echo "done"

# Make executable
chmod +x "$INSTALL_DIR/claude-historian"

# Create ch shortcut symlink
ln -sf "$INSTALL_DIR/claude-historian" "$INSTALL_DIR/ch"

echo ""
echo "  ✅ Installed successfully!"
echo ""
echo "  Usage:"
echo "    ch                  Launch session browser"
echo "    claude-historian    Same thing, longer name"
echo ""

# Check if install dir is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "  ⚠️  Add to your PATH:"
    echo "    export PATH=\"\$PATH:$INSTALL_DIR\""
    echo ""
fi
