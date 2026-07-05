# Unlockly

A small static link-locker app for private use. Create an unlock URL with task links, share the generated URL, and let visitors unlock the destination after opening each task link.

## Online Version

This repo is ready for GitHub Pages. After the Pages workflow runs, the site should be available at:

```text
https://ashik4u.github.io/unlockly/
```

Generated links use short path codes, for example:

```text
https://ashik4u.github.io/unlockly/7KQ2M
```

## Works on All Devices

Generated links are designed to work seamlessly across all devices:

- **Desktop**: Full functionality with keyboard and mouse navigation
- **Tablet**: Optimized touch interface with responsive layout
- **Mobile**: Mobile-friendly design with optimized task display

Example cross-device links:
- https://ashik4u.github.io/unlockly/7KQ2M
- https://ashik4u.github.io/unlockly/3XJ9L
- https://ashik4u.github.io/unlockly/K8M2Q

**Note on Data Storage**: Because this is a static app, short-code data is stored in the browser that created it. For public cross-device short links with persistent data across devices, you'll need to add a small backend or database.

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
- Short-code data is stored in `localStorage`.
- Link tasks auto-check when opened.
- Progress is stored in `sessionStorage` for the current browser session.
