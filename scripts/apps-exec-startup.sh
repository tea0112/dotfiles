#!/bin/bash

if [[ -z "$(pgrep "$1")" ]]; 
then
	bash -c "$1" & 1>/dev/null 2>&1 true
fi
