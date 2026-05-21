#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
"$DIR/dependency/plan-server"
echo ""
echo "Server stopped."
read -p "Press Enter to close..."
