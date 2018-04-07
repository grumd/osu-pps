#! /usr/bin/bash
[[ "$PWD" =~ "update-scripts" ]] && cd ..
pwd
git --version
now=$(date +'%m/%d/%Y')
echo $now
echo
git status
git checkout release
git add .
git commit --amend -m "Data update from $now"
git push -f
