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
git commit -m "Data update from $now"
echo "Commited"
git push
echo "Pushed data to release"