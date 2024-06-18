#!/bin/bash

alias dvdrental="PGPASSWORD=Postgres\!23456 psql -h localhost -p 5432 -U postgres -d dvdrental"
chmod 600 ~/.ssh/*

if [ -z "$SSH_AGENT_PID" ]; then
    eval $(ssh-agent -s)
    ssh-add ~/.ssh/github-tea0112 ~/.ssh/zlp_rsa
fi
