# foothills-narrator

Cloudflare Worker that fills the "I don't understand" dead-ends in the
Foothills MUD with brief atmospheric narration from Claude.

The browser posts `{command, room, inventory, recent, ...}` to `/narrate`
and gets back `{lines: ["short line 1", "short line 2"]}`. The model
runs under a strict system prompt — it can only *describe what the
player perceives*, never grant items, open exits, heal, or change world
state. If the Worker is offline, rate-limited, or returns an empty
response, the game falls through to its static dead-end messages.

## Deploy (first time)

```bash
cd workers/foothills-narrator
npm install

# Log in if you haven't
npx wrangler login

# Store your Anthropic key as a secret (prompts you to paste)
npx wrangler secret put ANTHROPIC_API_KEY

# Ship it
npm run deploy
```

After deploy, `wrangler` prints the worker URL — something like
`https://foothills-narrator.<your-subdomain>.workers.dev`. Copy it.

## Wire it into Foothills

Open [../../src/foothills/narrator/config.ts](../../src/foothills/narrator/config.ts)
and set `NARRATOR_URL` to `"https://foothills-narrator.<your-subdomain>.workers.dev/narrate"`.
Commit and deploy the portfolio — narration is now live.

Leave `NARRATOR_URL = ""` to disable the feature entirely; the game
reverts to its terse classic dead-end messages.

## Safety + budget

- **Origin check**: only requests from `adamrotmil.github.io` (and
  `localhost:3000` for dev) are honored. Everything else gets 403.
- **Daily call cap**: the Worker counts itself up to 350 calls/day
  before returning empty responses (game falls through). Combined with
  `max_tokens: 120`, this caps spend at roughly $5/month.
- **Anthropic usage cap**: set a hard monthly spend limit in the
  Anthropic console as a backstop. Recommended: $5/mo.
- **Prompt hardening**: the system prompt forbids the model from
  claiming outcomes that'd contradict the game state. Even if someone
  tries to prompt-inject through the `command` field, the model is
  instructed to describe perception, not grant results.

## Local dev

```bash
npm run dev        # runs at http://127.0.0.1:8787
```

Then set `NARRATOR_URL = "http://127.0.0.1:8787/narrate"` in
`src/foothills/narrator/config.ts` while developing. (Don't commit
that URL — it's only useful locally.)

## Tail logs

```bash
npm run tail
```

## Updating the system prompt or model

Edit [src/index.ts](src/index.ts), `npm run deploy`. No client changes
needed; the contract is stable.

## Shape of a request

```json
POST /narrate
{
  "command": "smell the hearth",
  "reason": "unknown-verb",
  "room": {
    "name": "Inside the Cottage",
    "description": "A warm, low-ceilinged room...",
    "exits": ["west", "down"],
    "items": ["loaf of bread", "stone hearth"],
    "occupants": [{"name": "the old woman", "kind": "npc"}]
  },
  "player": {"hp": 20, "max_hp": 20, "inventory": ["apple"]},
  "target": "hearth",
  "recent": ["You are in a cottage...", "The old woman is here."]
}
```

Response:

```json
{"lines": ["The hearth's warmth smells of bread and old wood. Something older lives under that — stone, waiting."]}
```
