#!/usr/bin/env sh

# update changelog
./script-update-changelog.js

# build
npm run build

# deploy
cd build