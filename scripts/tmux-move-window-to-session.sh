#!/bin/bash
# Move the current window to another session, picked with fzf.
# Designed to run inside a tmux display-popup: tmux display-popup -E ... this-script.sh

CURRENT_SESSION="$(tmux display-message -p '#{session_name}')"

# List other sessions (exclude current) so you can't move a window onto itself.
other_sessions="$(tmux list-sessions -F '#{session_name}' | grep -v "^${CURRENT_SESSION}$")"

if [ -z "$other_sessions" ]; then
	tmux display-message 'No other sessions to move the window to'
	exit 1
fi

target="$(printf '%s\n' "$other_sessions" |
	fzf --prompt='Move window to> ' --height=100% --reverse --no-sort)"

# Esc / empty selection -> abort.
[ -z "$target" ] && exit 0

if ! tmux move-window -d -t "$target"; then
	tmux display-message 'Move failed (only window in the session?)'
	exit 1
fi

tmux switch-client -t "$target"
