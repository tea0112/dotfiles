#!/bin/bash

# Tip: To see what processes are using a port without killing, you can run
# lsof -i tcp:PORT
# For a single port: ./kill_ports.sh 8080
# For multiple ports: ./kill_ports.sh 8080 3000 9000

if [ $# -eq 0 ]; then
    echo "Usage: $0 port1 [port2 ... portN]"
    exit 1
fi

for port in "$@"
do
    echo "Killing processes on port $port..."
    # Find PIDs using the port (listening or established)
    pids=$(lsof -ti tcp:"$port")
    if [ -z "$pids" ]; then
        echo "No process found on port $port"
    else
        echo "$pids" | xargs kill -9
        echo "Killed processes: $pids"
    fi
done
