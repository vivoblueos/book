# Submit pull requests

As mentioned before, we are using `repo` to manage the project, sometimes developer's change might be involved in more than one repositories.
We recommend developers to use following workflow to submit PRs.

Assume a developer have to change code in `kernel` and `build` repository. The developer first have to fork the two repositories. Then add new
`remote` for the two repositories. For example
```bash
git remote add <user> git@github.com:<user>/kernel
git checkout -b feature-x
# Change code and commit
git push <user>
```
Then create a new PR for the `kernel` repository.

Do the same to the `build` repository.

To trigger a build in CI, the developer has to issue following comment in the page of one of the PRs.

> build_prs <url-of-the-kernel-pr> <url-of-the-build-pr>
