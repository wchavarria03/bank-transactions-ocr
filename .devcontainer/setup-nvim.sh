#!/bin/bash

# Create necessary directories
mkdir -p ~/.config/nvim
mkdir -p ~/.local/share/nvim/plugged

# Copy init.vim to the correct location
cp /workspaces/bank-transactions-ocr/.devcontainer/init.vim ~/.config/nvim/init.vim

# Install plugins
nvim --headless +PlugInstall +qall 
