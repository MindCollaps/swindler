#!/usr/bin/env bash

echo "Installing Bun..."
curl -fsSL https://bun.com/install | bash

bash .devcontainer/init-env.sh