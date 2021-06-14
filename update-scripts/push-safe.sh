#! /usr/bin/bash
echo
[[ "$PWD" =~ "update-scripts" ]] && cd ..
pwd
now=$(date +'%m/%d/%Y')
branchname=data
echo Setup for branch \'$branchname\'
echo $now
echo
if [[ $(git rev-parse --abbrev-ref HEAD) = $branchname ]]
then
    echo "Currently on branch $branchname"
    if [[ $(git status | grep 'nothing to commit') ]]
    then
      echo "ERROR: Nothing to commit!"
    else
      git add .
      if [[ $(git log -1 --pretty=%B | grep 'Data update') ]]
      then
        echo "Latest commit was a data update, amending"
        git commit --amend -m "Data update from $now"
        echo "Commited"
        git push -f
        echo "Pushed data (-f) to branch '$branchname'"
      else
        echo "Latest commit not a data update, creating new commit"
        git commit -m "Data update from $now"
        echo "Commited"
        git push
        echo "Pushed data to branch '$branchname'"
    fi
  fi
else
    echo "ERROR: Not on branch $branchname - current branch is $(git rev-parse --abbrev-ref HEAD)"
fi
