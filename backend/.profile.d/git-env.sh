#!/bin/bash
# Set up Git environment for HTTPS support on Heroku
# This runs for every dyno process

if [ -d "/app/bin/lib" ]; then
    export LD_LIBRARY_PATH="/app/bin/lib:/usr/lib/x86_64-linux-gnu:/usr/lib:/lib/x86_64-linux-gnu:/lib:${LD_LIBRARY_PATH}"
    export SSL_CERT_FILE="/app/bin/etc/ssl/certs/ca-bundle.crt"
    export SSL_CERT_DIR="/app/bin/etc/ssl/certs"
    export GIT_EXEC_PATH="/app/bin/libexec/git-core"
fi
