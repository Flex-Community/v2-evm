#!/bin/bash

# Create empty v2-evm.env if it doesn't exist
if [ ! -f "../v2-evm.env" ]; then
    touch "../v2-evm.env"
    echo "Created empty v2-evm.env file"
fi

# Create empty v2-evm.bash_history if it doesn't exist
if [ ! -f "../v2-evm.bash_history" ]; then
    touch "../v2-evm.bash_history"
    echo "Created empty v2-evm.bash_history file"
fi 