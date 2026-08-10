#! /usr/bin/bash
echo
[[ "$PWD" =~ "update-scripts" ]] && cd ..
pwd
now=$(date +'%m/%d/%Y')
merge_into=data
merge_from=develop
echo

if [[ $(git rev-parse --abbrev-ref HEAD) != $merge_into ]]
then
	echo "ERROR: Not on branch $merge_into - current branch is $(git rev-parse --abbrev-ref HEAD)"
	exit 1
fi

echo "Currently on branch $merge_into"

# Single worktree scan. `head -1` stops us from slurping ~1M lines into a variable.
if [[ -n $(git status --porcelain | head -1) ]]
then
	echo "ERROR: There are uncommited files in $merge_into branch!"
	exit 1
fi

# Update the local $merge_from ref without ever checking it out. Checking it out
# would delete ~1M data files from the worktree and then restore them.
echo "Fetching $merge_from..."
if ! git fetch origin $merge_from:$merge_from
then
	echo "ERROR: Could not fast-forward local '$merge_from' to origin/$merge_from."
	echo "       Resolve it manually (local '$merge_from' has probably diverged)."
	exit 1
fi

# This branch is expected to be exactly one 'Data update' commit on top of $merge_from.
# Bail out instead of silently squashing real work into the data commit.
base=$(git merge-base HEAD $merge_from)
ahead=$(git rev-list --count "$base"..HEAD)
if [[ $ahead -gt 1 ]]
then
	echo "ERROR: '$merge_into' is $ahead commits ahead of '$merge_from', expected 0 or 1."
	echo "       Refusing to squash them into a single data commit."
	exit 1
fi

# Only paths that changed between the old and new $merge_from tips get written.
# The ~1M data paths differ on this side only, so they are left untouched on disk.
echo "Merging $merge_from..."
if ! git merge --no-edit $merge_from
then
	git merge --abort
	echo "ERROR: Merge conflict with $merge_from. Nothing was changed."
	exit 1
fi

# Collapse back to a single data commit on top of $merge_from.
# --soft only moves the branch ref: the index and the worktree are not touched,
# so this costs nothing regardless of how many files are tracked.
git reset --soft $merge_from
if git diff --cached --quiet
then
	echo "Nothing to commit - '$merge_into' already matches '$merge_from'."
	exit 0
fi
git commit --quiet -m "Data update from $now"
echo "Merged $merge_from to $merge_into successfully."
