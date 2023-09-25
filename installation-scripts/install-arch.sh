#!/bin/bash

if [[ ! -f "/usr/bin/zsh" ]]; then
	echo "ZSH doesn't exist"
	echo "You should run this script by ZSH!"
	exit 0
fi

echo "instal default terminal for things like ranger, neovim"
echo "export TERMINAL=/usr/bin/alacritty" >>"$HOME/.profile"

sudo pacman -S curl mpv gcc wget ripgrep rofi polybar jq aria2 eza xclip fd zsh zoxide starship ripgrep zathura zathura-cb zathura-djvu zathura-ps zathura-pdf-mupdf xsel rofimoji gnome-disk-utility wmctrl xdotool blueman ttf-font-awesome noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra vlc telegram-desktop qbittorrent unzip gnome-keyring gvfs-mtp zip gwenview tumbler gnome-calculator nodejs fzf

echo "========== Configure ZSH =========="
rm -rf "$HOME/.oh-my-zsh"
git clone https://github.com/ohmyzsh/ohmyzsh.git "$HOME/.oh-my-zsh"

rm -rf "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions"
git clone https://github.com/zsh-users/zsh-autosuggestions.git "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions"

rm -rf "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting"
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting"

rm -rf "$HOME/.oh-my-zsh/custom/themes/powerlevel10k"
ZSH_CUSTOM=/home/$USER/.oh-my-zsh/custom
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "${ZSH_CUSTOM}/themes/powerlevel10k"

rm -rf "$HOME/.zshrc"

dotfiles_dir=$HOME/dotfiles
ln -sf "${dotfiles_dir}/.zshrc" "$HOME"
ln -sf "${dotfiles_dir}/.zprofile" "$HOME"

chsh -s "$(which zsh)"

echo ".------------------------------------------------."
echo "|                     clangd                     |"
echo "'------------------------------------------------'"
clangd_directory="$XDG_CONFIG_HOME/clangd"
if [ -d "$clangd_directory" ]; then
	rm -rf "$clangd_directory"
fi
ln -sf "$HOME/dotfiles/.config/clangd/" "$XDG_CONFIG_HOME/"

echo ".------------------------------------------------."
echo "|                     ranger                     |"
echo "'------------------------------------------------'"
ranger_directory="$HOME/.config/ranger"
if [ -d "$ranger_directory" ]; then
	rm -rf "$ranger_directory"
fi
ln -sf "$HOME/dotfiles/.config/ranger/" "$XDG_CONFIG_HOME/"

echo ".------------------------------------------------."
echo "|                     font                       |"
echo "'------------------------------------------------'"
mkdir -p "$HOME/.local/share/fonts/otf"
mkdir -p "$HOME/.local/share/fonts/tff"

TFF_DIR="$HOME/.local/share/fonts/tff"
#OTF_DIR="$HOME/.local/share/fonts/otf"

FONT_FILE="CaskaydiaCoveNerdFont-Regular.ttf"

if [ -f "${TFF_DIR}/${FONT_FILE}" ]; then
	echo "${FONT_FILE} exists!"
else
	cp "$HOME/dotfiles/${FONT_FILE}" "$FONT_DIR"
	fc-cache -f -v
fi

echo "========== Configure mpv =========="
rm -rf "$HOME/.config/mpv"
ln -sf "$HOME/dotfiles/.config/mpv/" "$HOME/.config/"

echo "========== Configure i3 =========="
if [ -d "/home/thai/.config/i3" ]; then
	rm -rf "$HOME/.config/i3"
fi

ln -sf "$HOME/dotfiles/.config/i3/" "$HOME/.config/"

echo "========== Configure rofi =========="
if [ -d "$HOME/.config/rofi" ]; then
	rm -rf "$HOME/.config/rofi"
fi

ln -sf "$HOME/dotfiles/.config/rofi/" "$HOME/.config/"

echo "========== Configure polybar =========="
if [ -d "$HOME/.config/polybar" ]; then
	rm -rf "$HOME/.config/polybar"
fi

ln -sf "$HOME/dotfiles/.config/polybar/" "$HOME/.config/"

echo "========== Configure starship =========="
if [ -d "$HOME/.config/starship.toml" ]; then
	rm -rf "$HOME/.config/starship.toml"
fi

ln -sf "$HOME/dotfiles/.config/startship.toml" "$HOME/.config/"

echo "========== Configure zathura =========="
if [[ -d "$HOME/.config/zathura " ]]; then
	rm -rf "$HOME/.config/zathura"
fi

ln -sf "$HOME/dotfiles/.config/zathura/" "$HOME/.config"

echo "========== Install Neovim =========="
nvim_config_dir="/home/$USER/.config/nvim"
if [ -d "${nvim_config_dir}" ]; then
	rm -rf "${nvim_config_dir}"
fi
ln -sf "/home/$USER/dotfiles/.config/nvim/" "/home/$USER/.config/"

echo "========== Configure Picom =========="
if [ -d "$HOME/.config/picom" ]; then
	rm -rf "$HOME/.config/picom"
fi

ln -sf "$HOME/dotfiles/.config/picom/" "$HOME/.config/"

echo "========== Configure Tmux =========="
rm -rf "$HOME/.tmux/plugins/tpm"
git clone https://github.com/tmux-plugins/tpm "$HOME/.tmux/plugins/tpm"

rm -rf "$HOME/.tmux.conf"
ln -sf "$HOME/dotfiles/.tmux.conf" "$HOME"

echo "========== Configure Alacritty =========="
if [ -d "/home/thai/.config/alacritty" ]; then
	rm -rf "$HOME/.config/alacritty"
fi

ln -sf "$HOME/dotfiles/.config/alacritty/" "$HOME/.config/"

echo "========== Install Go =========="
./install-go.sh

echo "========== Install Rust =========="
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
