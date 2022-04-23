#!/bin/bash

is_existing=$(pgrep flameshot)

if [[ -z $is_exising ]];
then
  flameshot & >> /dev/null
fi
