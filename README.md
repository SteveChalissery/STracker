# MoneyTrack — Student Money & Work Tracker

A private, browser-based personal finance dashboard designed for an Australian student who wants to track:

- Daily earnings from Uber Eats and future jobs
- Daily personal/business expenses
- A configurable tax-reserve percentage (default 15%)
- Work hours across all jobs
- The 48-hour-per-fortnight student visa limit
- Current estimated money available
- Earnings and expense graphs
- Monthly reports
- Editing/deleting historical entries
- JSON export/import backups

## Important privacy model

This app is a static HTML/CSS/JavaScript site. Entries are stored in **your browser's localStorage**. They are not written into GitHub.

Use **Export backup** regularly because clearing browser data or switching browsers/devices will not automatically transfer your entries.

A static GitHub Pages site does not provide a secure login/database. If you need true access control, use an authenticated hosting/backend service instead of relying on a client-side PIN.

## GitHub Pages

The app works as a static GitHub Pages site.

1. Create a repository.
2. Upload `index.html`, `styles.css`, `app.js`, and this README.
3. Enable GitHub Pages under **Settings → Pages**.
4. Deploy from the `main` branch and `/ (root)`.

GitHub's current documentation says Pages is available from private repositories on GitHub Pro/Team/Enterprise, while GitHub Free supports Pages from public repositories. A Pages site itself should not be treated as a private/authenticated website.

## Tax note

The 15% reserve is only a budgeting setting. It is **not** an ATO tax rate or guarantee of your final tax bill. Uber/delivery income can be assessable business income and work-related expenses may affect taxable income. Keep your records and confirm your own tax position with the ATO or a registered tax professional.

## Work-limit note

The dashboard defaults to 48 hours per fortnight and treats a fortnight as Monday–Sunday + Monday–Sunday (14 days), matching the current legislative definition for the Student visa work condition. Always check your own visa conditions in VEVO/Home Affairs before relying on the tracker.

## Tech

No build step. Chart.js is loaded from jsDelivr. The app can also be opened directly as `index.html`.
