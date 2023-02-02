FONT_DIR="$HOME/.fonts"
if [ -d "$FONT_DIR" ]; then
    cp $HOME/dotfiles/JetBrains\ Mono\ Nerd\ Font\ Complete\ Regular.ttf $FONT_DIR
    fc-cache -f -v
else
    mkdir $FONT_DIR
    cp $HOME/dotfiles/JetBrains\ Mono\ Nerd\ Font\ Complete\ Regular.ttf $FONT_DIR
    fc-cache -f -v
fi
