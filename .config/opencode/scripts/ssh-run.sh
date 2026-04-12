#!/usr/bin/env bash
# .opencode/scripts/ssh-run.sh

HOST=$1
shift
CMD="$@"

ssh "$HOST" "$CMD"

