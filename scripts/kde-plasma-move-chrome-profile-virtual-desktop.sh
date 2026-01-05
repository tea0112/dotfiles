#!/bin/bash
# Function: Launch, Grab Focus, Move
launch_and_move() {
    local PROFILE="$1"
    local TARGET_DESKTOP="$2"
    
    echo "Processing $PROFILE..."

    # 1. Launch the profile (or focus it if already open)
    # We DO NOT use the custom --class flag anymore, as it is ignored anyway.
    google-chrome --profile-directory="$PROFILE" &
    
    # 2. Wait for the window to appear and grab focus
    # Increase sleep slightly if your computer is slow
    sleep 1.5 
    
    # 3. Get the ID of the CURRENTLY ACTIVE window (which should be the one we just launched)
    local WID
    WID=$(kdotool getactivewindow)

    # 4. Double check this is actually a Chrome window to be safe
    # We check if the window class contains "google-chrome"
    local W_CLASS
    W_CLASS=$(kdotool getwindowclassname "$WID")
    
    if [[ "$W_CLASS" == *"google"* || "$W_CLASS" == *"chrome"* ]]; then
        echo "  - Found Active Window ($W_CLASS). Moving to Desktop $TARGET_DESKTOP."
        kdotool set_desktop_for_window "$WID" "$TARGET_DESKTOP"
    else
        echo "  - Warning: Active window is $W_CLASS (not Chrome). Skipping move to avoid accidents."
    fi
}

# --- Execution List ---
# IMPORTANT: Do not touch the mouse/keyboard while this runs!

launch_and_move "Default"   1
launch_and_move "Profile 7" 2
launch_and_move "Profile 6" 3
launch_and_move "Profile 3" 3
launch_and_move "Profile 5" 7

echo "Done."
