#!/bin/bash

echo '
# Before run this
# Download and Extract them to separate directories:
#     mkdir -p ~/.go/versions
#     wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz -O ~/.go/versions/go1.24.0.tar.gz
#     tar -C ~/.go/versions -xzf ~/.go/versions/go1.24.0.tar.gz
#     mv ~/.go/versions/go ~/.go/versions/go1.24.0
#     rm -rf ~/.go/versions/go1.24.0.tar.gz ~/.go/versions/go1.24.0.tar.gz
'

# Function to clean up existing Go paths from PATH
clean_go_path() {
    # Remove all Go-related paths: */go/bin, */.g/go/bin, ~/go/bin, etc.
    export PATH="$(echo "$PATH" | tr ':' '\n' | grep -v -E '(go/bin|\.g/go/bin)$' | tr '\n' ':' | sed 's/:$//')"
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
    
    echo "Go version ${version} not found. Downloading and extracting..."
    
    # Create versions directory if it doesn't exist
    mkdir -p "${HOME}/.go/versions"
    
    # Download the Go version
    echo "Downloading from ${download_url}..."
    if ! wget "$download_url" -O "$tar_file"; then
        echo "Error: Failed to download Go version ${version}"
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

current_version="go1.23.4"
# Function to display the menu
show_menu() {
    echo "Please choose an option:"
    echo "1) Set alias go cmd to go 1.21.0"
    echo "2) Set alias go cmd to go 1.23.4"
    echo "3) Set alias go cmd to go 1.24.0"
    echo "4) Set alias go cmd to go 1.25.5"
    echo "5) Exit"
}

# Function to handle the selected option
handle_option() {
    case $1 in
    1)
        echo "You chose go 1.21.0 version"
        current_version='go1.21.0'
        ;;
    2)
        echo "You chose go 1.23.4 version"
        current_version='go1.23.4'
        ;;
    3)
        echo "You chose go 1.24.0 version"
        current_version='go1.24.0'
        ;;
    4)
        echo "You chose go 1.25.5 version"
        current_version='go1.25.5'
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option. Please try again."
        ;;
    esac
}

# Display the menu
show_menu

# Prompt the user for input
echo -n "Enter your choice: "
read choice

# Handle the selected option
handle_option "$choice"

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
