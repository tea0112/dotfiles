#!/bin/bash

process="$1"
if pgrep -x "$process"; then
    true
else
    $1
fi
