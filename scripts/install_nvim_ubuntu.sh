#!/usr/bin/env bash
set -e

# ===== CONFIG =====
TARGET_DIR="${1:-$HOME/src}"   # default if not provided
NPROC=$(nproc)

echo "==> Using target directory: $TARGET_DIR"

# ===== VALIDATION =====
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# ===== INSTALL DEPS =====
echo "==> Installing dependencies..."
sudo apt update
sudo apt install -y \
  build-essential \
  cmake \
  curl \
  gettext \
  ninja-build \
  git

# ===== CLONE =====
echo "==> Cloning Neovim into $TARGET_DIR..."
rm -rf neovim
git clone https://github.com/neovim/neovim.git
cd neovim

# ===== STABLE =====
echo "==> Checkout stable..."
git checkout stable

# ===== BUILD (Release only) =====
echo "==> Building (Release)..."
make CMAKE_BUILD_TYPE=Release

# ===== INSTALL =====
echo "==> Installing to system..."
sudo make install

# ===== VERIFY =====
echo "==> Done:"
nvim --version | head -n 1
