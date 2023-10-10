#!/bin/bash

use_on_only_internal_screen() {
	screens=($(xrandr | grep '\bconnected' | awk '{print $1}'))
	screens_len="${#screens[@]}"

	for ((not_internal = 1; not_internal < screens_len; not_internal++)); do
		screen="${screens[$not_internal]}"

		if [[ "${screen}" != "LVDS-0" ]]; then
			xrandr --output "${screen}" --off
		fi
	done
}

use_on_only_internal_screen
