#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s file1.mkv [file2.mkv ...]\n' "$(basename "$0")"
}

if ! command -v ffmpeg >/dev/null 2>&1; then
  printf 'Error: ffmpeg is not installed.\n' >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  usage >&2
  exit 1
fi

for input in "$@"; do
  if [ ! -f "$input" ]; then
    printf 'Skip: file not found: %s\n' "$input" >&2
    continue
  fi

  dir=$(dirname "$input")
  base=$(basename "$input")
  name=${base%.*}
  output="$dir/$name.whisper.mp3"

  printf 'Converting: %s\n' "$input"
  ffmpeg -hide_banner -y \
    -i "$input" \
    -map 0:a:0 \
    -vn \
    -ac 1 \
    -ar 16000 \
    -c:a libmp3lame \
    -b:a 64k \
    "$output"

  printf 'Created: %s\n' "$output"
done
