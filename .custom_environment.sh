#!/bin/bash

# go install golang.org/dl/go1.21.0@latest
# go1.21.0 download
# go1.21.0 version
#alias makegen="go generate ./..."

export PGPASSWD=Postgres!23456
export PGUSER=postgres
export PGPORT=5432
export PGDB=postgres
# export GOPRIVATE=dev.azure.com
#

if [ -z "${JAVA_HOME}" ]
then
    JAVA_HOME=$(readlink -nf $(which java) | xargs dirname | xargs dirname)
    if [ ! -e "$JAVA_HOME" ]
    then
        JAVA_HOME=""
    fi
    export JAVA_HOME=$JAVA_HOME
fi
