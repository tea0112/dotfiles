#!/bin/bash

bash ~/.custom_environment.sh > /dev/null 2>&1


UVX_PATH="$HOME/.local/bin/uvx"

exec $UVX_PATH --quiet minimax-coding-plan-mcp -y
