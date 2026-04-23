#!/bin/bash

# 1. Dynamically get the Windows username (No hardcoding)
WINDOWS_USER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r\n')

# 2. Construct the path
# Note: If your OneDrive is in a different location, adjust the path after /$WINDOWS_USER/
SCREENSHOT_DIR="/mnt/c/Users/$WINDOWS_USER/OneDrive/Pictures/Screenshots"

# 3. Get the latest file
LATEST_FILE=$(/usr/bin/ls -t1 "$SCREENSHOT_DIR" | /usr/bin/head -1)

# 4. Output the path with quotes (handles spaces in filenames)
if [ -n "$LATEST_FILE" ]; then
    echo -n "$SCREENSHOT_DIR/$LATEST_FILE"
fi
