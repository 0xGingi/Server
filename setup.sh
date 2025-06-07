#!/bin/bash

echo "Installing dependencies..."
bun install

echo "Building..."
bun run build
