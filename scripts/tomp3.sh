#!/bin/bash

input=$1
output=$2
ffmpeg -i "${input}" -q:a 0 -map a "${output}"
