# Icebreaker App

Participants scan a QR code on their phone, type their first name, and get assigned to one of six categories
from the *Fun Tips You May Not Already Know* cards:

| # | Category | Group prompt |
|---|----------|--------------|
| 1 | 💰 Money | Share one practical money lesson. |
| 2 | 💼 Career | Share one skill or work lesson. |
| 3 | ❤️ Relationships | Share one lesson about people. |
| 4 | 🚀 Business | Share one lesson about creating value. |
| 5 | 🙏 Faith | Share one lesson that strengthens faith. |
| 6 | 🧭 Purpose | Share one lesson about direction. |

## What makes it fun

- **Phone:** a slot-machine shuffle through the categories, then a pop, confetti and a buzz when your group is revealed.
- **Projector:** a pop-up each time someone joins ("🎉 Ada joined 💰 Money") and a 3, 5 or 10 minute discussion timer.
- **Emojis:** each category has one (💰 💼 ❤️ 🚀 🙏 🧭).

## How assignment works

Each new person goes to the category with the fewest people so far. When there's a tie,
they go to the earliest category in the list above. In practice people fill Money → Career → … → Purpose
and then wrap back to Money. Groups never differ by more than 1 person.

Example with 14 people: Money 3, Career 3, Relationships 2, Business 2, Faith 2, Purpose 2.

If someone scans twice on the same phone, they get the same category again, so they can't be counted twice.

Each phone shows the person's category, the group prompt, and the first names of everyone else in
that category, so people with the same category (for example, Money) can find each other. The host
screen lists names under each category.

## Run it

```bash
node server.js          # no npm install needed
```

- **Host screen** (show this on the projector): `http://<your-address>/host`. It shows the QR code and
  live counts, and has a reset button.
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
`public/host.html`. The category colors are in `server.js`.
