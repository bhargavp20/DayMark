<<<<<<< HEAD
# Daymark — Final enhancements build

Daymark is a local-first React/Vite productivity app for tasks, habits, analytics, calendar, reminders, backup/restore, and PWA/offline use.

## Run locally
1. Install Node.js LTS.
2. Extract this ZIP.
3. Open the `daymark-final-enhancements` folder in VS Code.
4. In the terminal, run `npm install`.
5. Run `npm run dev` and open the local URL Vite prints.
6. For a production build, run `npm run build`.

## Included in this update
- Uses the supplied current `App.jsx` and `styles.css` as the baseline.
- Keeps the existing task/habit bulk staging flows, IndexedDB stores, reminder settings and per-task reminder overrides, backup/restore, calendar, theme, and PWA files.
- Adds a locally persisted editable profile name and initials avatar in the sidebar.
- Removes the decorative motivational-card progress bar and its label while retaining the Sparkles icon and motivational copy.
- Fixes voice time parsing so `at 4 PM` is removed from the title case-insensitively.
- Reworks task and habit analytics to provide separate date ranges for daily completion rate (defaults to today), completion trend (defaults to the last 7 days), and activity heatmap (defaults to the last year). Custom date ranges are supported, and heatmaps are grouped into separate calendar-year sections.

## Notes
- Voice recognition and browser notifications depend on browser/device permissions and support.
- Data is stored locally in the browser; export a backup before clearing browser data.
=======
# DayMark
A personal productivity app for tasks, habits, and analytics
>>>>>>> 2e12a539f774efc5eb31838c614bf153dda643a5
