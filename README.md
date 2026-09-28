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

1. **Reveal:** a slot-machine shuffle lands on your category, with confetti and a buzz.
2. **Find your people:** "Find 3–6 other MONEY people in the room." Rules: shout your category,
   don't team up with the people beside you, and when a group reaches 6, close it and have the rest start
   another group in the same category. Tap **We found our group!** when you have a group.
3. **Fun question round (5 cards):** 3 "🧠 Did you know?" quiz questions (everyone taps an answer on
   their own phone and sees a fun fact) and 2 "🗣️ Group talk" questions everyone answers out loud.
   It ends with a score, so the group can compare who knew the most.
4. **Your group's missing piece:** each person shares one tip (2-minute timer on the phone), and the group
   picks the ONE tip the room needs to hear.
5. **Send to the big screen:** the phone asks "🎤 Who's sending your group's tip?" Only the person who taps
   **Me! I'll send it** gets the tip box. Everyone else sees "watch the big screen". The tip appears on the
   projector's **Tip Wall**.

Questions live in `server.js` under each category's `questions`. Edit or add your own there.

It works for any headcount (30, 70, 150 or 300 people) because groups are 3–6 people, not a fixed size.

## What happens on the projector (`/host`)

- **Join screen:** the QR code, live counts and names per category, pop-ups as people join, and a 2, 3 or 5 minute timer.
- **👥 Everyone:** every participant's name, in full, grouped by category. Handy for big crowds, where the
  join screen shortens long name lists.
- **🏆 Tip Wall:** every group's best tip in big cards. Switch to it for the finale.

## Host script

> "Everybody stand up. Scan the QR code. Your phone is going to give you a category. Somewhere in
> this room are people who match you. Find 3 to 6 people with the same symbol, and it can't be the
> people you're sitting beside. If your group hits six, close it and start another one. You have
> three minutes. GO!"

Start music and press **3 min**. When groups are formed:

> "Look at your phone. Your group has 5 questions to go through together. Go!"

Press **5 min**. When most groups are done:

> "Final challenge. Everyone knows something you don't. Pick ONE person in your group to be the sender. Each person shares one tip, and you have
> two minutes. Then pick the ONE tip the rest of the room needs to hear and send it to the big screen."

Press **2 min**. At the end, click **🏆 Tip Wall** and read a few out loud.

**Small crowd (under 18 people)?** Some categories will have fewer than 3 people. Tell people:
"If you can't find 3, join up with another small category."

## How assignment works

Each new person goes to the category with the fewest people so far. When there's a tie,
they go to the earliest category in the list above. In practice people fill Money → Career → … → Purpose
and then wrap back to Money. Categories never differ by more than 1 person.

Example with 14 people: Money 3, Career 3, Relationships 2, Business 2, Faith 2, Purpose 2.

If someone scans twice on the same phone, they get the same category again, so they can't be counted twice.

Each phone can send one tip; sending again replaces it.

## Run it

```bash
node server.js          # no npm install needed
```

- **Host screen** (show this on the projector): `http://<your-address>/host`. It shows the QR code,
  live counts, the timer and the Tip Wall, and has a reset button (it clears people and tips).
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
- Restarting or redeploying the app clears the participant list. That's fine for a single event, but
  don't redeploy in the middle of one.

## Change the colors

The brand colors are the `--bg` and `--gold` values at the top of `public/index.html` and
`public/host.html`. Category names, emojis, tip wording and colors are in `server.js`.
