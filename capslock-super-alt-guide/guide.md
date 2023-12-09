> The /etc/X11/xorg.conf.d/ directory stores host-specific configuration. You are free to add configuration files there, but they must have a .conf suffix: the files are read in ASCII order, and by convention their names start with XX- (two digits and a hyphen, so that for example 10 is read before 20). These files are parsed by the X server upon startup and are treated like part of the traditional xorg.conf configuration file. Note that on conflicting configuration, the file read last will be processed. For this reason, the most generic configuration files should be ordered first by name. The configuration entries in the xorg.conf file are processed at the end.

# Getting and setting XKB layout
Your own configurations can go in /etc/X11/xorg.conf.d/

For example one may want to remap their Caps Lock key to Escape
    90-custom-kbd.conf

    Section "InputClass"
        Identifier "keyboard defaults"
        MatchIsKeyboard "on"

        Option "XKbOptions" "caps:escape"
    EndSection

Caps Lock key to Super
    00-keyboard.conf

    Section "InputClass"
        Identifier "keyboard defaults"
        MatchIsKeyboard "on"

        Option "XKbOptions" "caps:super"
    EndSection

Capslock to super, swap super and alt position

Section "InputClass"
    Identifier "keyboard defaults"
    MatchIsKeyboard "on"

    Option "XKbOptions" "altwin:swap_alt_win,caps:super"
EndSection
