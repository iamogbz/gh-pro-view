#!/bin/sh

git clone https://github.com/iamogbz/node-js-boilerplate ../$REPO_NAME
cd ../$REPO_NAME
git remote set-url origin $REPO_URL
sed -i '' 's/oss-boilerplate/node-js-boilerplate/g' Makefile
make upstream
