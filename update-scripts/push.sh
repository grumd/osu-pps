#! /usr/bin/bash
[[ "$PWD" =~ "update-scripts" ]] && cd ..
pwd
git --version
now=$(date +'%m/%d/%Y')
echo $now
echo
git status
git checkout master
git add .
git commit --amend -m "Data update from $now"
echo "Commited"
git push -f
echo "Pushed data to master"
