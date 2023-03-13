#!/bin/bash

echo "******************* Install Tmux *******************"
rm -rf ~/.tmux/plugins/tpm
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

rm -rf ~/.tmux.conf
ln -sf ~/dotfiles/.tmux.conf ~


echo "******************* Install Starship *******************"
curl -sS https://starship.rs/install.sh | sh

if [ -d "~/.config/starship.toml" ]; then
    rm -rf ~/.config/starship.toml
fi

ln -sf ~/dotfiles/.config/startship.toml ~/.config/

echo "******************* Install Zsh *******************"
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
rm -rf ~/.zprofile

dotfiles_dir=~/dotfiles
ln -sf ${dotfiles_dir}/.zshrc ~
ln -sf ${dotfiles_dir}/.zprofile ~

chsh -s $(which zsh)

echo "******************* Install Neovim *******************"
cp ~/dotfiles/.neovim-config.json ~

nvim_config_dir="/home/$USER/.config/nvim"
if [ -d "${nvim_config_dir}" ]; then
	rm -rf "${nvim_config_dir}"
else
	mkdir -p "/home/$USER/.config/"
fi
ln -sf /home/$USER/dotfiles/.config/nvim/ /home/$USER/.config/

packer=/home/$USER/.local/share/nvim/site/pack/packer
if [ -d "$packer" ]; then
	echo "detect"
	rm -rf "${packer}"
	git clone --depth 1 https://github.com/wbthomason/packer.nvim ~/.local/share/nvim/site/pack/packer/start/packer.nvim
else
	git clone --depth 1 https://github.com/wbthomason/packer.nvim ~/.local/share/nvim/site/pack/packer/start/packer.nvim
fi

nvim --headless -c 'autocmd User PackerComplete quitall' -c 'PackerSync'

echo "******************* Install Polybar *******************"
if [ -d "~/.config/polybar" ]; then
    rm -rf ~/.config/polybar
fi

ln -sf ~/dotfiles/.config/polybar/ ~/.config/

echo "******************* Install Rofi *******************"
if [ -d "~/.config/rofi" ]; then
    rm -rf ~/.config/rofi
fi

ln -sf ~/dotfiles/.config/rofi/ ~/.config/

echo "******************* Install I3 *******************"
# rofimoji
# arandr
# gnome-disk-utility
# wmctrl
# xdotool
# lxqt-policykit
# network-manager-applet
# blueman
# autorandr
# feh
# xfce4-notifyd
# ttf-font-awesome
if [ -d "/home/thai/.config/i3" ]; then
    rm -rf ~/.config/i3
fi

ln -sf ~/dotfiles/.config/i3/ ~/.config/

echo "******************* Install Imwheel *******************" 
if [ -f "~/.imwheelrc" ]; then
    rm ~/.imwheelrc
fi

ln -sf ~/dotfiles/.imwheelrc ~/

echo "******************* Install Mpv *******************"
rm -rf ~/.config/mpv
ln -sf ~/dotfiles/.config/mpv/ ~/.config

echo "******************* Install Font *******************"
FONT_DIR="$HOME/.fonts"
if [ -d "$FONT_DIR" ]; then
    cp $HOME/dotfiles/JetBrains\ Mono\ Nerd\ Font\ Complete\ Regular.ttf $FONT_DIR
    fc-cache -f -v
else
    mkdir $FONT_DIR
    cp $HOME/dotfiles/JetBrains\ Mono\ Nerd\ Font\ Complete\ Regular.ttf $FONT_DIR
    fc-cache -f -v
fi
