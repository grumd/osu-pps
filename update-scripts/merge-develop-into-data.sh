#! /usr/bin/bash
echo
[[ "$PWD" =~ "update-scripts" ]] && cd ..
pwd
now=$(date +'%m/%d/%Y')
merge_into=data
merge_from=develop
echo
if [[ $(git rev-parse --abbrev-ref HEAD) = $merge_into ]]
then
    echo "Currently on branch $merge_into"
    if [[ $(git status | grep 'nothing to commit, working tree clean') ]]
    then
	  git checkout $merge_from
	  git pull
	  git checkout $merge_into
	  git reset HEAD~1
	  git stash -u
	  git merge $merge_from
	  git stash pop
	  git add .
	  git commit -m "Data update from"
	  echo "Merged $merge_from to $merge_into successfully."
    else
      echo "ERROR: There are uncommited files in $merge_into branch!"
    fi
  fi
else
    echo "ERROR: Not on branch $merge_into - current branch is $(git rev-parse --abbrev-ref HEAD)"
fi
