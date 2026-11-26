# Early previews, preview links and installed surfaces

## Early owner preview

**Show work early only when the owner asks for that preview.** Use a development tunnel or the named push; every deploying push still needs review first. Say which phase review has not run and disclose incomplete tests as in `SKILL.md` § The owner's preview; this request is the exception to waiting for a clean series.

## The preview link

When the deployed development URL does not contain the change, or before deployment, use a Cloudflare quick tunnel to `next dev`. Its address is public: use development only, share the link only with the owner, then stop tunnel and server when done. Apply `environments`, `references/environments-and-branches.md § Showing development to the owner`.

## Promotion and installed surfaces

Go-live and broad UI changes require the full exploratory sweep (`checklist.md` § 1).
- **"Ready to test" means installed on every surface the owner holds, with nothing for the owner to do first.** Sites serve the latest push, installed apps or extensions their last installed build, and phones their last pushed bundle. These surfaces can diverge silently, so require your own green tests as above, a committed change, and every owner-used surface rebuilt and reinstalled or pushed. Say which surfaces carry which build and which need a reload or restart. Finish the batch, or hand off what exists with its edges stated. Apply `delegation` for the handoff side of this rule.
