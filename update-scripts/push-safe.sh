#! /usr/bin/bash
echo
[[ "$PWD" =~ "update-scripts" ]] && cd ..
echo "[GIT] Working dir: $PWD"
now=$(date +'%m/%d/%Y')
branchname=data
echo "[GIT] Date: $now"
echo "[GIT] Setup for branch '$branchname'"
echo

if [[ $(git rev-parse --abbrev-ref HEAD) != $branchname ]]
then
  echo "[GIT] ERROR: Not on branch $branchname - current branch is $(git rev-parse --abbrev-ref HEAD)"
  exit 1
fi

echo "[GIT] Currently on branch $branchname"

# Stage first: this is the only pass over the worktree the script needs.
# The old 'git status | grep' ran a second full scan and captured its whole
# output (~1M lines after a data regen) into a shell variable.
echo "[GIT] Staging changes..."
git add -A

# Index vs HEAD only - no worktree walk at all.
if git diff --cached --quiet
then
  echo "[GIT] ERROR: Nothing to commit!"
  exit 1
fi

if git log -1 --pretty=%B | grep -q 'Data update'
then
  echo "[GIT] Latest commit was a data update, amending"
  git commit --quiet --amend -m "Data update from $now"
  echo "[GIT] Commited successfully"
  git push --quiet -f
  echo "[GIT] Pushed data (-f) to branch '$branchname' successfully"
else
  echo "[GIT] Latest commit not a data update, creating new commit"
  git commit --quiet -m "Data update from $now"
  echo "[GIT] Commited"
  git push --quiet
  echo "[GIT] Pushed data to branch '$branchname'"
fi
