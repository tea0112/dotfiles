#!/bin/bash

caps_lock_state=$(xset q | grep Caps | awk '{print $4}')

if [[ ${caps_lock_state} == 'off' ]]; then
	echo "${caps_lock_state}"
	setxkbmap -option caps:super
	notify-send "DONE!"
else
	xdotool key Caps_Lock
	setxkbmap -option caps:super
	notify-send "DONE!"
fi
