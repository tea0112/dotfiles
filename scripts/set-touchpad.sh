#!/bin/bash

# Show list props
# xinput list-props DEVICE_ID

DEVICE_ID=$1

# tapping enabled
xinput set-prop "${DEVICE_ID}" 298 1
# natural scrolling enabled
xinput set-prop "${DEVICE_ID}" 275 1
# acceleration speed
#xinput set-prop "${DEVICE_ID}" 292 -0.3
# acceleration profile
