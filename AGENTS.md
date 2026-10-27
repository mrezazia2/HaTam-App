# Release policy

For each user-authorized publication/push of a new Hatam version:
- Increment the project version in package.json and package-lock.json consistently (SemVer, patch by default).
- Update CHANGELOG.md with Persian release notes and the actual checks performed; do not imply a completion percentage from the version number.
- Update public/release.json to identify the deployed version.
- Push the requested branch (currently main) without force-pushing, create an annotated vX.Y.Z tag, and publish a GitHub Release with numbered Persian title and change/test notes.
- Confirm VPS deployment and HTTP/health checks before marking the GitHub Release as deployed; report incomplete stages honestly.
- Keep secrets, credentials, local QA artifacts and unrelated files out of commits and releases.
