#!/bin/bash

# Show list props
# xinput list-props DEVICE_ID

DEVICE_ID="SynPS/2 Synaptics TouchPad"

# tapping enabled
xinput set-prop "${DEVICE_ID}" "libinput Tapping Enabled" 1
# natural scrolling enabled
xinput set-prop "${DEVICE_ID}" "libinput Natural Scrolling Enabled" 1
# acceleration speed
xinput set-prop "${DEVICE_ID}" "libinput Accel Speed" -0.2
# acceleration profile
