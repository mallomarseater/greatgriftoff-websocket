#!/bin/bash

# Make sure the script fails on any error
set -e

# Create necessary directories
mkdir -p public/js

# Copy all files to their correct locations
cp -r public/* public/
cp -r public/js/* public/js/

# Log the contents for verification
echo "Contents of public directory:"
ls -la public/
echo "Contents of public/js directory:"
ls -la public/js/ 