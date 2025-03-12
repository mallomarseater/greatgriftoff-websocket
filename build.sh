#!/bin/bash

# Install dependencies
npm install

# Create necessary directories if they don't exist
mkdir -p public/js
mkdir -p public/css
mkdir -p public/images

# Copy static files to public directory
cp *.html public/
cp -r js/* public/js/
cp -r css/* public/css/
cp -r images/* public/images/

echo "Build completed!" 