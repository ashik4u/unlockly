# Unlockly

A small static link-locker app for private use. Create an unlock URL with task links, share the generated URL, and let visitors unlock the destination after opening each task link.

## Online Version

This repo is ready for GitHub Pages. After the Pages workflow runs, the site should be available at:

```text
https://ashik4u.github.io/unlockly/
```

If the first workflow run says `Get Pages site failed` or `Resource not accessible by integration`, enable Pages once in the repository settings:

1. Open `Settings` -> `Pages`.
2. Under `Build and deployment`, set `Source` to `GitHub Actions`.
3. Save, then rerun the `Deploy GitHub Pages` workflow.

## Run Locally

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
```

## Notes

- This is a client-side convenience gate, not strong access control.
- Link tasks auto-check when opened.
- Progress is stored in `sessionStorage` for the current browser session.
