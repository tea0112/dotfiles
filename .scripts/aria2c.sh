#!/bin/bash

aria2c -c -s 16 -x 16 -k 1M -j 1 "$1"
