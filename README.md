# AMC Practice

A small, friendly study app for the **AMC 8** and **AMC 10** math contests.
Plain HTML, CSS and JavaScript: no build step, no server, no accounts. It works
on GitHub Pages and on phones and tablets.

## What’s inside

| Feature | What it does |
|---|---|
| **Mock contest** | AMC 10 (25 questions, 75 min, 6 / 1.5 / 0 scoring) or AMC 8 (25 questions, 40 min, 1 point per correct answer). Bubble sheet A–E plus “blank”, countdown timer, flag for review, automatic scoring against a stored answer key. If the page is reloaded, the contest resumes and the clock keeps running. |
| **Pacing tracker** | Records time on every question. Afterwards it shows a per-question chart, a timeline of the order questions were visited, and flags anything over 4 minutes. |
| **Skip-strategy coach** | AMC 10: what the score would have been with different blank-or-guess choices, plus a table of when a guess beats a blank. AMC 8: a reminder never to leave a blank. |
| **Error log & retry queue** | Tag missed questions by topic (Algebra, Counting & Probability, Number Theory, Geometry) with a note. They come back 1, 3 and 7 days later; three correct retries means it’s mastered. A “not yet” restarts the schedule. |
| **Mini-lessons** | Two equations with two unknowns, substitution and elimination, shown with an animated balance scale. Written for a 6th grader, followed by original practice problems. |
| **Practice drills** | 48 original problems by topic, each with a hint and a worked solution. |
| **Progress dashboard** | Scores over time, drill accuracy by topic, error log by topic, average time per question. |
| **Home** | A “today” panel with a countdown to the next contest, the current practice streak, and a **Start today’s practice** button that picks due retries first, then a drill on the weakest topic. |
| **Settings** | Light / dark / match-device theme, contest dates for the countdown, answer keys, backup. |

Keyboard: in a mock contest press <kbd>A</kbd>–<kbd>E</kbd> to answer, <kbd>0</kbd> to blank,
<kbd>F</kbd> to flag, and <kbd>←</kbd> <kbd>→</kbd> to move. Lessons use <kbd>←</kbd> <kbd>→</kbd>.

## Copyright: no contest content in this repo

This repository contains **no real AMC problems, figures or answer keys**.

- The student reads past problems somewhere else, for example the
  [AoPS wiki](https://artofproblemsolving.com/wiki/index.php/AMC_Problems_and_Solutions), in another tab.
- A parent pastes an answer key (for example `BDACE…`, or a numbered list) on the
  **Settings** screen. It is stored **only in that browser’s localStorage**, never in the code.
- All drill and lesson problems were written for this app.

### Adding past contests quickly

In **Settings → Answer keys → Add from the AoPS wiki**, pick a year and contest (AMC 8, AMC 10A/10B,
the 2021 Fall AMC 10A/10B, or the 2000–2001 AMC 10). The app links to that contest’s answer-key page on
the AoPS wiki. Select all on that page, copy, and paste it into the box; the app finds the 25 answers,
names the key (e.g. “2024 AMC 8”) and saves a link to the problems page, which the student gets as
**Open problems ↗** during the mock contest. After saving, the year steps back by one so a run of
past contests can be added in a row.

To move keys to another device without touching progress, use **Backup → Export answer keys** and
**Import answer keys** (it adds new keys and skips ones already saved). Keep that file out of this
repository.

## Your data

Study data is saved in the browser’s `localStorage` under the key `amcPrep.v1`. Display preferences
(theme and contest dates) live separately under `amcPrep.ui`, so they never mix with study data.
Nothing is sent anywhere. (The Inter font is loaded from Google Fonts; without a connection the app
falls back to the system font.) Clearing browser data erases it, so use
**Settings → Export backup** now and then; **Import backup** restores it (also handy for
moving to another device). The app stores no names or other personal information.

## Run it locally

ES modules need to be served over HTTP (opening `index.html` as a file won’t work):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Tests

Requires Node.js 18 or newer (no packages to install):

```bash
npm test
```

The tests cover scoring, key parsing, pacing, the retry schedule, storage and
export/import, answer matching, and the lesson scales. **Every practice problem’s answer is
recomputed in `tests/problems.test.js`**, mostly by brute force (counting, enumerating, searching),
independently of the written solution. The suite fails if any problem lacks a verifier or if a
stored answer doesn’t match the computed one. Don’t add a problem you can’t verify there.

## Deploy to GitHub Pages

1. Push this repository to GitHub (the app files are at the repository root).
2. On GitHub, open the repository’s **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose the branch **`main`** and the folder **`/ (root)`**, then click **Save**.
5. Wait a minute or two. The site will be live at
   `https://<your-username>.github.io/<repository-name>/`.

The empty `.nojekyll` file tells GitHub Pages to serve the files as they are. All paths are
relative, so the app works from a project subpath.

## Project layout

```
index.html          App shell and navigation
css/styles.css      Styles (large text, light/dark themes, phone layout)
js/app.js           Views, routing and event handling
js/scoring.js       Contest rules, key parsing, scoring, skip-strategy what-ifs
js/pacing.js        Per-question timing and timeline
js/retry.js         Error-log topics and the 1/3/7-day retry schedule
js/storage.js       localStorage, JSON export/import
js/problems.js      Original practice problems with worked solutions
js/lessons.js       Balance-scale lessons
js/answers.js       Comparing typed answers (3/8 = 0.375)
js/stats.js         Dashboard aggregations
js/charts.js        Small SVG charts
js/home.js          Streak, contest countdown, “today’s practice” pick
js/prefs.js         Theme and contest-date preferences
js/icons.js         Inline SVG icons
js/keys.js          AoPS links, reading pasted answer keys, key import/export
tests/              Node test runner tests
```
