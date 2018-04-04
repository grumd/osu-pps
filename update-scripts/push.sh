#! /usr/bin/bash
pwd
git --version
now=$(date +'%m/%d/%Y')
echo $now
echo
git status
git checkout release
git add .
git commit -m "Data update from $now"
git push