#!/bin/bash

# Function to clean up existing Go paths from PATH
clean_go_path() {
    # Remove all Go-related paths: */go/bin, */.g/go/bin, ~/go/bin, etc.
    local cleaned_path
    cleaned_path="$(echo "$PATH" | tr ':' '\n' | grep -v -E '(go/bin|\.g/go/bin)$' | tr '\n' ':' | sed 's/:$//')"
    export PATH="$cleaned_path"
}

# Function to validate version format (goX.Y.Z)
validate_version() {
    local version=$1
    if [[ ! "$version" =~ ^go[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        return 1
    fi
    return 0
}

# Function to get list of installed Go versions
get_installed_versions() {
    local versions_dir="${HOME}/.go/versions"
    if [ ! -d "$versions_dir" ]; then
        return
    fi
    
    # Find all directories matching go* pattern and extract version numbers
    # Use portable approach that works on both GNU and BSD find
    find "$versions_dir" -maxdepth 1 -type d -name "go*" 2>/dev/null | \
        sed "s|^${versions_dir}/||" | sort -V
}

# Function to download and extract Go version if it doesn't exist
download_and_extract_go() {
    local version=$1
    local version_dir="${HOME}/.go/versions/${version}"
    local arch="linux-amd64"
    local tar_file="${HOME}/.go/versions/${version}.tar.gz"
    local download_url="https://go.dev/dl/${version}.${arch}.tar.gz"
    
    # Check if version already exists
    if [ -d "$version_dir" ]; then
        echo "Go version ${version} already exists at ${version_dir}"
        return 0
    fi
    
    # Validate version format
    if ! validate_version "$version"; then
        echo "Error: Invalid version format. Expected format: goX.Y.Z (e.g., go1.24.0)"
        return 1
    fi
    
    echo "Go version ${version} not found. Downloading and extracting..."
    
    # Create versions directory if it doesn't exist
    mkdir -p "${HOME}/.go/versions"
    
    # Download the Go version
    echo "Downloading from ${download_url}..."
    
    # Use curl if available (handles redirects seamlessly without connection errors)
    # Otherwise fall back to wget (which may show connection errors during redirects)
    if command -v curl >/dev/null 2>&1; then
        # curl handles redirects seamlessly with -L flag, no connection errors shown
        if ! curl -L -f --progress-bar -o "$tar_file" "$download_url"; then
            echo ""
            echo "Error: Failed to download Go version ${version}"
            echo "Please check if the version exists at https://go.dev/dl/"
            rm -f "$tar_file"
            return 1
        fi
        echo ""
    elif command -v wget >/dev/null 2>&1; then
        # wget shows "Failed to connect" error when go.dev redirects to dl.google.com
        # Redirect stderr through a filter to remove the connection error while keeping progress
        # Progress goes to stderr, so we need to filter stderr carefully
        local wget_stderr
        wget_stderr=$(mktemp)
        if wget --progress=bar:force "$download_url" -O "$tar_file" 2>"$wget_stderr"; then
            # Filter out "Failed to connect" lines but show other output
            grep -v "Failed to connect" "$wget_stderr" >&2 || true
            rm -f "$wget_stderr"
            # Verify file was downloaded successfully
            if [ ! -f "$tar_file" ] || [ ! -s "$tar_file" ]; then
                echo "Error: Download completed but file is missing or empty"
                rm -f "$tar_file"
                return 1
            fi
        else
            # Show filtered error output
            grep -v "Failed to connect" "$wget_stderr" >&2 || true
            rm -f "$wget_stderr"
            # Check if file exists (might have partially downloaded despite error)
            if [ ! -f "$tar_file" ] || [ ! -s "$tar_file" ]; then
                echo "Error: Failed to download Go version ${version}"
                echo "Please check if the version exists at https://go.dev/dl/"
                rm -f "$tar_file"
                return 1
            fi
        fi
    else
        echo "Error: Neither curl nor wget is available. Please install one of them."
        return 1
    fi
    
    # Extract the tar file
    echo "Extracting ${version}..."
    if ! tar -C "${HOME}/.go/versions" -xzf "$tar_file"; then
        echo "Error: Failed to extract Go version ${version}"
        rm -f "$tar_file"
        return 1
    fi
    
    # Move the extracted 'go' directory to the versioned name
    if [ -d "${HOME}/.go/versions/go" ]; then
        mv "${HOME}/.go/versions/go" "$version_dir"
    else
        echo "Error: Expected 'go' directory not found after extraction"
        rm -f "$tar_file"
        return 1
    fi
    
    # Clean up the tar file
    rm -f "$tar_file"
    
    echo "Successfully downloaded and extracted Go version ${version}"
    return 0
}

# Function to remove a Go version
remove_version() {
    local version=$1
    local version_dir="${HOME}/.go/versions/${version}"
    
    if [ ! -d "$version_dir" ]; then
        echo "Error: Go version ${version} not found"
        return 1
    fi
    
    # Safety check: prevent removal if it's the only version left
    local installed_versions
    mapfile -t installed_versions < <(get_installed_versions)
    local count=${#installed_versions[@]}
    if [ $count -le 1 ]; then
        echo "Error: Cannot remove the last remaining Go version. Please keep at least one version installed."
        return 1
    fi
    
    # Check if this is the currently active version
    local current_goroot
    if [ -f "${HOME}/.go/current_version" ]; then
        # Extract GOROOT value from the file
        current_goroot=$(grep "^export GOROOT=" "${HOME}/.go/current_version" | \
            sed 's/.*versions\///' | sed 's/["$]//g' | tr -d ' ' || true)
        if [ "$current_goroot" = "$version" ]; then
            echo "Warning: You are trying to remove the currently active version (${version})"
            echo -n "Are you sure you want to continue? (yes/no): "
            read confirm
            if [ "$confirm" != "yes" ]; then
                echo "Removal cancelled."
                return 1
            fi
        fi
    fi
    
    echo "Removing Go version ${version}..."
    if rm -rf "$version_dir"; then
        echo "Successfully removed Go version ${version}"
        return 0
    else
        echo "Error: Failed to remove Go version ${version}"
        return 1
    fi
}

# Function to display the menu dynamically based on installed versions
show_menu() {
    local installed_versions
    mapfile -t installed_versions < <(get_installed_versions)
    local count=${#installed_versions[@]}
    
    echo "Available Go versions:"
    echo ""
    
    if [ $count -eq 0 ]; then
        echo "No Go versions found in ~/.go/versions/"
        echo ""
    else
        local i=1
        for version in "${installed_versions[@]}"; do
            # Extract version number without 'go' prefix for display
            local version_num="${version#go}"
            echo "$i) Switch to go ${version_num}"
            ((i++))
        done
        echo ""
    fi
    
    echo "$((count + 1))) Enter version manually (e.g., go1.24.0)"
    if [ $count -gt 1 ]; then
        echo "$((count + 2))) Remove a version"
        echo "$((count + 3))) Exit"
    else
        echo "$((count + 2))) Exit"
    fi
}

# Function to handle the selected option
handle_option() {
    local choice=$1
    local installed_versions
    mapfile -t installed_versions < <(get_installed_versions)
    local count=${#installed_versions[@]}
    local manual_option=$((count + 1))
    local remove_option
    local exit_option
    
    # Determine option numbers based on whether remove option is available
    if [ $count -gt 1 ]; then
        remove_option=$((count + 2))
        exit_option=$((count + 3))
    else
        exit_option=$((count + 2))
    fi
    
    # Check if choice is a number
    if [[ ! "$choice" =~ ^[0-9]+$ ]]; then
        echo "Invalid option. Please enter a number."
        return 1
    fi
    
    # Handle exit option
    if [ "$choice" -eq "$exit_option" ]; then
        echo "Exiting..."
        exit 0
    fi
    
    # Handle remove option (only available if more than 1 version exists)
    if [ $count -gt 1 ] && [ "$choice" -eq "$remove_option" ]; then
        echo ""
        echo "Available versions to remove:"
        local i=1
        for version in "${installed_versions[@]}"; do
            local version_num="${version#go}"
            echo "$i) Remove go ${version_num}"
            ((i++))
        done
        echo ""
        echo "0) Cancel"
        echo "$((count + 1))) Exit"
        echo ""
        echo -n "Enter the number of the version to remove (or 0 to cancel, $((count + 1)) to exit): "
        read remove_choice
        
        if [[ ! "$remove_choice" =~ ^[0-9]+$ ]]; then
            echo "Invalid option. Please enter a number."
            return 1
        fi
        
        # Handle exit option
        if [ "$remove_choice" -eq $((count + 1)) ]; then
            echo "Exiting..."
            exit 0
        fi
        
        # Handle cancel option
        if [ "$remove_choice" -eq 0 ]; then
            echo "Removal cancelled."
            return 0
        fi
        
        if [ "$remove_choice" -ge 1 ] && [ "$remove_choice" -le "$count" ]; then
            local remove_index=$((remove_choice - 1))
            local version_to_remove="${installed_versions[$remove_index]}"
            
            # Prevent removal if it's the only version left
            local remaining_count=$((count - 1))
            if [ $remaining_count -eq 0 ]; then
                echo "Error: Cannot remove the last remaining Go version. Please keep at least one version installed."
                return 1
            fi
            
            if remove_version "$version_to_remove"; then
                echo ""
                echo "Version removed. Please run the script again to switch to another version."
                exit 0
            else
                return 1
            fi
        else
            echo "Invalid option. Please try again."
            return 1
        fi
    fi
    
    # Handle manual version entry
    if [ "$choice" -eq "$manual_option" ]; then
        echo -n "Enter Go version (e.g., go1.24.0): "
        read manual_version
        if validate_version "$manual_version"; then
            current_version="$manual_version"
            echo "You chose go version ${manual_version}"
            return 0
        else
            echo "Error: Invalid version format. Expected format: goX.Y.Z (e.g., go1.24.0)"
            return 1
        fi
    fi
    
    # Handle selection from installed versions
    if [ "$choice" -ge 1 ] && [ "$choice" -le "$count" ]; then
        local selected_index=$((choice - 1))
        current_version="${installed_versions[$selected_index]}"
        local version_num="${current_version#go}"
        echo "You chose go ${version_num} version"
        return 0
    fi
    
    echo "Invalid option. Please try again."
    return 1
}

# Main script logic
current_version=""

# Check if version is provided as command-line argument
if [ $# -ge 1 ]; then
    if validate_version "$1"; then
        current_version="$1"
        echo "Switching to Go version: ${current_version}"
    else
        echo "Error: Invalid version format: $1"
        echo "Expected format: goX.Y.Z (e.g., go1.24.0)"
        exit 1
    fi
else
    # Interactive mode: display menu and get user choice
    show_menu
    
    # Prompt the user for input
    echo -n "Enter your choice: "
    read choice
    
    # Handle the selected option
    if ! handle_option "$choice"; then
        exit 1
    fi
fi

# Ensure current_version is set
if [ -z "$current_version" ]; then
    echo "Error: No Go version selected"
    exit 1
fi

# Clean up existing Go paths from PATH first
clean_go_path

# Download and extract Go version if it doesn't exist
GOROOT="${HOME}/.go/versions/${current_version}"
if [ ! -d "$GOROOT" ]; then
    if ! download_and_extract_go "$current_version"; then
        echo "Error: Failed to download or extract Go version ${current_version}"
        exit 1
    fi
fi

# Set the new Go version
gopath=path${current_version}
mkdir -p "$HOME/.go/${gopath}"
export GOROOT="$GOROOT"
export PATH=$GOROOT/bin:$PATH
export GOPATH="$HOME/.go/${gopath}"
export PATH=$PATH:${GOPATH}/bin

# Save the selected version to a file
# First, clean PATH in the saved file by removing all Go paths
{
    echo "# Clean up existing Go paths from PATH"
    echo "export PATH=\"\$(echo \"\$PATH\" | tr ':' '\\n' | grep -v -E '(go/bin|\\.g/go/bin)\$' | tr '\\n' ':' | sed 's/:\$//')\""
    echo ""
    echo "# Set Go environment variables"
    echo "export GOROOT=\$HOME/.go/versions/${current_version}"
    echo "export PATH=\$GOROOT/bin:\$PATH"
    echo "export GOPATH=\$HOME/.go/${gopath}"
    echo "export PATH=\$PATH:\$GOPATH/bin"
} >~/.go/current_version


cat ~/.go/current_version

# Verify the switch
echo "Switched to Go version: ${current_version}"
go version

# Run: ./switch_go.sh go1.21.0
echo '========= Please source .zshrc by zsh cmd ========='
