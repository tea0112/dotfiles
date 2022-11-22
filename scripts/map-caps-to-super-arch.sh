#!/bin/bash

caps_lock_state=$(xset q | grep Caps | awk '{print $4}')

reset_picom () {
	exist=$(pgrep picom)
	if [ -z "${exist}" ]; then
		picom -b
	else
        kill "${exist}"
	fi
}

if [[ ${caps_lock_state} == 'off' ]]; then
	setxkbmap -option caps:super
    reset_picom
	notify-send "DONE!"
else
	xdotool key Caps_Lock
	setxkbmap -option caps:super
    reset_picom
	notify-send "DONE!"
fi
