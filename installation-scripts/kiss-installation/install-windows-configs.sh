#!/usr/bin/env bash
set -euo pipefail

DOTFILES="$HOME/dotfiles"
WIN_HOME="$(wslpath "$(powershell.exe -NoProfile -Command '$env:USERPROFILE' | tr -d '\r')")"

sync_dir() {
  local src="$1"
  local dst="$2"
  local name="$3"

  if [ -d "$src" ]; then
    mkdir -p "$dst"
    rsync -a --delete "$src/" "$dst/"
    echo "Synced $name"
  else
    echo "Skipped $name: missing $src"
  fi
}

copy_file() {
  local src="$1"
  local dst="$2"
  local name="$3"

  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "Copied $name"
  else
    echo "Skipped $name: missing $src"
  fi
}

echo "Windows home: $WIN_HOME"

sync_dir "$DOTFILES/.config/nvim" "$WIN_HOME/AppData/Local/nvim" "Neovim"
sync_dir "$DOTFILES/.config/zed" "$WIN_HOME/AppData/Roaming/Zed" "Zed"
copy_file "$DOTFILES/.config/wezterm/wezterm.lua" "$WIN_HOME/.wezterm.lua" "WezTerm"
