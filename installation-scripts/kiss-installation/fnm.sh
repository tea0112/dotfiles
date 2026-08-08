#!/bin/bash

echo "========== Install fnm =========="
cargo install fnm --locked

export PATH="$HOME/.cargo/bin:$PATH"

fnm install --lts --use
fnm default lts-latest
