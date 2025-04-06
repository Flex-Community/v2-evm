#!/bin/bash

# Check if directory argument is provided
if [ -z "$1" ]; then
    echo "Error: Please provide a target directory as the first argument"
    exit 1
fi

TARGET_DIR="$1"

# Create target directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
    mkdir -p "$TARGET_DIR"
    echo "Created directory $TARGET_DIR"
fi

# Create empty .env if it doesn't exist
if [ ! -f "$TARGET_DIR/.env" ]; then
    touch "$TARGET_DIR/.env"
    echo "Created empty .env file in $TARGET_DIR"
fi

# Create empty .bash_history if it doesn't exist
if [ ! -f "$TARGET_DIR/.bash_history" ]; then
    touch "$TARGET_DIR/.bash_history"
    echo "Created empty .bash_history file in $TARGET_DIR"
fi

# Create empty .bash_history if it doesn't exist
if [ ! -f "$TARGET_DIR/post-start.sh" ]; then
    touch "$TARGET_DIR/post-start.sh"
    chmod +x "$TARGET_DIR/post-start.sh"
    echo "Created empty post-start.sh file in $TARGET_DIR"
fi