#!/bin/bash

# Check if script is run as root/sudo
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root. Please use: sudo $0"
   exit 1
fi

echo "--- Starting iPad Connection Reset ---"

# 1. Stop the communication daemon
echo "[1/4] Stopping usbmuxd..."
systemctl stop usbmuxd

# 2. Reset the kernel module
echo "[2/4] Resetting ipheth module..."
modprobe -r ipheth
sleep 1
modprobe ipheth

# 3. Restart the communication daemon
echo "[3/4] Starting usbmuxd..."
systemctl start usbmuxd

# 4. Attempt to pair
echo "[4/4] Attempting to pair (Check iPad for 'Trust' prompt)..."
sleep 2
# We use sudo -u to run this as your actual user, not root, 
# so the pairing certificates are stored in your home directory.
sudo -u $SUDO_USER idevicepair pair

echo "--- Process Complete ---"
echo "Check Dolphin's sidebar or type afc:// in the address bar."
