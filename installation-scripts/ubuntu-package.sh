#!/bin/bash

mkdir -p ~/.local/bin
# if [[ ! -f "/usr/bin/zsh" ]]; then
#     echo "ZSH doesn't exist"
#     echo "You should run this script by ZSH!"
#     exit 0
# fi

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
read -r -p "Generate en_US.UTF-8?" confirm
case $confirm in
y)
	sudo locale-gen "en_US.UTF-8"
	;;
*)
	echo "You didn't choose!"
	;;
esac

echo "_____________________________________________________"
read -p "Install essential package for Kubuntu X11?" confirm
case $confirm in
y)
	sudo add-apt-repository ppa:aslatter/ppa -y
	sudo apt install vim vim-gtk gcc curl git extra-cmake-modules libcanberra-gtk-module libcanberra-gtk3-module alacritty pandoc poppler-utils ffmpeg ripgrep curl jq wget fd-find ripgrep python3-pip wmctrl python3-pip python3-virtualenv python3-venv xclip aria2 unzip build-essential zsh tmux xsel goldendict gettext fzf fonts-noto-color-emoji libxcb-cursor0 xdotool ripgrep vim flatpak -y

	sudo apt install gnome-software-plugin-flatpak -y

	flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -p "Install package for i3wm dependencies?" confirm
case $confirm in
y)
	sudo apt install copyq blueman flameshot picom rofi feh gnome-clocks -y
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -p "Do you want to add and install ppa:jonathonf/vim?" confirm
case $confirm in
y)
	sudo add-apt-repository ppa:jonathonf/vim
	sudo apt update
	sudo apt install vim
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -p "Do you want to add and install neovim unstable ppa?" confirm
case $confirm in
y)
	sudo add-apt-repository ppa:neovim-ppa/unstable
	sudo apt update
	sudo apt install neovim
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -p "Install essential package for WSL Ubuntu?" confirm
case $confirm in
y)
	sudo apt install vim vim-gtk libcanberra-gtk-module libcanberra-gtk3-module pandoc poppler-utils ffmpeg ripgrep curl jq wget fd-find ripgrep python3-pip python3-pip python3-virtualenv python3-venv xclip aria2 unzip build-essential zsh tmux xsel gettext fzf libxcb-cursor0 xdotool ripgrep vim tesseract-ocr-eng -y
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -p "Install essential package for Ubuntu X11?" confirm
case $confirm in
y)
	sudo add-apt-repository ppa:aslatter/ppa -y
	sudo apt install vim vim-gtk gcc curl git libcanberra-gtk-module libcanberra-gtk3-module gnome-tweaks gnome-shell-extension-manager alacritty pandoc poppler-utils ffmpeg ripgrep curl jq wget fd-find ripgrep python3-pip wmctrl python3-pip python3-virtualenv python3-venv xclip aria2 unzip build-essential zsh tmux xsel goldendict gettext fzf fonts-noto-color-emoji libxcb-cursor0 xdotool ripgrep vim gnome-clocks flatpak -y

	sudo apt install gnome-software-plugin-flatpak -y

	flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -p "Install essential package for Ubuntu Wayland?" confirm
case $confirm in
y)
	sudo add-apt-repository ppa:aslatter/ppa -y
	sudo apt install vim vim-gtk gcc curl git libcanberra-gtk-module libcanberra-gtk3-module gnome-tweaks gnome-shell-extension-manager alacritty pandoc poppler-utils ffmpeg ripgrep curl jq wget fd-find ripgrep python3-pip python3-pip python3-virtualenv python3-venv aria2 unzip build-essential zsh tmux goldendict gettext fzf fonts-noto-color-emoji ripgrep vim gnome-clocks flatpak -y

	sudo apt install gnome-software-plugin-flatpak -y

	flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	;;
*)
	echo "you chose NO"
	;;
esac

echo "_____________________________________________________"
read -p "Install essential package for Xubuntu?" confirm
case $confirm in
y)
	sudo add-apt-repository ppa:aslatter/ppa -y
	sudo apt install vim vim-gtk gcc curl git libcanberra-gtk-module libcanberra-gtk3-module alacritty pandoc poppler-utils ffmpeg ripgrep jq wget fd-find ripgrep python3-pip wmctrl python3-pip python3-virtualenv python3-venv xclip aria2 unzip build-essential zsh tmux xsel goldendict gettext fzf fonts-noto-color-emoji libxcb-cursor0 xdotool ripgrep vim gnome-clocks flatpak -y

	sudo apt install gnome-software-plugin-flatpak -y

	flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	;;
*)
	echo "you chose NO"
	;;
esac

# Go
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

# rust
echo "_____________________________________________________"
read -r -p "Install rust?" confirm
case $confirm in
y)
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source "/home/${USER}/.cargo/env"

	cargo install eza
	cargo install zoxide
	cargo install --locked ripgrep_all
	;;
*)
	echo "you chose NO"
	;;
esac
