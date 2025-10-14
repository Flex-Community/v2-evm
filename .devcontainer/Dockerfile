FROM mcr.microsoft.com/vscode/devcontainers/base:debian-11

ARG WORKSPACE_FOLDER_BASENAME

RUN apt-get update \
    && apt-get -y install curl build-essential pkg-config libssl-dev less jq mc iputils-ping \
    && apt-get clean


# Persist bash history
# https://code.visualstudio.com/remote/advancedcontainers/persist-bash-history
ARG USERNAME=vscode

RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
    && mkdir /commandhistory \
    && touch /commandhistory/.bash_history \
    && chown -R $USERNAME /commandhistory \
    && echo "$SNIPPET" >> "/home/$USERNAME/.bashrc"
# --------------

USER vscode
SHELL ["/bin/bash", "--login", "-i", "-c"]

ENV NODE_VERSION 20

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash \
    && source $HOME/.nvm/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

# Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN export PATH="$PATH:/home/vscode/.cargo/bin"

# Foundry
RUN curl -L https://foundry.paradigm.xyz | bash
RUN export PATH="$PATH:/home/vscode/.foundry/bin"
RUN /home/vscode/.foundry/bin/foundryup -C 5a8bd89

RUN npm install --global yarn

# Install Tenderly CLI
RUN curl https://raw.githubusercontent.com/Tenderly/tenderly-cli/master/scripts/install-linux.sh | sudo sh
# COPY .devcontainer/install-tenderly.sh /home/vscode/install-tenderly.sh
# RUN sudo /home/vscode/install-tenderly.sh 1.5.14

WORKDIR /workspaces/${WORKSPACE_FOLDER_BASENAME}
RUN mkdir -p /workspaces/${WORKSPACE_FOLDER_BASENAME}/node_modules
RUN chown -R vscode:vscode /workspaces/${WORKSPACE_FOLDER_BASENAME}/node_modules
COPY --chown=vscode ../package.json ../yarn.lock /workspaces/${WORKSPACE_FOLDER_BASENAME}/
RUN yarn

# copy config file if it exists
RUN mkdir -p /home/vscode/.tenderly
COPY --chown=vscode ../.tenderly/*.yaml  /home/vscode/.tenderly/