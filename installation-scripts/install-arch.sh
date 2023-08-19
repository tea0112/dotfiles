#!/bin/bash

if [[ ! -f "/usr/bin/zsh" ]]; then
    echo "ZSH doesn't exist"
    echo "You should run this script by ZSH!"
    exit 0
fi

echo "instal default terminal for things like ranger, neovim"
echo "export TERMINAL=/usr/bin/alacritty" >> $HOME/.profile

sudo pacman -S curl mpv gcc wget ripgrep rofi polybar jq aria2 exa xclip fd zsh zoxide starship ripgrep zathura zathura-cb zathura-djvu zathura-ps zathura-pdf-mupdf xsel rofimoji arandr gnome-disk-utility wmctrl xdotool lxqt-policykit network-manager-applet blueman autorandr feh xfce4-notifyd ttf-font-awesome noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra vlc neovim telegram-desktop thunar qbittorrent unzip gnome-disk-utility git-delta bat dust gnome-keyring okular breeze copyq gvfs-mtp zip

echo "========== Configure ZSH =========="
rm -rf ~/.oh-my-zsh
git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

rm -rf ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

rm -rf ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting

rm -rf ~/.oh-my-zsh/custom/themes/powerlevel10k
ZSH_CUSTOM=/home/$USER/.oh-my-zsh/custom
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM}/themes/powerlevel10k

rm -rf ~/.zshrc

dotfiles_dir=~/dotfiles
ln -sf ${dotfiles_dir}/.zshrc ~
ln -sf ${dotfiles_dir}/.zprofile ~

chsh -s $(which zsh)

echo "========== Install font =========="
FONT_DIR="$HOME/.fonts"
if [ -d "$FONT_DIR" ]; then
	cp $HOME/dotfiles/JetBrains\ Mono\ Nerd\ Font\ Complete\ Regular.ttf $FONT_DIR
	fc-cache -f -v
else
	mkdir $FONT_DIR
	cp $HOME/dotfiles/JetBrains\ Mono\ Nerd\ Font\ Complete\ Regular.ttf $FONT_DIR
	fc-cache -f -v
fi

echo "========== Configure mpv =========="
rm -rf ~/.config/mpv
ln -sf ~/dotfiles/.config/mpv/ ~/.config/

echo "========== Configure i3 =========="
if [ -d "/home/thai/.config/i3" ]; then
	rm -rf ~/.config/i3
fi

ln -sf ~/dotfiles/.config/i3/ ~/.config/

echo "========== Configure rofi =========="
if [ -d "~/.config/rofi" ]; then
	rm -rf ~/.config/rofi
fi

ln -sf ~/dotfiles/.config/rofi/ ~/.config/

echo "========== Configure polybar =========="
if [ -d "~/.config/polybar" ]; then
	rm -rf ~/.config/polybar
fi

ln -sf ~/dotfiles/.config/polybar/ ~/.config/

echo "========== Configure starship =========="
if [ -d "~/.config/starship.toml" ]; then
	rm -rf ~/.config/starship.toml
fi

ln -sf ~/dotfiles/.config/startship.toml ~/.config/

echo "========== Configure zathura =========="
if [[ -d "$HOME/.config/zathura " ]]; then
	rm -rf ~/.config/zathura
fi

ln -sf ~/dotfiles/.config/zathura/ ~/.config

echo "========== Install Neovim =========="
nvim_config_dir="/home/$USER/.config/nvim"
if [ -d "${nvim_config_dir}" ]; then
	rm -rf "${nvim_config_dir}"
fi
ln -sf /home/$USER/dotfiles/.config/nvim/ /home/$USER/.config/

echo "========== Configure Picom =========="
if [ -d "$HOME/.config/picom" ]; then
	rm -rf ~/.config/picom
fi

ln -sf ~/dotfiles/.config/picom/ ~/.config/

echo "========== Configure Tmux =========="
rm -rf ~/.tmux/plugins/tpm
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

rm -rf ~/.tmux.conf
ln -sf ~/dotfiles/.tmux.conf ~

echo "========== Configure Alacritty =========="
if [ -d "/home/thai/.config/alacritty" ]; then
	rm -rf ~/.config/alacritty
fi

ln -sf ~/dotfiles/.config/alacritty/ ~/.config/

echo "========== Install Go =========="
./install-go.sh

echo "========== Install Rust =========="
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
