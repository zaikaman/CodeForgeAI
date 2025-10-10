#!/bin/bash
# .profile.d script to add flyctl to PATH
# This runs every time a dyno starts

if [ -f /app/bin/flyctl ]; then
    export PATH="/app/bin:$PATH"
    echo "✅ Flyctl added to PATH"
fi
