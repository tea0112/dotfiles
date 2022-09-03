#!/bin/bash

is_existed() {
    if pacman -Qs $1 > /dev/null; then
        return 0
    else
        return 1
    fi
}

is_existed $1
