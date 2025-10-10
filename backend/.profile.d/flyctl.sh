#!/bin/bash
# .profile.d script to add flyctl to PATH
# This runs every time a dyno starts

if [ -f /app/vendor/flyctl/flyctl ]; then
    export PATH="/app/vendor/flyctl:$PATH"
    echo "✅ Flyctl added to PATH"
fi
