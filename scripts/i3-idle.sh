#!/bin/bash

# Run xidlehook
xidlehook \
	`# Don't lock when there's a fullscreen application` \
	--not-when-fullscreen \
	`# Don't lock when there's audio playing` \
	--not-when-audio \
	`# Dim the screen after 60 seconds, undim if user becomes active` \
	--timer 900 \
	"xrandr --output '$PRIMARY_DISPLAY' --brightness .1" \
	"xrandr --output '$PRIMARY_DISPLAY' --brightness 1" \
	`# Undim & lock after 10 more seconds` \
	--timer 10 \
	"xrandr --output '$PRIMARY_DISPLAY' --brightness 1; i3lock" \
	'' \
	`# Finally, suspend an hour after it locks` \
	--timer 1800 \
	'systemctl suspend' \
	''
