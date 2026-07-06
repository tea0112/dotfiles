#!/bin/bash

mkdir -p ~/.local/bin

# if [[ ! -f "/usr/bin/zsh" ]]; then
#     echo "ZSH doesn't exist"
#     echo "You should run this script by ZSH!"
#     exit 0
# fi

echo "_____________________________________________________"
read -r -p "Generate en_US.UTF-8? [y/N] " confirm
case $confirm in
y | Y)
	sudo locale-gen "en_US.UTF-8"
	;;
*)
	echo "Skipped"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install essential packages for WSL Ubuntu? [y/N] " confirm
case $confirm in
y | Y)
	sudo apt update
	sudo apt install -y vim vim-gtk3 libcanberra-gtk3-module pandoc poppler-utils ffmpeg curl jq wget fd-find python3-pip python3-virtualenv python3-venv xclip aria2 unzip build-essential clang libclang-dev zsh tmux xsel gettext fzf libxcb-cursor0 xdotool tesseract-ocr-eng
	;;
*)
	echo "Skipped"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install essential packages for Kubuntu X11? [y/N] " confirm
case $confirm in
y | Y)
	sudo apt update
	sudo apt install -y vim vim-gtk3 gcc curl git extra-cmake-modules libcanberra-gtk3-module pandoc poppler-utils ffmpeg jq wget fd-find python3-pip wmctrl python3-virtualenv python3-venv xclip aria2 unzip build-essential clang libclang-dev zsh tmux xsel goldendict gettext fzf fonts-noto-color-emoji libxcb-cursor0 xdotool flatpak gnome-software-plugin-flatpak

	flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	flatpak install -y flathub org.kde.haruna
	;;
*)
	echo "Skipped"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install packages for i3wm dependencies? [y/N] " confirm
case $confirm in
y | Y)
	sudo apt update
	sudo apt install -y copyq blueman flameshot picom rofi feh gnome-clocks
	;;
*)
	echo "Skipped"
	;;
esac

echo "_____________________________________________________"
read -r -p "Do you want to add and install neovim unstable ppa? [y/N] " confirm
case $confirm in
y | Y)
	sudo add-apt-repository ppa:neovim-ppa/unstable -y
	sudo apt update
	sudo apt install -y neovim
	;;
*)
	echo "Skipped"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install essential packages for Ubuntu X11? [y/N] " confirm
case $confirm in
y | Y)
	sudo apt update
	sudo apt install -y vim vim-gtk3 gcc curl git libcanberra-gtk3-module gnome-tweaks gnome-shell-extension-manager pandoc poppler-utils ffmpeg jq wget fd-find python3-pip wmctrl python3-virtualenv python3-venv xclip aria2 unzip build-essential clang libclang-dev zsh tmux xsel goldendict gettext fzf fonts-noto-color-emoji libxcb-cursor0 xdotool gnome-clocks flatpak gnome-software-plugin-flatpak

	flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	flatpak install -y flathub org.kde.haruna
	;;
*)
	echo "Skipped"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install essential packages for Ubuntu Wayland? [y/N] " confirm
case $confirm in
y | Y)
	sudo apt update
	sudo apt install -y vim vim-gtk3 gcc curl git libcanberra-gtk3-module gnome-tweaks gnome-shell-extension-manager pandoc poppler-utils ffmpeg jq wget fd-find python3-pip python3-virtualenv python3-venv aria2 unzip build-essential clang libclang-dev zsh tmux goldendict gettext fzf fonts-noto-color-emoji gnome-clocks flatpak gnome-software-plugin-flatpak wl-clipboard gnome-shell-extension-gpaste gpaste-2

	gnome-extensions enable GPaste@gnome-shell-extensions.gnome.org

	flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	flatpak install -y flathub org.kde.haruna
	;;
*)
	echo "Skipped"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install essential packages for Xubuntu? [y/N] " confirm
case $confirm in
y | Y)
	sudo apt update
	sudo apt install -y vim vim-gtk3 gcc curl git libcanberra-gtk3-module pandoc poppler-utils ffmpeg jq wget fd-find python3-pip wmctrl python3-virtualenv python3-venv xclip aria2 unzip build-essential clang libclang-dev zsh tmux xsel goldendict gettext fzf fonts-noto-color-emoji libxcb-cursor0 xdotool gnome-clocks flatpak gnome-software-plugin-flatpak

	flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
	flatpak install -y flathub org.kde.haruna
	;;
*)
	echo "Skipped"
	;;
esac

# Go
echo "_____________________________________________________"
read -r -p "Install golang? [y/N] " confirm
case $confirm in
y | Y)
	hash -r
	./kiss-installation/go.sh
	;;
*)
	echo "Skipped"
	;;
esac

# rust
echo "_____________________________________________________"
read -r -p "Install rust? [y/N] " confirm
case $confirm in
y | Y)
	hash -r
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	source "/home/${USER}/.cargo/env"

	cargo install eza
	cargo install zoxide
	cargo install ripgrep
	cargo install --locked ripgrep_all
	cargo install --locked tree-sitter-cli
	;;
*)
	echo "Skipped"
	;;
esac

echo "_____________________________________________________"
read -r -p "Install uv (Python package manager)? [y/N] " confirm
case $confirm in
y | Y)
	curl -LsSf https://astral.sh/uv/install.sh | sh
	;;
*)
	echo "Skipped"
	;;
esac
