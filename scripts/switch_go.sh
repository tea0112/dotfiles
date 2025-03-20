#!/bin/bash

# Before run this
# Download the required Go versions:
#     wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
#     wget https://go.dev/dl/go1.23.4.linux-amd64.tar.gz
# Extract them to separate directories:
#     mkdir -p ~/.go/versions
#     wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz -O ~/.go/versions/go1.21.0.tar.gz
#     wget https://go.dev/dl/go1.23.4.linux-amd64.tar.gz -O ~/.go/versions/go1.23.4.tar.gz
#     
#     tar -C ~/.go/versions -xzf ~/.go/versions/go1.21.0.tar.gz
#     mv ~/.go/versions/go ~/.go/versions/go1.21.0
#     
#     tar -C ~/.go/versions -xzf ~/.go/versions/go1.23.4.tar.gz
#     mv ~/.go/versions/go ~/.go/versions/go1.23.4
#     
#     rm -rf ~/.go/versions/go1.21.0.tar.gz ~/.go/versions/go1.23.4.tar.gz

# Function to clean up existing Go paths from PATH
clean_go_path() {
    export PATH="$(echo "$PATH" | sed -e 's|:[^:]*/go/bin||g' -e 's|^[^:]*/go/bin:||')"
}

current_version="go1.23.4"
# Function to display the menu
show_menu() {
    echo "Please choose an option:"
    echo "1) Set alias go cmd to go 1.21.0"
    echo "2) Set alias go cmd to go 1.23.4"
    echo "2) Set alias go cmd to go 1.24.0"
    echo "3) Exit"
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

# Set the new Go version
gopath=path${current_version}
mkdir -p "$HOME/.go/${gopath}"
export GOROOT="${HOME}/.go/versions/${current_version}"
export PATH=$GOROOT/bin:$PATH
export GOPATH="$HOME/.go/${gopath}"
export PATH=$PATH:${gopath}/bin

# Save the selected version to a file
echo "export GOROOT=~/.go/versions/${current_version}" >~/.go/current_version
echo "export PATH=\$GOROOT/bin:\$PATH" >>~/.go/current_version
echo "export GOPATH=\$HOME/.go/${gopath}" >>~/.go/current_version
echo "export PATH=$PATH:${gopath}/bin" >>~/.go/current_version


cat ~/.go/current_version

# Verify the switch
echo "Switched to Go version: ${current_version}"
go version

# Run: ./switch_go.sh go1.21.0
echo '========= Please source .zshrc by zsh cmd ========='
