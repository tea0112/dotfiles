#!/bin/bash

SEARCH="$1"

if [ "$SEARCH" = "" ]; then
	exit 1
fi

ids=$(
	xinput --list | awk -v search="$SEARCH" \
		'$0 ~ search {match($0, /id=[0-9]+/);\
                  if (RSTART) \
                    print substr($0, RSTART+3, RLENGTH-3)\
                 }'
)

for id in $ids; do
	xinput set-prop "${id}" "libinput Accel Speed" 1 2>/dev/null
done
