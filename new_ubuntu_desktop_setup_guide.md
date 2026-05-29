# Ubuntu Desktop Setup Guide

## 1. Initial Setup & Browsers
* Update Ubuntu mirror to **Vietnam**.
* Install **Chrome**.
* Log into Chrome.
* Log into **Bitwarden** (via extension/app).
* Install basic utilities:
    ```bash
    sudo apt update
    sudo apt install curl git vim
    ```
* Install **Brave** browser.
* Install **WezTerm**.

---

## 2. GitHub & SSH Configuration
* Generate a new SSH key:
    ```bash
    ssh-keygen -t ed25519 -C "email@example.com"
    ```
* Log into GitHub and add the newly generated public key.
* Add the SSH config. Edit `~/.ssh/config` and add the following:
    ```text
    Host tea0112-github
        HostName github.com
        User git
        IdentityFile ~/.ssh/id_ed25519
        IdentitiesOnly yes
    ```
* Set the correct permissions for the SSH config file:
    ```bash
    chmod 600 ~/.ssh/config
    ```
* Test the GitHub SSH connection:
    ```bash
    ssh -T git@tea0112-github
    ```

---

## 3. Dotfiles & Environment Setup
* Clone your dotfiles repository:
    ```bash
    git clone git@tea0112-github:tea0112/dotfiles ~/dotfiles
    ```
* Set up the custom environment script:
    ```bash
    cp ~/dotfiles/.custom_environment.sh.example ~/.custom_environment.sh
    ```
* Clone your Neovim configuration:
    ```bash
    cd ~/dotfiles/.config
    git clone git@tea0112-github:tea0112/nvim
    ```
* Run the Ubuntu package installation script:
    ```bash
    bash ~/dotfiles/installation-scripts/ubuntu-package.sh
    ```
    *(When prompted, accept the installation of essential packages for Ubuntu Wayland by typing **YES**).*
* Initialize Zsh and Tmux:
    1. Execute `zsh` and type `y` for yes.
    2. Execute `zsh` again.
    3. Execute `tm` to start Tmux.
    4. Press `Ctrl + Shift + I` inside Tmux to install Tmux plugins.

---

## 4. Development Tools
### Node.js (via NVM)
* Install NVM and Node LTS:
    ```bash
    cd ~/dotfiles/installation-scripts/kiss-installation
    ./nvm.sh
    nvm install --lts
    nvm use --lts
    ```

### Neovim
* Install Neovim:
    ```bash
    bash ~/dotfiles/scripts/install_neovim.sh
    ```
* Execute `zsh`, then open `nvim` to allow plugins/parsers to update.

### Podman & Podman Desktop
* Install and configure Podman:
    ```bash
    sudo apt update
    sudo apt install -y podman
    podman --version
    
    # Configure registries
    echo 'unqualified-search-registries = ["docker.io", "quay.io"]' | sudo tee -a /etc/containers/registries.conf
    
    # Enable and start the socket
    sudo systemctl enable podman.socket
    sudo systemctl start podman.socket
    
    # Install Podman Desktop via Flatpak
    flatpak remote-add --if-not-exists --user flathub https://flathub.org/repo/flathub.flatpakrepo
    flatpak install --user flathub io.podman_desktop.PodmanDesktop
    
    # Install podman-docker wrapper
    sudo apt install -y podman-docker
    ```

---

## 5. System Optimization (zRAM)
* Install and configure zRAM to act as high-priority swap:
    ```bash
    sudo apt update
    sudo apt install systemd-zram-generator
    
    sudo tee /etc/systemd/zram-generator.conf > /dev/null <<'EOF'
    [zram0]
    # Set the maximum zRAM size.
    zram-size = ram / 2
    
    # Compression algorithm. 'zstd' compresses heavily, 'lz4' is lighter on the CPU.
    compression-algorithm = zstd
    
    # CRITICAL for running alongside disk swap.
    swap-priority = 100
    EOF
    
    sudo systemctl daemon-reload
    sudo systemctl restart systemd-zram-setup@zram0.service
    sudo systemctl start /dev/zram0
    swapon --show
    ```

---

## 6. Disk Partitioning (NTFS Automount)
* Create the mount directory:
    ```bash
    mkdir -p ~/mydata
    ```
* Configure the mount via the **Disks** application:
    1. Open **Disks**, choose the disk, select the NTFS partition, click the **Gear icon**, and click **Edit Mount Options**.
    2. **Turn off User Session Defaults:** Click the toggle so it turns grey/off.
    3. **Set Mount Options Line:** Replace the text box containing `nosuid,nodev...` with the exact string below:
       ```text
       nosuid,nodev,nofail,x-gvfs-show,uid=1000,gid=1000,dmask=007,fmask=117,windows_names
       ```
    4. **Set Mount Point:** Change the mount point field to your exact home directory path (e.g., `/home/user/mydata` — replace `user` with your actual username).

---

## 7. GUI Applications & Daily Drivers
* Install **VSCode** -> Log in.
* Install **Obsidian** -> Log in.
    * *Sync setup:* Enable sync for all other types, activate the community plugin list, and install community plugins.
* Install **OnlyOffice**.
* Install **IBus Bamboo** (Vietnamese keyboard).
* Install **Discord** -> Log in.
* Install **Telegram** -> Log in.
* Install **OpenCode**.
* Install **Haruna** (via Flatpak).
* Install **Hoppscotch**.

---

## 8. Finalization
* **Restart the system** to apply all daemon configurations, keyboard setups, and partition mounts.
