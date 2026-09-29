# How to use the blueos repository

## Relationship with the component repositories

Previously, components such as kernel, build, libc, and book were maintained
in separate Git repositories. The manifests repository described their URLs,
revisions, and local paths. Developers used `repo init` and `repo sync` to
assemble a complete source workspace. Each component remained a separate Git
repository with its own branches, commit history, and pull requests (PRs).

Changes spanning several repositories required a branch and a PR in each
repository, making review and CI validation harder to coordinate.

The blueos repository brings these components together. Its component paths
match those in the workspace created with `repo init`, and Josh preserves
the imported commit history.

## Basic workflow

1. For new work, usually create a branch from the central repository's `main`.
2. For work already started in a component repository, import the branch and
   integrate it with the complete central history. Continue development there
   and publish a central branch and PR.

### Choose where to develop and submit PRs

Keep the development branch and PR for a task in the central repository
where possible. Avoid maintaining the same branch in both repositories.
If several people share the original branch, agree on how to migrate it and
where further development will take place.

| Situation | Recommended workflow |
| --- | --- |
| New work based on default branches | Start from the complete central `main`. |
| Existing component branch or open PR | Import it and publish a central PR. |
| Dependencies on open branches or PRs | Integrate the work and dependencies. |
| Changes across several components | Develop, validate, and submit centrally. |

Changes limited to book or another independent component can also be
submitted directly to that repository. Import and integrate any unmerged
dependencies together. If a dependency is already a complete central branch,
use Git to merge it or transplant its commits. After migrating a PR, close
the original and explain the migration to avoid merging the work twice.

## Import component branches

### Install the tools

You need Python 3, Git, `josh`, and `josh-filter`. The following command
installs both Josh programs:

```bash
cargo +stable install josh-cli --locked \
    --git https://github.com/josh-project/josh.git \
    --tag r26.07.19
```

Use a standard Rust toolchain for installation rather than blueos's custom
Cargo.

### Configure remotes and fetch branches

A Josh remote places the component's files under the corresponding central
directory. For example, `:prefix=build` maps the component repository's root
to `build/` in the central repository.

| Component name (`--repo`) | Josh remote filter |
| --- | --- |
| `apps_example` | `:prefix=apps/example` |
| `apps_shell` | `:prefix=apps/shell` |
| `book` | `:prefix=book` |
| `build` | `:prefix=build` |
| `external` | `:prefix=external` |
| `kernel` | `:prefix=kernel` |
| `libc` | `:prefix=libc` |
| `librs` | `:prefix=librs` |

Configure the remotes you need. Skip remotes that are already configured:

See the [appendix](#appendix) for the complete template.

```bash
josh remote add fork-build \
    https://github.com/{{YOUR_USERNAME}}/build.git ':prefix=build'
josh remote add fork-kernel \
    https://github.com/{{YOUR_USERNAME}}/kernel.git ':prefix=kernel'

josh fetch --remote fork-build
josh fetch --remote fork-kernel
git --no-pager branch --list --all
```

The remote names `fork-build` and `fork-kernel` are local names you choose.
After fetching, select an imported branch using a remote-tracking reference
such as `fork-build/branch-name`. Configure upstream repositories the same
way, changing the remote name and URL.

`josh fetch` updates remote-tracking references. It does not move your local
development branch or integrate the imported branch into the full central
history.

## Integrate imported branches with the complete blueos repository

An imported branch contains only its component's files. Integrate it with
the central history containing all components before using it as a complete
central branch and publishing a central PR.

The early central history imported the component repositories in stages.
In `vivoblueos/blueos`, the commit completing these initial imports is
`a0d6549f6078a624dc513d4d2a34f5cf47e02f13`. Usually start from the central
`main` or a central branch that already integrates the previous imports.
After integration, check that the initial import commit is an ancestor:

```bash
git merge-base --is-ancestor \
    a0d6549f6078a624dc513d4d2a34f5cf47e02f13 \
    branch-name
```

An exit code of 0 confirms the ancestry. This checks the history relationship;
you still need to validate the resulting files and build for your changes.

You can first test a merge or rebase in the component repository. The central
repository may contain changes that have not yet been synchronized back, so
central integration can still require conflict resolution and validation.

### Integrate with rebase

Use Git rebase to transplant the imported branch's changes onto the central
`main`. The examples assume that the component `main` changes excluded by
rebase are already present in the central starting point.

```bash
# Transplant build's miri/allocator branch onto the full central history.
git switch -c import/build-miri-rebased fork-build/miri/allocator
git rebase --onto main fork-build/main
# The result can now be used as a complete central branch.

# Add kernel's changes on top of the previous result.
git switch -c blueos/miri/allocator-rebased fork-kernel/miri/allocator
git rebase --onto import/build-miri-rebased fork-kernel/main

git push origin blueos/miri/allocator-rebased
```

### Integrate with merge

Merging a raw Josh import into the central `main` also brings in its full
history. Changes already synchronized to the central repository can have
different SHAs under different transformations, so they may reappear as extra
commits in the branch and PR.

Use `merge-subtree-branches.py` to handle this mapping. Each invocation
integrates one imported branch with a merge. Run it sequentially to import
multiple components:

```bash
# Import build's miri/allocator branch starting from the central main.
python3 tools/josh/merge-subtree-branches.py \
    --repo build \
    --source-remote fork-build \
    --source-branch miri/allocator \
    --target-base main \
    --target-branch blueos/miri/allocator

python3 tools/josh/merge-subtree-branches.py \
    --repo kernel \
    --source-remote fork-kernel \
    --source-branch miri/allocator \
    --target-base blueos/miri/allocator \
    --target-branch blueos/miri/allocator
```

| Parameter | Meaning |
| --- | --- |
| `--repo` | Component name; its directory must match the remote prefix. |
| `--source-remote` | Configured Josh remote name. |
| `--source-branch` | Component branch to import. |
| `--target-base` | Starting central commit; defaults to `main`. |
| `--target-branch` | Local central branch to create or append a merge to. |
| `--repo-root` | Central checkout; defaults to the script's repository. |

`--target-base` accepts branch names, tags, full or unique abbreviated SHAs,
and Git expressions such as `HEAD~1`. Both `branch` parameters accept branch
names only. The script fixes the starting commit before merging, so
`--target-base` may name the target branch itself.

If the target branch does not exist, the script creates it from the starting
commit. Otherwise, it appends a merge, and the starting commit must be an
ancestor of the target branch or its tip. Existing target commits are
preserved; the branch is not reset.

Commit tracked changes or save them with `git stash` before running the
script. It rejects uncommitted tracked changes and ongoing operations such
as merge or rebase. It switches branches and merges in the current working
tree, staying on the target branch after success.

## Push changes back to a component branch

Skip this section if you will maintain the branch only in the central
repository. To continue maintaining a component branch, export its directory
with `push-subtree-branch.py`.

```bash
# Select commits between --source-base (excluded) and --source-rev (included).
#
# Add --push for an actual push, and --force for non-fast-forward updates.
python3 tools/josh/push-subtree-branch.py \
    --source-base main \
    --source-rev blueos/miri/allocator \
    --repo build \
    --target-remote fork-build \
    --target-base main \
    --target-branch miri/allocator \
    --force
```

### Choose the export range and component baseline

Use two central commit parameters to select a range:

- `--source-base`: the central baseline before your changes. Exclude this
  commit and its ancestors.
- `--source-rev`: the final central branch tip. Include this commit.

The range is Git's `SOURCE_BASE..SOURCE_REV`. For a merge branch, it also
includes merged commits reachable from the tip but not from the baseline.
Linear and merge branches therefore use the same selection model. Each run
filters one directory, including later changes to that directory made on
the final branch.

Both central parameters accept branch names, tags, full or unique abbreviated
SHAs, and expressions such as `HEAD` or `HEAD~1`. They are resolved to fixed
SHAs at the start. `--source-base` must be an ancestor of `--source-rev` or
the same commit. Equal endpoints select an empty range.

`--target-base` selects the component baseline branch for the replay, usually
the PR's target branch. Use it together with `--source-base`. The selected
directory in the central baseline must contain the same files as the
component baseline. The baselines need not have the same name, and the
script does not choose or record the central baseline automatically.

The script replays the filtered range onto the component baseline and uses
the result to update `--target-branch`. Only that branch is pushed; when it
differs from `--target-base`, the baseline branch stays unchanged. Range mode
flattens filtered merges. If replay causes conflicts or changes the final
files compared with the source directory, the script returns an error
without pushing.

### Preview and push

First preview the build export:

```bash
python3 tools/josh/push-subtree-branch.py \
    --source-base main \
    --source-rev blueos/miri/allocator \
    --repo build \
    --target-remote fork-build \
    --target-base main \
    --target-branch miri/allocator \
    --force
```

To export kernel from the same final central branch, change the component
and remote:

```bash
python3 tools/josh/push-subtree-branch.py \
    --source-base main \
    --source-rev blueos/miri/allocator \
    --repo kernel \
    --target-remote fork-kernel \
    --target-base main \
    --target-branch miri/allocator \
    --force
```

| Parameter | Meaning |
| --- | --- |
| `--source-base` | Excluded central baseline; paired with `--target-base`. |
| `--source-rev` | Required final central commit; included in the range. |
| `--repo` | Component name; uses the merge script's directory mapping. |
| `--target-remote` | Configured target Josh remote name. |
| `--target-base` | Component baseline branch for the replay. |
| `--target-branch` | Component branch to update or create. |
| `--repo-root` | Central checkout; defaults to the script's repository. |
| `--force` or `-f` | Use Josh's force push for non-fast-forward updates. |
| `--push` | Push after a successful preview; omit for a dry run. |

The push script's `--target-base` and `--target-branch` accept component branch
names only. The default is a dry run without force. Adding `--force` still
only previews the update. Use it when rewritten history requires a
non-fast-forward update.

In the output:

- `BEFORE (current remote)` shows the component branch fetched before the
  update.
- `AFTER (proposed, not pushed)` shows the candidate that has not been pushed.

After checking the preview, add `--push` to the same command. For example,
force-push the build branch:

```bash
python3 tools/josh/push-subtree-branch.py \
    --source-base main \
    --source-rev blueos/miri/allocator \
    --repo build \
    --target-remote fork-build \
    --target-base main \
    --target-branch miri/allocator \
    --force --push
```

`Push completed` appears only after an actual successful push. The script
processes committed content without moving the central development branch
or modifying the current working tree. Its detached temporary worktree is
cleaned up automatically; no temporary branch is created. Filtered results
are stored in `refs/export/<remote>/<target-branch>`. Range mode also uses
`refs/export-bases/<remote>/<target-branch>`. These helper refs are regenerated
on each invocation and do not track push progress together with the import
script.

The examples use the merge result `blueos/miri/allocator`. If you followed
the rebase workflow, use `--source-rev blueos/miri/allocator-rebased` instead.

### Export the full history

To filter all history reachable from the final commit, omit both baseline
parameters and specify only `--source-rev`:

```bash
python3 tools/josh/push-subtree-branch.py \
    --source-rev blueos/miri/allocator \
    --repo build \
    --target-remote fork-build \
    --target-branch miri/allocator
```

This mode may retain central import merges and old synchronization commits.
To exclude history before your changes, use range mode with explicit
baselines. A SHA selects one commit; it does not by itself express the start
and end of your changes.

## Get updates from component repositories

`josh fetch` updates component remote-tracking references without moving
local development branches. If the branch has migrated and is maintained
only centrally, continue using the normal central workflow. If you still
need component branch updates, distinguish the following cases.

### The remote advances normally

For a branch that still uses the original Josh import history, merge the
new remote-tracking reference using ordinary Git commands.

For a development branch already integrated with the full central history,
remap or transplant updates first. Directly merging the raw import reference
can bring back old history. With the merge workflow, run the import script
again using the current central branch as the starting point:

```bash
python3 tools/josh/merge-subtree-branches.py \
    --repo build \
    --source-remote fork-build \
    --source-branch miri/allocator \
    --target-base blueos/miri/allocator \
    --target-branch blueos/miri/allocator
```

The script fetches, maps, and merges the source. With the rebase workflow,
identify the last imported component commit and transplant only the new
changes onto the current central branch. The current component `main` is
not necessarily that boundary.

### The remote is rebased or force-pushed

Appending a merge preserves the old version's history in the central branch.
To remove commits deleted or rewritten on the remote, integrate the latest
component branch again from a complete central baseline. Then replay the
local changes and other components' changes that you need to retain.

Keep the original branch for comparison when rebuilding. Check the commit
range, resulting files, and build. This still converts component history to
complete central history; a successful fetch alone does not validate the
integration.

See [Josh branch tools][josh] for the complete parameters and helper ref
behavior of both scripts.

[josh]: https://github.com/vivoblueos/blueos/blob/main/tools/josh/README.md

## Appendix

### Import component branches

```bash
cd blueos
josh remote add upstream-apps_example \
    https://github.com/vivoblueos/apps_example.git ':prefix=apps/example'
josh remote add upstream-apps_shell \
    https://github.com/vivoblueos/apps_shell.git ':prefix=apps/shell'
josh remote add upstream-book \
    https://github.com/vivoblueos/book.git ':prefix=book'
josh remote add upstream-build \
    https://github.com/vivoblueos/build.git ':prefix=build'
josh remote add upstream-external \
    https://github.com/vivoblueos/external.git ':prefix=external'
josh remote add upstream-kernel \
    https://github.com/vivoblueos/kernel.git ':prefix=kernel'
josh remote add upstream-libc \
    https://github.com/vivoblueos/libc.git ':prefix=libc'
josh remote add upstream-librs \
    https://github.com/vivoblueos/librs.git ':prefix=librs'

josh fetch --remote upstream-apps_example
josh fetch --remote upstream-apps_shell
josh fetch --remote upstream-book
josh fetch --remote upstream-build
josh fetch --remote upstream-external
josh fetch --remote upstream-kernel
josh fetch --remote upstream-libc
josh fetch --remote upstream-librs

josh remote add fork-apps_example \
    https://github.com/{{YOUR_USERNAME}}/apps_example.git ':prefix=apps/example'
josh remote add fork-apps_shell \
    https://github.com/{{YOUR_USERNAME}}/apps_shell.git ':prefix=apps/shell'
josh remote add fork-book \
    https://github.com/{{YOUR_USERNAME}}/book.git ':prefix=book'
josh remote add fork-build \
    https://github.com/{{YOUR_USERNAME}}/build.git ':prefix=build'
josh remote add fork-external \
    https://github.com/{{YOUR_USERNAME}}/external.git ':prefix=external'
josh remote add fork-kernel \
    https://github.com/{{YOUR_USERNAME}}/kernel.git ':prefix=kernel'
josh remote add fork-libc \
    https://github.com/{{YOUR_USERNAME}}/libc.git ':prefix=libc'
josh remote add fork-librs \
    https://github.com/{{YOUR_USERNAME}}/librs.git ':prefix=librs'

josh fetch --remote fork-apps_example
josh fetch --remote fork-apps_shell
josh fetch --remote fork-book
josh fetch --remote fork-build
josh fetch --remote fork-external
josh fetch --remote fork-kernel
josh fetch --remote fork-libc
josh fetch --remote fork-librs
git --no-pager branch --list --all
```
