# If you come from bash you might have to change your $PATH. 
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time oh-my-zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME="robbyrussell"
#ZSH_THEME=powerlevel10k/powerlevel10k
#POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(dir vcs)

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in $ZSH/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment one of the following lines to change the auto-update behavior
# zstyle ':omz:update' mode disabled  # disable automatic updates
# zstyle ':omz:update' mode auto      # update automatically without asking
# zstyle ':omz:update' mode reminder  # just remind me to update when it's time

# Uncomment the following line to change how often to auto-update (in days).
# zstyle ':omz:update' frequency 13

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# You can also set it to another string to have that shown instead of the default red dots.
# e.g. COMPLETION_WAITING_DOTS="%F{yellow}waiting...%f"
# Caution: this setting can cause issues with multiline prompts in zsh < 5.7.1 (see #5765)
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(
	git
	zsh-autosuggestions
	zsh-syntax-highlighting
    zsh-vi-mode
)

# [ -z "$TMUX"  ] && { tmux attach || exec tmux new-session && exit;}

source $ZSH/oh-my-zsh.sh


# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
alias zpi="sudo zypper install"
alias zshconfig="nvim ~/dotfiles/.zshrc"
alias szsh="source ~/.zshrc"
alias e="nvim"
alias ai="sudo apt install"
alias pi="sudo pacman -S"
alias prm="sudo pacman -R"
alias cnvim="cd ~/dotfiles/.config/nvim"
alias envim="cd ~/dotfiles/.config/nvim && nvim"
alias pnvim='cd ~/dotfiles/.config/nvim && git pull && git add . && if [ $(git commit -m "update" && git push -u origin master) -eq 0 ]; then cd -; fi && cd -'
alias cnotes="cd ~/notes"
alias pn='cd ~/notes && git pull && git add . && if [ $(git commit -m "update" && git push -u origin master) -eq 0 ]; then cd -; fi && cd -'
alias lk="zdict -dt oxford"
alias ei3="nvim ~/dotfiles/.config/i3/config"
alias ealacritty="nvim ~/dotfiles/.config/alacritty/alacritty.yml"
alias epolybar="cd ~/.config/polybar && nvim ."
alias erofi="cd ~/dotfiles/.config/rofi && nvim ."
alias pdotfiles='cd ~/dotfiles && git pull && git add . && if [ $(git commit -m "update" && git push -u origin master) -eq 0 ]; then cd -; fi && cd -'
alias se="sudoedit"
alias cdotfiles="cd $HOME/dotfiles"
alias cnvim="cd $XDG_CONFIG_HOME/nvim"
alias ctm="bash $HOME/dotfiles/scripts/map-caps-to-super.sh"
alias blcpo="bluetoothctl power on"
alias blcs="bluetoothctl scan on"
alias blcc="bluetoothctl connect"
alias blct="bluetoothctl trust"
alias blcp="bluetoothctl pair"
alias blcr="bluetoothctl remove"
alias dl="~/dotfiles/scripts/aria2c.sh"
alias mmi="bash ~/scripts/mmi.sh"
alias i3exit="bash ~/.config/i3/i3exit.sh"
alias pe="bash ~/dotfiles/scripts/package-exist.sh"
# alias ls="eza -g --icons --git"
alias ll="eza -l -g --icons --git"
alias la="eza -la -g --icons --git"
alias cm="git commit -m"
alias de="rm -rf"
alias gs="git status"
alias gi="grep -i"
alias tcb="xclip -selection clipboard"
alias tm="tmux attach || tmux new-session"
alias cb="tr -d '\n' | xclip -selection clipboard"
alias rtm="bash $HOME/dotfiles/scripts/reorder-tmux.sh"
alias cx="chmod +x"
alias tch="~/dotfiles/scripts/create_and_chmod_x.sh"
alias st="~/dotfiles/scripts/local_repos_status.sh"
alias pg="git pull && git add . && git commit -m "update" && git push -u origin master"
alias tmx="tmuxinator"
alias rf="bash ~/dotfiles/installation-scripts/config.sh"
alias spd="tmux new -d -s spoof 'spoof-dpi --port 56789'"
alias py="python3"
alias n="nvim ."
alias gvm="~/dotfiles/scripts/switch_go.sh"
alias cursor="~/Apps/cursor/cursor.AppImage --no-sandbox"
alias sl='git stash list --pretty=format:"%gd - %ci - %s"'

export DISABLE_AUTO_TITLE='true'
export XDG_DATA_DIRS="/var/lib/flatpak/exports/share:$XDG_DATA_DIRS"
export XDG_DATA_DIRS="$HOME/.local/share/flatpak/exports/share:$XDG_DATA_DIRS"
export ZVM_VI_INSERT_ESCAPE_BINDKEY=jk
export EDITOR='nvim'
export VISUAL='nvim'
export TERM='xterm-256color'
export GTK_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
export QT_IM_MODULE=ibus
export EDITOR=nvim
export JAVA_HOME=$(readlink -f /usr/bin/java | cut -d/ -f1-5)
export MAVEN_HOME=/opt/maven
export M2_HOME=/opt/maven
export PAGER=less
export MM_LIVE_RELOAD=true
export XDG_CONFIG_HOME=$HOME/.config
export XDG_DATA_HOME=$HOME/.local/share
export XDG_STATE_HOME=$HOME/.local/state
export WINEARCH=win32
export WINEPREFIX=~/.wine32
export BOOST_ROOT=/opt/boost_1_80_0
export SHELL=/usr/bin/zsh
export LIBVIRT_DEFAULT_URI=qemu:///system
export MANPAGER='nvim +Man!'
export MANWIDTH=999
export NVM_SYMLINK_CURRENT=true

export GOPATH=$HOME/go

export PATH=$PATH:~/.local/bin:~/.cargo/bin
export PATH=$PATH:/usr/sbin
export PATH=$PATH:/usr/local/bin
export PATH=$PATH:$HOME/.local/share/nvim/mason/bin
export PATH=$PATH:$HOME/anaconda3/bin
export PATH=$PATH:$MAVEN_HOME/bin
export PATH=$PATH:$JAVA_HOME/bin
export PATH=$PATH:/opt/ripgrep_all
export PATH=$PATH:/opt/cmake/bin
export PATH=$PATH:$HOME/.local/share/JetBrains/Toolbox/apps/goland/bin
export PATH=$PATH:/usr/pgsql-17/bin/
export PATH=$PATH:$HOME/Apps/sonar-scanner/bin
export PATH="$PATH:$GOPATH/bin"

# nnn configuration
export NNN_PLUG='f:finder;o:fzopen;p:mocplay;d:diffs;t:nmount;v:imgview'
export NNN_FIFO=/tmp/nnn.fifo

eval "$(starship init zsh)"
eval "$(zoxide init zsh)"

source $HOME/.local_env.sh 2> /dev/null

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

# Generated for envman. Do not edit.
[ -s "$HOME/.config/envman/load.sh" ] && source "$HOME/.config/envman/load.sh"

[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

#bindkey -v

# place this after nvm initialization!
autoload -U add-zsh-hook

load-nvmrc() {
  local nvmrc_path
  nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version
    nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
      nvm use
    fi
  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}

# add-zsh-hook chpwd load-nvmrc
# load-nvmrc

setopt rmstarsilent

if [ ! -f "~/.custom_environment.sh" ]; then
    source ~/.custom_environment.sh
fi
# if [ -f ~/.go/current_version ]; then
#     source ~/.go/current_version
# fi

# The next line updates PATH for the Google Cloud SDK.
if [ -f "$HOME/Apps/google-cloud-sdk/path.zsh.inc" ]; then . "$HOME/Apps/google-cloud-sdk/path.zsh.inc"; fi

# The next line enables shell command completion for gcloud.
if [ -f "$HOME/Apps/google-cloud-sdk/completion.zsh.inc" ]; then . "$HOME/Apps/google-cloud-sdk/completion.zsh.inc"; fi

[ -s "${HOME}/.g/env" ] && \. "${HOME}/.g/env"  # g shell setup

