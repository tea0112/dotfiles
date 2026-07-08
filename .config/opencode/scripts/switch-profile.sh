#!/bin/bash
# Switch oh-my-opencode-slim profiles
# Profiles are stored as oh-my-opencode-slim.<name>.json (tracked in git)
# Active profile is oh-my-opencode-slim.json (gitignored)
#
# Usage: switch-profile.sh [default|aigateway|status]

set -e

PROFILE_DIR="$HOME/dotfiles/.config/opencode"
MAIN_FILE="$PROFILE_DIR/oh-my-opencode-slim.json"

show_status() {
  if [ ! -f "$MAIN_FILE" ]; then
    echo "No active profile. Run: oc-profile <name>"
    return
  fi
  if grep -q "aigateway/MiniMax" "$MAIN_FILE" 2>/dev/null; then
    echo "Current profile: aigateway (MiniMax-M2.7)"
  else
    echo "Current profile: default (multi-model)"
  fi
}

switch_to() {
  local profile="$1"
  local source="$PROFILE_DIR/oh-my-opencode-slim.${profile}.json"

  if [ ! -f "$source" ]; then
    echo "Error: Profile '$profile' not found at $source"
    echo "Available profiles:"
    ls "$PROFILE_DIR"/oh-my-opencode-slim.*.json 2>/dev/null | sed 's/.*oh-my-opencode-slim\.\(.*\)\.json/  - \1/'
    exit 1
  fi

  cp "$source" "$MAIN_FILE"
  echo "Switched to: $profile"
  echo "Run 'rf' to apply to ~/.config/opencode/"
}

case "${1:-status}" in
  status) show_status ;;
  *) switch_to "$1" ;;
esac