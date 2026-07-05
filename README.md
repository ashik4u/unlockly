# Unlockly

A small static link-locker app for private use. Create an unlock URL with task links, share the generated URL, and let visitors unlock the destination after opening each task link.

## Online Version

This repo is ready for GitHub Pages. After the Pages workflow runs, the site should be available at:

```text
https://ashik4u.github.io/unlockly/
```

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
