#! /usr/bin/bash
echo
[[ "$PWD" =~ "update-scripts" ]] && cd ..
echo "[GIT] Working dir: $PWD"
now=$(date +'%m/%d/%Y')
branchname=data
echo "[GIT] Date: $now"
echo "[GIT] Setup for branch '$branchname'"
echo
if [[ $(git rev-parse --abbrev-ref HEAD) = $branchname ]]
then
  echo "[GIT] Currently on branch $branchname"
  if [[ $(git status | grep 'nothing to commit') ]]
  then
    echo "[GIT] ERROR: Nothing to commit!"
  else
    git add .
    if [[ $(git log -1 --pretty=%B | grep 'Data update') ]]
    then
      echo "[GIT] Latest commit was a data update, amending"
      git commit --quiet --amend -m "Data update from $now"
      echo "[GIT] Commited successfully"
      git push --quiet -f
      echo "[GIT] Pushed data (-f) to branch '$branchname' successfully"
    else
      echo "[GIT] Latest commit not a data update, creating new commit"
      git commit -m "Data update from $now"
      echo "[GIT] Commited"
      git push
      echo "[GIT] Pushed data to branch '$branchname'"
    fi
  fi
else
  echo "[GIT] ERROR: Not on branch $branchname - current branch is $(git rev-parse --abbrev-ref HEAD)"
fi
