#!/bin/bash

i=1
tmux list-windows | cut -d: -f1 | while read winindex; do
	if ((winindex != i)); then
		tmux move-window -d -s "${winindex}" -t $i
	fi
	((i++))
done
