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
export GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json

# Get Java executable path
JAVA_PATH=$(which java)
if [ -z "$JAVA_PATH" ]; then
    echo "Error: Java not found in PATH"
    exit 1
fi

# Get the real path of the Java executable
JAVA_REALPATH=$(readlink -f "$JAVA_PATH")
if [ -z "$JAVA_REALPATH" ]; then
    echo "Error: Could not resolve the real path of Java"
    exit 1
fi

# Extract JAVA_HOME by removing "/bin/java" from the path
JAVA_HOME=${JAVA_REALPATH%/bin/java}
if [ -z "$JAVA_HOME" ]; then
    echo "Error: Could not determine JAVA_HOME"
    exit 1
fi

# Export JAVA_HOME
export JAVA_HOME
# echo "JAVA_HOME set to: $JAVA_HOME"
