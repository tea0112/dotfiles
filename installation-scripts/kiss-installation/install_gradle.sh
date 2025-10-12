#!/bin/bash

# A script to install the latest version of Gradle on Fedora Linux.
# This script should be run with sudo privileges.

# --- Configuration ---
# You can change this to a specific version if needed.
# Visit https://gradle.org/releases/ to find the latest version.
GRADLE_VERSION="8.8"

# --- Script Start ---

# 1. Check for root privileges
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root. Please use sudo."
   exit 1
fi

echo "--- Starting Gradle Installation ---"

# 2. Install prerequisites (wget, unzip, and a JDK)
echo "Step 1: Installing prerequisites (wget, unzip, Java 21 JDK)..."
dnf install -y wget unzip java-21-openjdk-devel
if [ $? -ne 0 ]; then
    echo "Error: Failed to install prerequisites. Aborting."
    exit 1
fi
echo "Action complete: Prerequisites installed successfully."

# 3. Download the specified Gradle version
echo "Step 2: Downloading Gradle v${GRADLE_VERSION}..."
wget "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" -P /tmp
if [ $? -ne 0 ]; then
    echo "Error: Failed to download Gradle. Please check the version number and your internet connection."
    exit 1
fi
echo "Action complete: Download complete."

# 4. Create an installation directory and unzip Gradle
echo "Step 3: Creating installation directory at /opt/gradle..."
mkdir -p /opt/gradle
echo "Action complete: Directory created."
echo "Unzipping Gradle archive..."
unzip -q -d /opt/gradle /tmp/gradle-${GRADLE_VERSION}-bin.zip
if [ $? -ne 0 ]; then
    echo "Error: Failed to unzip Gradle archive. Aborting."
    exit 1
fi
echo "Action complete: Gradle extracted to /opt/gradle/gradle-${GRADLE_VERSION}"

# 5. Configure environment variables in .zshrc
echo "Step 4: Configuring environment variables in your .zshrc..."

# Get the home directory of the user who invoked sudo or is the logged-in user
# This is more reliable than just checking $SUDO_USER.
REAL_USER=$(logname 2>/dev/null || echo "$SUDO_USER")
if [ -z "$REAL_USER" ]; then
    echo "Error: Could not determine the original user. Please run with 'sudo'."
    exit 1
fi

USER_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)

if [ -z "$USER_HOME" ]; then
    echo "Error: Could not find home directory for user '$REAL_USER'."
    exit 1
fi

ZSHRC_PATH="$USER_HOME/dotfiles/.zshrc"

if [ -f "$ZSHRC_PATH" ]; then
    if grep -q "export GRADLE_HOME" "$ZSHRC_PATH"; then
        echo "Action skipped: GRADLE_HOME is already present in $ZSHRC_PATH."
        echo "Please verify the configuration manually."
    else
        echo "Adding Gradle environment variables to $ZSHRC_PATH..."
        # Using tee as root to append to the user's file
        tee -a "$ZSHRC_PATH" > /dev/null <<EOT

# Gradle Environment Variables
export GRADLE_HOME=/opt/gradle/gradle-${GRADLE_VERSION}
export PATH=\${GRADLE_HOME}/bin:\${PATH}
EOT
        # Set correct ownership for the file, in case it was created by root
        chown "$REAL_USER":"$REAL_USER" "$ZSHRC_PATH"
        echo "Action complete: .zshrc updated successfully."
    fi
else
    echo "Warning: $ZSHRC_PATH not found. Skipping automatic configuration."
    echo "Please add the following lines to your shell configuration file manually:"
    echo
    echo "export GRADLE_HOME=/opt/gradle/gradle-${GRADLE_VERSION}"
    echo 'export PATH=${GRADLE_HOME}/bin:${PATH}'
fi

# 6. Clean up downloaded files
echo "Step 5: Cleaning up temporary files..."
rm /tmp/gradle-${GRADLE_VERSION}-bin.zip
echo "Action complete: Cleanup complete."

echo "--- Gradle Installation Successful! ---"
echo
echo "To apply the changes, please run:"
echo "source $ZSHRC_PATH"
echo "Or open a new terminal."
echo
echo "You can verify the installation by running:"
echo "gradle -v"


