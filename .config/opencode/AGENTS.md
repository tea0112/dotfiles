# Global OpenCode Rules

When you need to run a command that starts a long-running process (test server, dev server, watcher, file watcher, `--watch`, `--ui`, Playwright, Vitest UI, etc.), DO NOT run it directly with `bash`.

Instead:
1. Use `task` with `background: true` to dispatch it as a background subagent
2. The background task runs in its own session and does not block you
3. You can continue other work while the server runs in the background
4. When you need the server output or to stop it, refer to the Background Job Board

This keeps the orchestrator context free for coordination work instead of blocking on a long-running process.
