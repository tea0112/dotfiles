#!/bin/bash

if [ -f "$HOME/.custom_environment.sh" ]; then
  . "$HOME/.custom_environment.sh" < /dev/null > /dev/null 2>&1
fi

UVX_PATH="$HOME/.local/bin/uvx"

shopt -s nullglob
for server_py in "$HOME"/.cache/uv/archive-v0/*/lib/python*/site-packages/minimax_mcp/server.py; do
  archive_root="${server_py%/lib/python*/site-packages/minimax_mcp/server.py}"
  if [ -x "$archive_root/bin/python" ]; then
    exec "$archive_root/bin/python" -c 'from minimax_mcp.server import mcp; mcp.run()'
  fi
done

exec "$UVX_PATH" --quiet --from minimax-coding-plan-mcp python -c 'from minimax_mcp.server import mcp; mcp.run()'
