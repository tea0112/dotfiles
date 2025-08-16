#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi

PROJECT_NAME=$1
TOOLS_DIR="$HOME/go-tools"  # Change this if your directory is elsewhere
TOOLS_FILE="${TOOLS_DIR}/${PROJECT_NAME}-go-tools.txt"

if [ ! -f "$TOOLS_FILE" ]; then
  echo "Tool list not found for project '${PROJECT_NAME}': $TOOLS_FILE"
  exit 1
fi

echo "Using Go version: $(go version)"
echo "Installing tools for '${PROJECT_NAME}' from $TOOLS_FILE ..."

while read -r tool; do
  [[ -z "$tool" || "$tool" =~ ^# ]] && continue

  if [[ "$tool" == *:* ]]; then
    # Custom install command, format: tool:command
    TOOL_NAME="${tool%%:*}"
    INSTALL_CMD="${tool#*:}"
    echo "Running custom install for $TOOL_NAME..."
    eval "$INSTALL_CMD"
  else
    # Standard go install
    echo "go install $tool ..."
    go install "$tool"
  fi

done < "$TOOLS_FILE"

echo "Done installing tools for '$PROJECT_NAME'."

