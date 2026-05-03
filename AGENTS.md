# AGENTS.md

## Repo Shape
- This is a personal dotfiles repo, not an app with one build/test entrypoint.
- `.config/nvim` is a Git submodule for `git@github.com:tea0112/nvim.git`; treat Neovim changes as changes to that nested repo.
- Neovim starts at `.config/nvim/init.vim`, which loads `.config/nvim/lua/init.lua`; lazy.nvim plugin specs come from `.config/nvim/lua/plugins/`.
- `git submodule status` currently fails because `.config/opencode/skills/obsidian-skills` is a gitlink with no `.gitmodules` entry. Target known submodules directly, for example `git -C .config/nvim status`.
- Install scripts assume the checkout lives at `~/dotfiles`; many commands in `installation-scripts/` also assume the current directory is `installation-scripts`.

## Setup And Install
- Use `git submodule update --init .config/nvim` to fetch the Neovim submodule; avoid broad recursive submodule commands until the stale `obsidian-skills` gitlink is fixed.
- Run `bash install-ubuntu.sh`, `bash install-arch.sh`, or `bash config.sh` from `installation-scripts/`, not from the repo root.
- `installation-scripts/config.sh` removes existing home config paths and copies repo files into `~`; do not run it without clear user approval.
- `installation-scripts/install-*.sh` are interactive and may install packages, change the shell, clone plugins, and call `config.sh`.
- `installation-scripts/install-general.sh` mostly symlinks configs; `installation-scripts/config.sh` mostly copies configs.

## Checks
- There is no repo-wide `make test`, `make lint`, package manager script, or CI workflow in this checkout.
- For shell changes, run `shellcheck <path>`; root `.shellcheckrc` disables `SC1090`.
- Format shell scripts with `shfmt -w <path>` when changing them.
- For Neovim Lua changes, run `stylua .config/nvim/lua`; config is `.config/nvim/.stylua.toml`.
- If Neovim keymaps change, update `.config/nvim/KEYBINDINGS.md` with `:KeymapNoteGenerate`; do not hand-edit the generated block.

## OpenCode Files
- `.config/opencode/opencode.jsonc` is JSONC, so keep comments and do not rewrite it as strict JSON.
- `installation-scripts/config.sh` replaces `~/.config/opencode/{AGENTS.md,opencode.jsonc,opencode-notifier.json,minimax-wrapper.sh,agents,commands,scripts,skills}` from this repo.
- `.config/opencode/minimax-wrapper.sh` reads `~/.custom_environment.sh`; set `MINIMAX_MCP_ENABLED=0` there to disable the MiniMax MCP.
- Keep Atlassian MCP read-only in `opencode.jsonc`; it currently disables add/create/edit/transition/update tools.

## Secrets And Pushes
- `.custom_environment.sh` is ignored; keep real API keys, DB values, and local-only env out of git. Only edit the example files unless the user asks otherwise.
- The repo contains a global `pre-push` hook template that blocks pushes to `main`/`master` with a TTY confirmation code. Agents must ask the user before any such push.
