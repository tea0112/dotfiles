#!/bin/bash
P="${1:-openai}"
F="$HOME/.local/share/opencode/auth.json"
T=$(jq -r ".${P}.access // empty" "$F")
[ -z "$T" ] && { echo "No token found for $P"; exit 1; }
E=$(echo "$T" | cut -d. -f2 | sed "s/-/+/g; s|_|/|g" | base64 -d 2>/dev/null | jq -r ".[\"https://api.openai.com/profile\"].email")
echo "OpenCode $P Account: $E"
