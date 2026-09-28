# 🧩 Find Your People: QR Icebreaker

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
2. **Your team:** when the host taps **Form teams**, every phone buzzes and shows "PURPOSE · TEAM 2" plus
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

Questions live in `server.js` under each category's `questions`. Edit or add your own there.

## Teams

- Teams are formed when the host taps **🔒 Form teams**. Each category is split into the fewest teams of at
  most 6, as evenly as possible (7 people → 4 + 3, 13 → 5 + 4 + 4, 80 people overall → teams of 4–5).
- People who scan after that are added to the smallest team in their category (a new team starts when
  all are full).
- **🔀 Re-shuffle teams** re-forms everything and clears the Tip Wall.

## What happens on the projector (`/host`)

- **📱 Join screen:** the QR code, live counts and names per category, pop-ups as people join, a 2, 3 or
  5 minute timer, the **Form teams** button, and **📍 Meeting spots** (type "Left row", "Back row" and so on,
  then Save; phones update right away).
- **👥 Teams:** every team with its members and meeting spot, so anyone confused can find their name.
  It opens automatically when you tap Form teams.
- **🏆 Tip Wall:** every team's best tip in big cards. Switch to it for the finale.
- **📋 Participants:** a numbered list of everyone who has scanned, by category.

## Host script

Before people arrive, fill in the **📍 Meeting spots** and tap Save.

> "Everybody stand up. Scan the QR code. Your phone is going to give you a category and tell you
> where to go. Head there now!"

Once most people have scanned, tap **🔒 Form teams**. The Teams tab opens on the big screen.

> "Check your phone. You now have a team! Find your teammates. If you're not sure who's who, find
> your name on the screen. GO!"

Start music and press **3 min**. When teams are together:

> "Look at your phone. Your team has 5 questions to go through together. Go!"

Press **5 min**. When most teams are done:

> "Final challenge. Everyone knows something you don't. Pick ONE person on your team to be the sender.
> Each person shares one tip, and you have two minutes. Then pick the ONE tip the rest of the room needs
> to hear and send it to the big screen."

Press **2 min**. At the end, click **🏆 Tip Wall** and read a few out loud.

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
  live counts, the timer, teams and the Tip Wall. **Reset** clears people, teams and tips but keeps the meeting spots.
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
- Restarting or redeploying the app clears the participant list. **Every push to this branch redeploys**, so
  don't push changes on event day. That's fine for a single event, but
  don't redeploy in the middle of one.

## Change the colors

The brand colors are the `--bg` and `--gold` values at the top of `public/index.html` and
`public/host.html`. Category names, emojis, tip wording and colors are in `server.js`.
