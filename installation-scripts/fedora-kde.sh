#!/bin/bash

echo "_____________________________________________________"
read -r -p "Do you want to install Fedora essential packages?[y]" confirm
case $confirm in
y)
	sudo dnf install https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
	sudo dnf makecache
	sudo dnf5 group upgrade core
	sudo dnf config-manager --set-enabled fedora-cisco-openh264
	sudo dnf install gstreamer1-plugin-openh264 mozilla-openh264
	sudo dnf install zsh
	sudo dnf copr enable alternateved/eza
	sudo dnf install @development-tools alacritty cmake eza zoxide automake gcc gcc-c++ kernel-devel mpv ripgrep qbittorrent okular audacity htop vlc vim psql postgresql-contrib postgresql goldendict libavcodec-freeworld
    sudo dnf -y install dnf-plugins-core
    sudo dnf-3 config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
    sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    # typing
    sudo dnf install fcitx5 fcitx5-configtool fcitx5-gtk fcitx5-qt fcitx5-autostart fcitx5-unikey
    flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install golang?" confirm
case $confirm in
y)
	./kiss-installation/go.sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install rust?" confirm
case $confirm in
y)
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source "/home/${USER}/.cargo/env"

	cargo install --locked ripgrep_all
	;;
*)
	echo "you chose NO"
	;;
esac

mkdir ~/.config -p

echo ".------------------------------------------------."
echo "|                  ZSH as default                |"
echo "'------------------------------------------------'"
read -r -p "set zsh as default shell?" answer
case $answer in
y)
	chsh -s $(which zsh)
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                  starship                      |"
echo "'------------------------------------------------'"
read -r -p "Download and Install startship?" confirm
case $confirm in
y)
	curl -sS https://starship.rs/install.sh | sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|               tmux tpm plugin                  |"
echo "'------------------------------------------------'"
read -r -p "Clone tmux tpm plugin?" confirm
case $confirm in
y)
	./kiss-installation/tmux-plugin.sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|             Clone zsh plugins                  |"
echo "'------------------------------------------------'"
read -r -p "Clone zsh ohmyzsh, autosuggestions, zsh-syntax-highlighting, powerlevel10k?" confirm
case $confirm in
y)
	./kiss-installation/clone-zsh-plugins.sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                     font                       |"
echo "'------------------------------------------------'"
read -r -p "Install Caskaydia Cove Nerd Font?" confirm
case $confirm in
y)
	./kiss-installation/font.sh
	;;
*)
	echo "you chose NO"
	;;
esac

./config.sh
