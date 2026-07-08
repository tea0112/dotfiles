# OpenCode Config

Template-based config generation. Set `OPENCODE_PROFILE`, run `rf`.

## Quick start

```bash
export OPENCODE_PROFILE=aigateway   # or default, heavy
rf                                   # generates ~/.config/opencode/
# no env set → falls back to default
```

## Profiles

| Profile | Model strategy | Slim | Openagent |
|---------|---------------|------|-----------|
| `default` | Per-agent mix | on | off |
| `aigateway` | All MiniMax-M2.7 | off | on |
| `heavy` | mimo-v2.5 top model | off | on |

## How it works

```
OPENCODE_PROFILE=aigateway rf
  → config.sh
    → generate-configs.sh
      → sources profiles/aigateway.env
      → envsubst templates/ → ~/.config/opencode/
```

## Directory structure

```
.config/opencode/
├── templates/              # tracked — JSON templates with $MODEL vars
│   ├── opencode.jsonc.tmpl
│   ├── oh-my-opencode-slim.json.tmpl
│   ├── oh-my-openagent.json.tmpl
│   └── tui.json.tmpl
├── profiles/               # tracked (.example) + gitignored (.env)
│   ├── default.env.example
│   ├── aigateway.env.example
│   └── heavy.env.example
├── scripts/
│   └── generate-configs.sh
├── skills/                 # shared across profiles
├── commands/
└── AGENTS.md
```

## Adding a profile

1. Create `profiles/<name>.env` with your model vars:

```bash
OC_TOP_MODEL=opencode-go/deepseek-v4-flash
OC_PLUGINS='"superpowers@git+https://github.com/obra/superpowers.git","opencode-websearch","oh-my-opencode-slim"'
OC_TUI_PLUGINS='"oh-my-openagent@latest","oh-my-opencode-slim"'
OC_PROVIDER_AIGATEWAY=1

OC_OH_MY_OPENCODE_SLIM_ENABLED=1
OC_OPENAGENT_ENABLED=0

OC_ORCHESTRATOR_MODEL=opencode-go/deepseek-v4-pro
OC_ORACLE_MODEL=opencode-go/mimo-v2.5-pro
# ... (all 14 slim model vars + openagent vars)
```

2. Optionally create `profiles/<name>.env.example` (tracked in git).

3. Set `OPENCODE_PROFILE=<name> && rf`.

## Secrets

`.env` files are gitignored. Only `.env.example` files are tracked.
`{env:VAR}` syntax in templates passes through to OpenCode runtime.
