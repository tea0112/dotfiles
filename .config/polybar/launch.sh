#!/bin/bash

config_path=~/.config/polybar/config.ini

killall -q polybar
if type "xrandr"; then
	for m in $(xrandr --query | grep " connected" | cut -d" " -f1); do
		MONITOR=$m polybar --reload mybar --config=$config_path &
	done
else
	polybar --reload mybar --config=$config_path &
fi
