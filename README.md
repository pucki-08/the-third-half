# The Third Half — your matchday local

A cosy digital football pub for the rough matchdays: a Fan Buddy, a frustration arena and the good memories that made you a supporter. All interface text, prepared replies and live-AI instructions are in English. Club and player names remain proper names; original YouTube videos retain their original content.

## What is new

- Vercel startup fix: the API folder has an explicit ES-module package setting, and club data is imported as JSON instead of reading a file through `import.meta.url`. This avoids the reported CommonJS build crash. Plain-text and HTML deployment errors now produce readable chat messages with the HTTP status and known Vercel error code. A configured API key is labelled as configured; a successful live reply confirms connection.
- After every completed Fan Buddy reply, the chat input and send action are locked until a fresh temperature check. A clear two-step notice above the composer leads back to the highlighted slider. Move the slider and confirm the displayed value, or explicitly confirm the same value if your feelings have not changed. Confirmation returns focus to the unlocked composer. Each next reply requires a new check; failed or stopped requests do not consume it. New chat and changing clubs reset the check.
- Every Fan Buddy reply ends with one short emotional check-in, phrased naturally and varied against recent conversation history. Live AI writes the question using the current reply and the fan's latest message. Preview mode uses a topic- and sentiment-aware fallback; repeated, empty or malformed model questions fall back too. The question comes after reassurance and any optional activity invitation, and is included in the conversation history so the next response can use the fan's answer.
- The check-in does not assume that the fan feels better or that a club problem has been solved. Positive feedback gives the fan room to pause. Other follow-up questions are removed from prepared reply text and invitation copy to keep the conversation focused on a single question.

- The app is called **The Third Half**, the English name for “3. Halbzeit”. The website title, wordmark, pub sign, footer and Fan Buddy identity use this name.
- Support now follows the conversation. Messages 1–2 are for listening; videos and the “Remember when?” area first appear after the third successfully answered fan message. The Frustration Arena has no normal navigation entry. It is offered through a chat invitation only from the fifth fan message onwards when that message is still negative. A positive or neutral fifth message does not trigger it, even at 100°.
- An activity invitation is optional: it does not interrupt the chat or open a video/game automatically. Starting a new chat, changing clubs or refreshing resets the conversation stages. Once an invitation appears, it stays usable in that chat.
- The live model classifies the latest fan message in context as negative, neutral or positive. Preview mode uses a lightweight English/German phrase heuristic, which can miss sarcasm and ambiguous wording. The temperature slider controls requested support and creativity; it is not used as proof of negative sentiment.
- The browser sends a separate successful-message count so progression continues beyond the short model context. The server validates that count, applies the media gate, and restricts direct highlight research before turn 3.

- The first screen is always **Choose league → Choose club → Enter the pub**. Only clubs in the selected league are shown. Going back lets you change the league; a saved club is marked “Your last seat” but never skips the selection. Switching clubs uses the same flow.
- “Remember when?” videos lead with a warm question about the player, season or moment, followed by a short recollection. Descriptive video titles and channel details remain visible below. Live research returns these nostalgic captions too, while keeping the existing source and video-ID checks.

- A pub design with wood, warm brass, brick walls, a counter and a welcoming Fan Buddy.
- A fan avatar sitting at the bar in your selected club's colours and crest. The fan represents YOU; the person behind the counter is your Fan Buddy.
- A native, keyboard-accessible **Fan temperature** slider from 0 to 100. The fan's eyebrows, mouth, face colour and steam change with frustration. The room's colours warm up too.
- Five support bands: 0–19 Keeping it together; 20–39 Getting frustrated; 40–59 Properly heated; 60–79 At boiling point; 80–100 Full matchday meltdown.
- One slider controls both frustration and creativity. Low values request direct, measured replies; higher values add expressive language, fresh football metaphors and gentle humour, together with more empathy, validation and reassurance. The Fan Buddy stays kind. Factual claims must still be verified.
- Every successful chat reply ends with a club-specific reassurance: supporters of other clubs have rough chapters too, your feelings still count, and there are reasons you love your club.
- The selected temperature is sent to the server with each message, validated, and applied to both prepared replies and live-AI instructions. The panel shows the current reply style: Straightforward, Conversational, Expressive, Creative or Most creative. Each response shows its fan temperature. Changing the slider applies to the next reply; it does not rewrite earlier messages or trigger another paid request.
- Your last club, fan temperature and per-club game records are remembered in this browser. The conversation itself is not persisted.

## Try it locally

Node.js 22 or newer is required. There are no npm dependencies to install.

```sh
npm run dev
```

Open http://127.0.0.1:3000, choose your league, then your club, and move the Fan temperature slider. Use Home/End or arrow keys on the focused slider to compare the calm and furious expressions. Try the same message at 0 and 100 to compare support and phrasing. After each reply, use “Update my temperature”, adjust the slider if needed and confirm the displayed value before sending another message. Send three messages to see the first video invitation; send five and remain frustrated to get the optional Arena invitation. Try “Thanks, I feel better now” as message 5 to verify that no Arena invitation appears. Preview mode uses prepared examples of each style; live generation uses the configured sampling temperature.

Without an API key the site explicitly shows **Preview · prepared example replies**. The pub, avatar, slider, game, curated memories, prepared temperature-aware replies and saved YouTube clips all work. Open-ended AI research is implemented but still requires a server API key and live verification.

For local live-AI use, create an ignored `.env` file containing `OPENAI_API_KEY=...`, then run:

```sh
node --env-file=.env server.mjs
```

Do not put a real key in public files or upload it to GitHub.

## Clubs, chat, game and highlights

- 114 clubs from the Premier League, Bundesliga, La Liga, Serie A, Ligue 1 and Germany's 2. Bundesliga. Team lists and 3,407 squad names are a snapshot dated 23 October 2026, for 2026/27, not a live data subscription.
- Club-filtered chat with prompts about transfers, managers, performances and results. Historical examples come with visible source links. Six clubs have curated memories; other clubs do not get invented anecdotes in preview mode.
- Live mode uses the OpenAI Responses API, web search and structured outputs. Source URLs and video IDs are checked against actual retrieved sources or the curated list.
- A 30-second throwing game with three difficulties: Sunday League, Bundesliga and Champions League. Higher levels have smaller, faster targets; the highest level adds wind.
- Eggs, tomatoes and lettuce have different impact areas and scoring. The game has combos, pause, accuracy and per-club records.
- In Player mode, each round uses your selected starting player and two different squad members, drawn without replacement. Each board has its own name and squad number; the optional custom name applies to the first player only. Short rosters use the available distinct players instead of duplicates.
- Targets include a stadium, coach, management and squad players, represented as illustrated cardboard cut-outs. Names can be added to the cardboard. Current coach and director names are not inferred from unreliable data. Stadium scenes are stylised, not exact architectural replicas.
- Click-to-load YouTube players, with a direct YouTube link on each card. Some channels restrict regional playback or embedding. Every club also has matching YouTube search links; live AI can research individual clips for a player, match or era.

## Upload to GitHub and deploy to Vercel

This is a standalone HTML/CSS/JavaScript website with a Vercel Function. Do not mix it with the earlier generic Next.js starter.

1. Download and unzip `the-third-half.zip` (the updated legacy ZIP files contain the same project).
2. Create a private repository at https://github.com/new, for example `the-third-half`. A README is optional.
3. Choose **Add file → Upload files**, or **uploading an existing file** in an empty repository.
4. Upload the CONTENTS of the extracted project folder: `public`, `api`, `lib`, `package.json`, `vercel.json`, `server.mjs`, `README.md`. Upload directories with their contents, not the ZIP and not the enclosing project directory. The hidden `.gitignore` and empty `.env.example` may be uploaded too.
5. Commit. At the repository root you should immediately see `package.json`, `vercel.json`, `public`, `api` and `lib`.
6. Open https://vercel.com/new, sign in with GitHub and import this repository.
7. Use framework preset **Other** and the root directory. `vercel.json` sets the output directory to `public` and disables a build step.
8. Under Environment Variables, add **OPENAI_API_KEY** with your secret key as the value, without quotation marks, for Production. Then deploy.
9. If you add or change the key later under Settings → Environment Variables, use Deployments → latest deployment → … → Redeploy.

Optional server setting: `OPENAI_MODEL`, default `gpt-5.4-mini`. The 0–100 fan slider maps continuously to API `temperature` values from 0.2 to 1.1, alongside explicit support and style instructions. Requests use `reasoning.effort: "none"`, with no `top_p` override. Any replacement model must support Responses, web search, structured outputs, custom sampling temperature and this reasoning setting; incompatible models require an explicit configuration change. Sampling controls variation, not empathy or factual accuracy. Actual output quality and model compatibility still need a live check with your key.

API usage, including web search, has costs separate from a ChatGPT subscription. This personal prototype does not yet include accounts or durable per-user request limits; add those before broad public sharing and configure your project's spending controls.

## Files

```text
public/index.html   Pages, pub layout, temperature control and English labels
public/styles.css   Pub theme, heat-based colour palettes and responsive layout
public/pub.js       Original SVG pub scene and expressive fan avatar
public/support.js   Support, creativity, sampling mapping and reassurance endings
public/conversation.js  Shared turn gates and preview sentiment handling
public/app.js       Club selection, slider state, chat, tabs and videos
public/http.js      Safe JSON/error handling for hosting and service responses
public/game.js      Canvas throwing game
public/clubs.json   Public club and squad snapshot
api/service.js      Vercel backend: status, memories, chat, highlight research
api/package.json    Explicit ES-module format for the API entry point
lib/memories.js     Curated historical examples and temperature-aware preview replies
server.mjs          Local preview server
vercel.json         Vercel configuration and browser headers
```

## Verification and limits

Deployment-error regression checks cover the reported plain-text `FUNCTION_INVOCATION_FAILED` response, timeouts, access/rate errors, HTML/empty/invalid response bodies, preservation of structured API errors, API startup and an upstream non-JSON error. Local browser chat still replies and requires the next temperature check. The Vercel startup correction must be uploaded and redeployed before the hosted site can be rechecked.

Browser checks of the temperature check confirmed the locked input/send action after successive replies, the slider shortcut and focus, confirmation without changing the value, a changed value appearing on the next reply, the third-message video invitation, a clean New chat reset and a 390-pixel layout without horizontal overflow. Checked locally: JavaScript syntax, six temperature values and all five bands, API validation, low/high support differences, English prompts, sampling mapping, style instructions, guaranteed endings, source and video filtering, club gating and nostalgic video metadata, plus browser checks of avatar changes and real slider-to-chat behaviour. Browser checks confirmed different coach-related check-ins, one question per reply, the check-in as the last reply element after the turn-3 invitation, and an appropriate pause-oriented question after positive feedback. Varied final check-ins were tested through nine replies, including duplicate/malformed question fallbacks, positive feedback and preserving the activity gates. Conversation progression was tested through turn 9, including positive/neutral fifth messages, temperature-independent sentiment, direct highlight gating and refusing premature media suggestions. The league-first entry was checked on reload with a stored club, including league-scoped search, changing league, cancelling a club change and the 390-pixel mobile layout. Nostalgic video cards and the source-backed YouTube-search fallback were checked in the browser. The browser checks also confirmed: no media in messages 1–2, the first video invitation at message 3, no Arena at message 4, an Arena invitation at a negative message 5, a working invitation-to-game transition, no Arena for a positive fifth message at 100°, and full reset with New chat. The 390-pixel wordmark fits without horizontal overflow. Player selection was checked across all 114 club squads and 1,140 draws for distinct IDs/names, original shirt numbers and inclusion of the chosen player. Custom labels, short squads and duplicate data were covered too. The browser confirmed three different names and shirt numbers during a real round. The earlier game checks cover scoring, timer, records and pause. No paid OpenAI request was made. Actual live-AI output and Vercel deployment remain unverified until a key is configured.

The API uses `store: false`; this is not a promise that all safety logging or data processing is disabled. Changing clubs, clicking New chat or refreshing the page clears the conversation.

## Sources

- Club and squad data: public ESPN team and roster endpoints, e.g. https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/teams?limit=100
- Bundesliga: https://www.bundesliga.com/de/bundesliga/clubs
- 2. Bundesliga: https://www.bundesliga.com/de/2bundesliga/clubs
- Historical examples: links in `lib/memories.js`, also shown in the interface.
- OpenAI sampling temperature: https://developers.openai.com/api/reference/python/resources/responses/methods/create
- OpenAI parameter compatibility: https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.4
- OpenAI web search: https://developers.openai.com/api/docs/guides/tools-web-search
- OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Vercel Node.js Functions: https://vercel.com/docs/functions/runtimes/node-js
- Vercel environment variables: https://vercel.com/docs/environment-variables

Independent fan project. Club names, crests and YouTube content belong to their respective rights holders. This is not an official club service.
