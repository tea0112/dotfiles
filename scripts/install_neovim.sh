#!/usr/bin/env bash
set -euo pipefail

# Builds Neovim from source on supported Linux distributions.
# Supported package managers: apt-get, dnf, zypper, pacman.

NVIM_VERSION="${1:-}"

usage() {
  echo "Usage: $0 <neovim-version>"
  echo "Example: $0 v0.12.2"
}

if [[ -z "$NVIM_VERSION" ]]; then
  usage
  exit 1
fi

if [[ ! -r /etc/os-release ]]; then
  echo "Error: could not read /etc/os-release"
  exit 1
fi

# shellcheck disable=SC1091
source /etc/os-release

WORK_DIR="$(mktemp -d)"
REPO_DIR="$WORK_DIR/neovim"

cleanup() {
  rm -rf "$WORK_DIR"
}

trap cleanup EXIT

install_dependencies() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "==> Detected ${PRETTY_NAME:-Debian/Ubuntu} (apt-get)"
    sudo apt-get update
    sudo apt-get install -y \
      ninja-build \
      gettext \
      cmake \
      curl \
      build-essential \
      git
    return
  fi

  if command -v dnf >/dev/null 2>&1; then
    echo "==> Detected ${PRETTY_NAME:-Fedora} (dnf)"
    sudo dnf install -y \
      ninja-build \
      cmake \
      gcc \
      make \
      gettext \
      curl \
      glibc-gconv-extra \
      git
    return
  fi

  if command -v zypper >/dev/null 2>&1; then
    echo "==> Detected ${PRETTY_NAME:-openSUSE} (zypper)"
    sudo zypper install -y \
      ninja \
      cmake \
      gcc-c++ \
      gettext-tools \
      curl \
      git
    return
  fi

  if command -v pacman >/dev/null 2>&1; then
    echo "==> Detected ${PRETTY_NAME:-Arch Linux} (pacman)"
    sudo pacman -S --needed --noconfirm \
      base-devel \
      cmake \
      ninja \
      curl \
      git
    return
  fi

  echo "Error: unsupported Linux distribution or package manager"
  echo "Supported package managers: apt-get, dnf, zypper, pacman"
  exit 1
}

echo "==> Installing dependencies..."
install_dependencies

echo "==> Cloning Neovim into temporary directory: $WORK_DIR"
git clone https://github.com/neovim/neovim.git "$REPO_DIR"

cd "$REPO_DIR"

echo "==> Verifying version: $NVIM_VERSION"
if ! git rev-parse --verify --quiet "$NVIM_VERSION^{commit}" >/dev/null; then
  echo "Error: Neovim version '$NVIM_VERSION' was not found"
  exit 1
fi

echo "==> Checking out $NVIM_VERSION"
git checkout "$NVIM_VERSION"

echo "==> Building (Release)..."
make CMAKE_BUILD_TYPE=Release

echo "==> Installing to system..."
sudo make install

echo "==> Done:"
nvim --version | sed -n '1,3p'
