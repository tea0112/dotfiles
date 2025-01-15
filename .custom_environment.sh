#!/bin/bash

# go install golang.org/dl/go1.21.0@latest
# go1.21.0 download
# go1.21.0 version
#alias makegen="go generate ./..."

export PGPASSWD=Postgres!23456
export PGUSER=postgres
export PGPORT=5432
export PGDB=postgres
export GOPRIVATE=dev.azure.com

goalias() {
    # Function to display the menu
    show_menu() {
        echo "Please choose an option:"
        echo "1) Set alias go cmd to go 1.21.0"
        echo "2) Set alias go cmd to go 1.23.4"
        echo "3) Exit"
    }

    # Function to handle the selected option
    handle_option() {
        case $1 in
        1)
            echo "You chose go 1.21.0 version"
            eval 'alias go="go1.21.0"' # Set the alias
            go version
            ;;
        2)
            echo "You chose go 1.23.4 version"
            eval 'alias go="go1.23.4"' # Set the alias
            go version
            ;;
        3)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Please try again."
            ;;
        esac
    }

    # Display the menu
    show_menu

    # Prompt the user for input
    echo -n "Enter your choice: "
    read choice

    # Handle the selected option
    handle_option "$choice"
}
