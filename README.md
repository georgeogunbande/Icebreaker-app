# Icebreaker App

Participants scan a QR code on their phone and get assigned to one of six categories
from the *Fun Tips You May Not Already Know* cards:

| # | Category | Group prompt |
|---|----------|--------------|
| 1 | Money | Share one practical money lesson. |
| 2 | Career | Share one skill or work lesson. |
| 3 | Relationships | Share one lesson about people. |
| 4 | Business | Share one lesson about creating value. |
| 5 | Faith | Share one lesson that strengthens faith. |
| 6 | Purpose | Share one lesson about direction. |

## How assignment works

Each new person goes to the category with the fewest people so far. When there's a tie,
they go to the earliest category in the list above. In practice people fill Money → Career → … → Purpose
and then wrap back to Money. Groups never differ by more than 1 person.

Example with 14 people: Money 3, Career 3, Relationships 2, Business 2, Faith 2, Purpose 2.

If someone scans twice on the same phone, they get the same category again, so they can't be counted twice.

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

## Deploy (so phones can reach it)

Phones need a public URL. The easiest way is to deploy this repo to a free Node host such as
[Render](https://render.com) (create a *Web Service*, set the start command to `node server.js`)
or Railway. Then open `https://<your-app>/host` and project it.
The QR code uses whatever address the host screen is opened on.
