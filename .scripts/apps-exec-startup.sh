#!/bin/bash

function run() {
    is_existing=$(pgrep "$1")
	if [[ -z "${is_exising}" ]]; then
      flameshot &	2>>/dev/null
	fi
}
