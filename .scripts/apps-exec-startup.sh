#!/bin/bash

if [[ -z "$(pgrep "$1")" ]]; 
then
	"$1" & >/dev/null 2>&1 true
fi
