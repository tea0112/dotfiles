#!/bin/bash

if [[ ! -f "/usr/bin/zsh" ]]; then
    echo "ZSH doesn't exist"
    exit 0;
fi

sudo locale-gen "en_US.UTF-8"
sudo add-apt-repository ppa:neovim-ppa/unstable
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget fd-find ripgrep python3-pip wmctrl python3-pip python3-virtualenv python3.10-venv xclip aria2 unzip build-essential zsh tmux xsel rofi polybar mpv vlc qbittorrent telegram-desktop gnome-tweaks goldendict gnome-shell-extension-manager jq neovim -y

# nvm
get_repo_version="$HOME/dotfiles/scripts/get_repo_version.sh"
version=$($get_repo_version nvm-sh/nvm)
curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${version}/install.sh" | bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm i node
nvm use node

# Go
sudo whoami
version=$(curl -s https://go.dev/dl/ | grep 'go.*.linux-amd64.tar.gz' -m1 -o)
wget -O "/tmp/$version" "https://dl.google.com/go/${version}"
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf "/tmp/$version"
export PATH=$PATH:/usr/local/go/bin

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "/home/${USER}/.cargo/env"

cargo install exa
cargo install zoxide

pip install cmake

# docker
if [ "$1" = "docker" ]; then
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
	sudo usermod -aG docker thai
	sudo docker run -d --restart=always -e 'SILENT=true' -p 56789:8000 sadeghhayeri/green-tunnel
fi
