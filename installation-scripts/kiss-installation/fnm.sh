#!/bin/bash

echo "========== Install fnm =========="
cargo install fnm --locked

export PATH="$HOME/.cargo/bin:$PATH"

fnm install --lts
fnm default lts-latest
