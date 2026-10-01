# 🤝 TribeTap

**TribeTap: Find Your People in 60 seconds.** A QR icebreaker for live events. "Find Your People" is the
activity; the event title shown to guests is set per event on the host's 🎨 Branding.

Put one QR code on the main screen. Everyone scans it, types their first name, and gets a category:

| # | Category | Each person shares one… |
|---|----------|-------------------------|
| 1 | 💰 Money | money tip |
| 2 | 💼 Career | career tip |
| 3 | ❤️ Relationships | relationship lesson |
| 4 | 💡 Business | business or productivity tip |
| 5 | ✝️ Faith | faith lesson |
| 6 | 🧭 Purpose | lesson about finding your direction |

## What happens on the phone

1. **Reveal:** a slot-machine shuffle lands on your category, with confetti and a buzz. If the host set a
   meeting spot, the phone says where to go, e.g. "📍 Head to: LEFT ROW".
2. **Your team:** teams form automatically 1 minute after the last person scans (the phone shows a
   countdown), or sooner if the host taps **Form teams**. Every phone buzzes and shows "PURPOSE · TEAM 2" plus
   your teammates' names. Tap **We found each other!** once your team is together.
3. **Fun question round (5 cards):** 3 "🧠 Did you know?" quiz questions (everyone taps an answer on
   their own phone and sees a fun fact) and 2 "🗣️ Team talk" questions everyone answers out loud.
   It ends with a score, so the team can compare who knew the most.
4. **Your team's missing piece:** each person shares one tip (2-minute timer on the phone), and the team
   picks the ONE tip the room needs to hear.
5. **Send to the big screen:** the phone asks "🎤 Who's sending your team's tip?" Only the person who taps
   **Me! I'll send it** gets the tip box. Everyone else sees "watch the big screen", then "✅ Lola sent
   your team's tip" once it's in. Each team has one card on the **Tip Wall**. If two teammates send, the
   newer one replaces the older one.
6. **⭐ Quick feedback + 📬 optional email:** shown automatically, with nothing for the host to press: on the
   final challenge screen (whoever sends the tip), on the tip-sent screen, and, for anyone who stops early,
   at the bottom of whatever screen they're on once they've been playing for 12 minutes. The phone asks "How fun was this?" (😴 to 🤩),
   "Would you want this at your next event?" (Yes / Maybe / No) and "One thing we should improve?", then
   offers "Want the Tip Wall sent to you?" Averages show on Live Data; comments and emails are only in the
   downloaded spreadsheet.
7. **✅ I’m done:** under the feedback, ends with "🎉 Thanks, George! You’re all set. You can close this page now."
   The team board button stays available.

Questions live in `server.js` under each category's `questions` (and `GENERAL_QUESTIONS` for categories added on the Setup tab). Edit or add your own there.

## Teams

- Teams form **automatically** once scanning goes quiet: 1 minute after the last new scan by default (each new
  scan restarts the countdown). Change it to 30 sec, 2 or 3 min, or turn it off on ⚙️ Setup. The host can
  also tap **🔒 Form teams** at any time. Each category is split into the fewest teams of at
  most the max team size (6 by default, set on ⚙️ Setup), as evenly as possible (7 people → 4 + 3, 13 → 5 + 4 + 4, 80 people overall → teams of 4–5).
- People who scan after that are added to the smallest team in their category (a new team starts when
  all are full).
- **🔀 Re-shuffle teams** re-forms everything and clears the Tip Wall.

## What happens on the projector (`/host`)

- **📱 Join screen:** the QR code, live counts and names per category, pop-ups as people join, a 2, 3 or
  5 minute timer, the **Form teams** button, and **📍 Meeting spots** (type "Left row", "Back row" and so on,
  then Save; phones update right away).
- **👥 Teams:** every team with its members and meeting spot, so anyone confused can find their name.
  It opens automatically when you tap Form teams.
- **🥇 Leaderboard:** teams ranked by % of quiz answers right, with medals for the top 3. It updates as
  people finish the question round.
- **🏆 Tip Wall:** every team's best tip in big cards. Switch to it for the finale.
- **📋 Participants:** a numbered list of everyone who has scanned, by category.
- **⬇️ Download results** (Join screen and Participants tab): a spreadsheet (CSV, which opens in Excel,
  Numbers or Google Sheets) with every person's name, category, team, join time, quiz score, email (if
  given), their team's tip and their feedback. With the database set up, past sessions stay downloadable
  from **🗂️ Past sessions** on the Live Data tab; without it, download before you press Reset.
- **📊 Live Data:** total joined, joined in the last minute and last 5 minutes, the busiest minute, teams,
  tips sent, quizzes finished, emails collected, and a chart of people joining per minute over the last
  15 minutes (hover a bar for details).
- **⚙️ Setup:** choose your categories and team size before people scan. Turn any of the 6 categories
  on or off, rename them, change emojis and tip wording, add your own (2–12 in total), and set the max
  people per team (3–10). The original 6 keep their quiz questions even if renamed; new categories get
  general fun questions. Setup locks once people join; tap **Reset** to change it.
  **🎨 Branding** (on the same tab, changeable anytime): event title, accent color, background color and
  a logo (PNG, JPG, SVG or WebP under 300 KB). Phones pick it up when they load.
- A **🟢 LIVE** bar under the tabs shows total joined, joins in the last minute, teams and tips on every tab.

## Host script

Before people arrive, pick your categories and team size on **⚙️ Setup**, then fill in the **📍 Meeting spots** and tap Save.

> "Everybody stand up. Scan the QR code. Your phone is going to give you a category and tell you
> where to go. Head there now!"

Teams form by themselves a minute after the scanning stops (or tap **🔒 Form teams** to go sooner). The Teams
tab opens on the big screen automatically.

> "Check your phone. You now have a team! Find your teammates. If you're not sure who's who, find
> your name on the screen. GO!"

Start music and press **3 min**. When teams are together:

> "Look at your phone. Your team has 5 questions to go through together. Go!"

Press **5 min**, and show **🥇 Leaderboard** while teams play. When most teams are done:

> "Final challenge. Everyone knows something you don't. Pick ONE person on your team to be the sender.
> Each person shares one tip, and you have two minutes. Then pick the ONE tip the rest of the room needs
> to hear and send it to the big screen."

Press **2 min**. At the end, click **🏆 Tip Wall** and read a few out loud.

> "Last thing: there's a 15-second feedback question on your phone. Tell us honestly how it was!"

Afterwards, tap **⬇️ Download results** to keep the names, tips, emails and feedback.

## How assignment works

Each new person goes to the category with the fewest people so far. When there's a tie,
they go to the earliest category in the list above. In practice people fill Money → Career → … → Purpose
and then wrap back to Money. Categories never differ by more than 1 person.

Example with 14 people: Money 3, Career 3, Relationships 2, Business 2, Faith 2, Purpose 2.

If someone scans twice on the same phone, they get the same category again, so they can't be counted twice.

## Run it

```bash
node server.js          # no npm install needed
```

- **Host screen** (show this on the projector): `http://<your-address>/host`. It shows the QR code,
  live counts, the timer, teams, the leaderboard and the Tip Wall. **Reset** clears people, teams, scores,
  emails and tips but keeps the setup, meeting spots and branding.
- **Participant page** (the QR code links here): `http://<your-address>/`

Optional environment variables:
- `HOST_PIN`: when set, the reset button asks for this PIN.
- `PORT`: defaults to `3000`.

## Deploy on Render (free)

1. Sign in at [render.com](https://render.com) with GitHub.
2. Click **New → Blueprint** and pick this repo. Render reads `render.yaml` and sets everything up.
3. When asked for `HOST_PIN`, enter a PIN for the reset button (or leave it blank for no PIN).
4. Open `https://<your-app>.onrender.com/host` on the projector.

Notes on the free plan:
- It sleeps after about 15 minutes with no visitors, and the first visit after that takes about 30 seconds.
  Open the host screen a minute before the event. It refreshes every few seconds, which keeps the app awake.
- Without a database (below), restarting or redeploying clears everything. With one, nothing is lost.
  Either way, **every push to this branch redeploys**, so avoid pushing changes during an event.

## Keep data safe with a free database (Upstash)

Without this, the app keeps data in memory and Render wipes it on every restart. The host screen shows
**💾 Saved to database** when it's set up, or **⚠️ Temporary** when it isn't.

1. Sign up at [upstash.com](https://upstash.com) (free) and click **Create Database** (Redis). Any name,
   the region closest to your Render service, and the **Free** plan.
2. On the database page, find the **REST API** section and copy **UPSTASH_REDIS_REST_URL** and
   **UPSTASH_REDIS_REST_TOKEN**.
3. In Render, open the service → **Environment** → add both as environment variables with those exact names.
   Save; Render redeploys.
4. Open `/host` and check the top bar says **💾 Saved to database**.

What it does:
- Every change is saved within about a second, and the app saves before Render stops it.
- **Reset files the finished session under Past sessions** (bottom of the 📊 Live Data tab) instead of deleting
  it, with its headline numbers and a download button. Use this to compare pilot events.
- If the database can't be reached when the app starts, it retries and then stops rather than starting
  empty, so it never overwrites your saved data. Render restarts it automatically.

Running locally without a database, data is kept in a `data/` folder next to `server.js`.

## 💬 Team Discussion board

A second activity for workshops: an **empty board that only the teams fill in**. You give the topic out loud
(or on paper, e.g. the Build Wise sprint sheet); teams talk it through and post their points from their phones.

1. **Getting there:** once someone has a team, their phone shows a **💬 My team’s discussion board** button, so
   teams can open the board and post anytime. On the 💬 Discussion tab, **▶ Open the board** sends every phone to
   it at once (teams are formed first if needed). Each phone is sent once per opening, and **← Back to my game**
   always works.
2. **Teams post:** anyone on a team can post as many points as they like (and remove their own team's posts).
   Teammates see each other's posts on their phones.
3. **Big screen:** starts as "The board is empty", then fills with one colored column per team, newest notes
   on top, popping in as they arrive. Optional 5, 10 or 15 minute timer.
4. **Close it:** **⏹ Close the board** locks it (no new posts) and sends phones back to the game. Posts stay on the
   big screen, and **▶ Open the board** unlocks it again.
   **🧹 Clear the board** removes every post (download first if you want them).
5. **⬇️ Download posts:** a spreadsheet of every post with team, members, who posted and when (also for past
   sessions, via **💬 Board** under Past sessions).

## ↻ Same teams, a different day

For a series (e.g. Build Wise Session 1 and Session 2): under 🗂️ Past sessions (📊 Live Data tab), tap
**↻ Reuse teams** on the earlier session. The current session is filed first, then a new one starts with those
teams. People who scan again on the same phone go straight back to their team; on a new phone, typing the
same name gets their old spot back (when the name is unique). Newcomers join a team as usual.

## Pilot report

`/report` (or **📄 Pilot report** under Past sessions on the 📊 Live Data tab) builds a one-page summary for
organizers and investors from every saved event:

- Tick the events to include (untick test runs) and enter how many people were in the room for each, which
  gives the scan rate. Both are remembered.
- It shows a headline sentence, 8 key numbers (participants, scan rate, completion, tips, fun rating, want it
  again, feedback response, email opt-in), an event-by-event table, the best written feedback and tips.
- **🖨️ Print / Save as PDF** prints it on one Letter page.

Tip: set the event title on **🎨 Branding** before each event (e.g. "Edmonton Founders Mixer") so events are
easy to tell apart in the report.

## Branches

- `main` is what Render deploys. Keep it working.
- Build changes on a separate branch and merge them into `main` when they're tested.

## Use your own web address

The QR code always points to whatever address the host screen is opened on, so a custom domain needs no
code changes.

1. In Render, open the service → **Settings** → **Custom Domains** → **Add Custom Domain**, and enter e.g.
   `icebreaker.yourdomain.com`.
2. Render shows a **CNAME** record. At your domain provider (GoDaddy, Namecheap, Squarespace…), add a
   CNAME with name `icebreaker` pointing to the `onrender.com` address Render gives you.
3. Wait for Render to show **Verified** and **Certificate issued** (a few minutes to an hour).
4. Open `https://icebreaker.yourdomain.com/host` on the projector. The QR code uses the new address.

## Change the colors

Use **🎨 Branding** on the Setup tab. The defaults are the `--bg` and `--gold` values at the top of
`public/index.html` and `public/host.html`. Category colors and questions are in `server.js`.
