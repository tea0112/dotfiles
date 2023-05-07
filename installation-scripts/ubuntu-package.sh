#!/bin/bash

if [[ ! -f "/usr/bin/zsh" ]]; then
    echo "ZSH doesn't exist"
    echo "You should run this script by ZSH!"
    exit 0
fi

# template
#echo "_____________________________________________________"
#read -p "?" confirm
#case $confirm in
#y)
#    ;;
#*)
#    echo "you chose NO"
#    ;;
#esac

echo "_____________________________________________________"
read -p "Generate en_US.UTF-8?" confirm
case $confirm in
y)
    sudo locale-gen "en_US.UTF-8"
    ;;
*)
    echo "You didn't choose!"
    ;;
esac

echo "_____________________________________________________"
read -p "Add neovim unstable ppa?" confirm
case $confirm in
y)
    sudo add-apt-repository ppa:neovim-ppa/unstable
    sudo apt update && sudo apt upgrade -y
    ;;
*)
    echo "you chose NO"
    ;;
esac

echo "_____________________________________________________"
read -p "Install package?" confirm
case $confirm in
y)
    sudo apt install curl jq wget fd-find ripgrep python3-pip wmctrl python3-pip python3-virtualenv python3-venv xclip aria2 unzip build-essential zsh tmux xsel neovim -y
    ;;
*)
    echo "you chose NO"
    ;;
esac

# nvm
echo "_____________________________________________________"
read -p "Install nvm?" confirm
case $confirm in
y)
    get_repo_version="$HOME/dotfiles/scripts/get_repo_version.sh"
    version=$($get_repo_version nvm-sh/nvm)
    curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${version}/install.sh" | bash

    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
    ;;
*)
    echo "you chose NO"
    ;;
esac

echo "_____________________________________________________"
read -p "Install nodejs with nvm?" confirm
case $confirm in
y)
    nvm i node
    nvm use node
    ;;
*)
    echo "you chose NO"
    ;;
esac

# Go
echo "_____________________________________________________"
read -p "Install golang?" confirm
case $confirm in
y)
    sudo whoami
    version=$(curl -s https://go.dev/dl/ | grep 'go.*.linux-amd64.tar.gz' -m1 -o)
    wget -O "/tmp/$version" "https://dl.google.com/go/${version}"
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf "/tmp/$version"
    export PATH=$PATH:/usr/local/go/bin
    ;;
*)
    echo "you chose NO"
    ;;
esac

# rust
echo "_____________________________________________________"
read -p "Install rust?" confirm
case $confirm in
y)
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source "/home/${USER}/.cargo/env"

    cargo install exa
    cargo install zoxide
    cargo install bat
    ;;
*)
    echo "you chose NO"
    ;;
esac

echo "_____________________________________________________"
read -p "cmake?" confirm
case $confirm in
y)
    pip install cmake
    ;;
*)
    echo "you chose NO"
    ;;
esac

# docker
echo "_____________________________________________________"
read -p "docker ?" confirm
case $confirm in
y)
    echo "ok"
    sudo apt-get install \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    sudo mkdir -m 0755 -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    read -p "enter the user for docker group: " user
    sudo usermod -aG docker $user
    ;;
*)
    echo "you chose NO"
    ;;
esac

echo "_____________________________________________________"
read -p "greentunnel?" confirm
case $confirm in
y)
    sudo docker run -d --restart=always -e 'SILENT=true' -p 56789:8000 sadeghhayeri/green-tunnel
    ;;
*)
    echo "you chose NO"
    ;;
esac
