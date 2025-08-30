To disable the ability for mouse movement to wake your Fedora KDE system from sleep, the typical solution is to configure the Linux kernel to ignore wake-up signals from your mouse's USB device. This setting is managed at the hardware level and not through the KDE Plasma desktop itself.

## Steps to Disable Mouse Wake-Up

1. **Identify the Mouse’s USB Device**
   - Run the command:
     ```bash
     cat /proc/bus/input/devices
     ```
   - Locate your mouse device and note its associated event or device path.

2. **List Wakeup-Enabled Devices**
   - Check which devices can wake your system:
     ```bash
     cat /proc/acpi/wakeup
     ```
   - You’ll see a list; note which entries say `enabled` and might correspond to your mouse (often labeled as USB or similar).

3. **Disable Wake for the Mouse/USB Device**
   - Disable wake for the correct device with:
     ```bash
     echo 'DEVICE' | sudo tee /proc/acpi/wakeup
     ```
   - Replace `DEVICE` with the identifier (such as `USB0`, `EHC1`, etc.) from the list above that matches your mouse.

4. **Optional: Make Permanent**
   - To apply this after each reboot, create a small script in `/etc/rc.local` or as a systemd unit file to execute the disabling command on startup.

To stop your Fedora KDE system from waking up due to mouse movement, the key device in your `/proc/acpi/wakeup` output is **XHCI**, which controls your USB ports—including your wireless mouse receivers.

## How to Disable Mouse Wake via XHCI

Run the following command in your terminal:

```bash
echo XHCI | sudo tee /proc/acpi/wakeup
```

This toggles XHCI from *enabled* to *disabled* for waking the system, meaning mouse movements connected via USB will no longer wake your system from sleep.

## Make it Permanent with a Systemd Service

The XHCI setting resets on each reboot. To persistently disable wake from mouse, create a systemd service:

1. Create the service file:
   ```bash
   sudo nano /etc/systemd/system/disable-xhci-wakeup.service
   ```
2. Paste the following content:
   ```
   [Unit]
   Description=Disable XHCI USB Wakeup

   [Service]
   Type=oneshot
   ExecStart=/bin/bash -c 'echo XHCI > /proc/acpi/wakeup'

   [Install]
   WantedBy=multi-user.target
   ```
3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start disable-xhci-wakeup.service
   sudo systemctl enable disable-xhci-wakeup.service
   ```

## Additional Notes

- This disables wake for all USB devices on XHCI, affecting all connected mice and keyboards via USB hubs.
- To revert, rerun the command above or stop/disable the systemd service.
- You may need to use a keyboard or power button to wake the system from sleep.

By disabling XHCI wake, your mouse will no longer wake your Fedora KDE system from sleep, providing the behavior you want.
