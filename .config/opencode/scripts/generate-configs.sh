#!/bin/bash
# Generate OpenCode configs from templates + profile env var
# Called by: rf (config.sh)
# Usage:     OPENCODE_PROFILE=aigateway rf

set -euo pipefail

export PROFILE_DIR="$HOME/dotfiles/.config/opencode/profiles"
export TEMPLATE_DIR="$HOME/dotfiles/.config/opencode/templates"
export OUT_DIR="$HOME/.config/opencode"

PROFILE="${OPENCODE_PROFILE:-default}"
ENV_FILE="$PROFILE_DIR/$PROFILE.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Profile '$PROFILE' not found, falling back to default"
  PROFILE="default"
  ENV_FILE="$PROFILE_DIR/default.env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: No .env file found. Run: cp profiles/default.env.example profiles/default.env"
  exit 1
fi

export PROFILE
set -a
source "$ENV_FILE"
set +a

export schema='$schema'

fill_default() {
  local varname="$1"
  local default="${!varname:-}"
  if [ -z "$default" ]; then
    export "$varname=$OC_OPENAGENT_MODEL"
  fi
}

for var in \
  OC_OPENAGENT_SISYPHUS_MODEL \
  OC_OPENAGENT_HEPHAESTUS_MODEL \
  OC_OPENAGENT_ORACLE_MODEL \
  OC_OPENAGENT_EXPLORE_MODEL \
  OC_OPENAGENT_MULTIMODAL_LOOKER_MODEL \
  OC_OPENAGENT_PROMETHEUS_MODEL \
  OC_OPENAGENT_METIS_MODEL \
  OC_OPENAGENT_MOMUS_MODEL \
  OC_OPENAGENT_ATLAS_MODEL \
  OC_OPENAGENT_SISYPHUS_JUNIOR_MODEL \
  OC_OPENAGENT_CAT_VISUAL_ENGINEERING_MODEL \
  OC_OPENAGENT_CAT_ULTRABRAIN_MODEL \
  OC_OPENAGENT_CAT_DEEP_MODEL \
  OC_OPENAGENT_CAT_ARTISTRY_MODEL \
  OC_OPENAGENT_CAT_QUICK_MODEL \
  OC_OPENAGENT_CAT_UNSPECIFIED_LOW_MODEL \
  OC_OPENAGENT_CAT_UNSPECIFIED_HIGH_MODEL \
  OC_OPENAGENT_CAT_WRITING_MODEL; do
  fill_default "$var"
done

if [ "${OC_PROVIDER_AIGATEWAY:-0}" = "1" ]; then
  export OC_PROVIDER_BLOCK='{"aigateway":{"npm":"@ai-sdk/openai-compatible","name":"AI Gateway","options":{"baseURL":"{env:AI_GATEWAY_BASE_URL}","apiKey":"{env:AI_GATEWAY_API_KEY}"},"models":{"MiniMax/MiniMax-M2.7":{"name":"MiniMax/MiniMax-M2.7"},"zai-org/GLM-4.7-cc":{"name":"zai-org/GLM-4.7-cc"}}}}'
else
  export OC_PROVIDER_BLOCK='{}'
fi

export OC_PLUGINS_VAL="[${OC_PLUGINS:-}]"
export OC_TUI_PLUGINS_VAL="[${OC_TUI_PLUGINS:-}]"

mkdir -p "$OUT_DIR"

generate() {
  local tmpl="$1"
  local out="$2"
  envsubst < "$tmpl" | \
    sed "s|__OC_PLUGINS__|$OC_PLUGINS_VAL|g" | \
    sed "s|__OC_PROVIDER_BLOCK__|$OC_PROVIDER_BLOCK|g" | \
    sed "s|__OC_TUI_PLUGINS__|$OC_TUI_PLUGINS_VAL|g" \
    > "$out"
}

echo "Generating OpenCode config with profile: $PROFILE"

generate "$TEMPLATE_DIR/opencode.jsonc.tmpl" "$OUT_DIR/opencode.jsonc"

if [ "${OC_OH_MY_OPENCODE_SLIM_ENABLED:-0}" = "1" ]; then
  envsubst < "$TEMPLATE_DIR/oh-my-opencode-slim.json.tmpl" > "$OUT_DIR/oh-my-opencode-slim.json"
else
  rm -f "$OUT_DIR/oh-my-opencode-slim.json"
fi

if [ "${OC_OPENAGENT_ENABLED:-0}" = "1" ]; then
  envsubst < "$TEMPLATE_DIR/oh-my-openagent.json.tmpl" > "$OUT_DIR/oh-my-openagent.json"
else
  rm -f "$OUT_DIR/oh-my-openagent.json"
fi

generate "$TEMPLATE_DIR/tui.json.tmpl" "$OUT_DIR/tui.json"
