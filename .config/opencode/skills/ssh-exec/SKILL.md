---
name: ssh-exec
description: Execute commands on remote servers via SSH using the wrapper script. Use when user asks to run commands on remote hosts.
---

# SSH Remote Execution

## When to use

Use this skill when the user asks to:
- Execute a command on a remote server
- Check service status, logs, or configurations on a remote host
- Deploy or restart services remotely
- Inspect files or directories on remote machines

## Instructions

1. Confirm the **hostname** and **command** with the user before executing
2. Use the SSH wrapper script at `~/.config/opencode/scripts/ssh-run.sh`
3. Always quote the remote command to prevent shell expansion issues

## Usage Pattern

```bash
~/.config/opencode/scripts/ssh-run.sh <host> "<command>"
```

### Examples

| Host | Command | Purpose |
|------|---------|---------|
| `vmo3381` | `"ls -la /var/www"` | List web directory |
| `vmo3381` | `"systemctl status nginx"` | Check nginx status |
| `vmo3381` | `"tail -100 /var/log/app.log"` | View recent logs |
| `vmo3381` | `"docker ps"` | List running containers |

## Safety Rules

- **Never** run destructive commands (`rm -rf`, `DROP DATABASE`, etc.) without explicit user confirmation
- **Always** show the exact command that will be executed before running it
- For multi-command pipelines, explain each step
- If a command fails, report the error and suggest alternatives
