import { readFileSync } from "node:fs";
import { clubMemory, demoReply } from "../lib/memories.js";
import { supportProfile, reassuranceFor } from "../public/support.js";
import { applyConversationProgress, inferFanSentiment } from "../public/conversation.js";

const dataset = JSON.parse(readFileSync(new URL("../public/clubs.json", import.meta.url), "utf8"));
const clubs = new Map(dataset.clubs.map((club) => [club.id, club]));
const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const string = { type: "string" };
const sourceSchema = { type: "array", items: { type: "object", properties: { title: string, url: string }, required: ["title", "url"], additionalProperties: false } };
const videoSchema = { type: "array", items: { type: "object", properties: { id: string, title: string, headline: string, recollection: string, channel: string, year: string }, required: ["id", "title", "headline", "recollection", "channel", "year"], additionalProperties: false } };
const memorySchema = { type: "object", properties: { title: string, text: string, year: string, query: string, sources: sourceSchema, videos: videoSchema }, required: ["title", "text", "year", "query", "sources", "videos"], additionalProperties: false };
const schema = { type: "object", properties: { message: string, checkIn: string, memory: memorySchema, sources: sourceSchema, videos: videoSchema, fanSentiment: { type: "string", enum: ["negative", "neutral", "positive"] } }, required: ["message", "checkIn", "memory", "sources", "videos", "fanSentiment"], additionalProperties: false };

function videoId(url) {
  try { const u = new URL(url); const host = u.hostname.replace(/^www\./, ""); if (host === "youtu.be") return u.pathname.split("/")[1]; if (host === "youtube.com") return u.searchParams.get("v") || (u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : ""); } catch {}
  return "";
}
function retrievedSources(result) {
  const sources = [];
  for (const item of result.output || []) {
    for (const source of item.action?.sources || []) if (source.url) sources.push(source);
    for (const part of item.content || []) for (const source of part.annotations || []) if (source.type === "url_citation" && source.url) sources.push(source);
  }
  return sources;
}
function sanitize(result, payload, club) {
  const sources = retrievedSources(result);
  const seed = clubMemory(club);
  const allowed = new Map([...sources, ...seed.sources].map((s) => [s.url, s]));
  const cleanSources = (list) => (Array.isArray(list) ? list : []).filter((s) => s && allowed.has(s.url) && /^https:\/\//.test(s.url)).map((s) => ({ title: String(s.title).slice(0, 160), url: s.url })).slice(0, 6);
  const validIds = new Set([...sources.map((s) => videoId(s.url)), ...seed.videos.map((v) => v.id)].filter((id) => /^[\w-]{11}$/.test(id)));
  const cleanVideos = (list) => (Array.isArray(list) ? list : []).filter((v) => v && validIds.has(v.id)).slice(0, 6).map((v) => ({ id: v.id, title: String(v.title).slice(0, 180), headline: String(v.headline || "").slice(0, 180), recollection: String(v.recollection || "").slice(0, 400), channel: String(v.channel || "YouTube").slice(0, 80), year: String(v.year || "").slice(0, 30) }));
  payload.sources = cleanSources(payload.sources);
  payload.videos = cleanVideos(payload.videos);
  payload.memory.sources = cleanSources(payload.memory.sources);
  payload.memory.videos = cleanVideos(payload.memory.videos);
  if (!payload.memory.sources.length) {
    payload.memory = { ...seed, title: seed.title, text: seed.text };
  }
  // Web facts are accompanied by links returned by the actual search tool, not invented URLs.
  if (!payload.sources.length && sources.length) payload.sources = cleanSources(sources);
  payload.demo = false;
  return payload;
}

async function generate(club, messages, action, signal, frustration = 45, turnCount = 1) {
  const seed = { ...clubMemory(club) };
  if (turnCount < 3) { seed.videos = []; seed.query = ""; }
  const profile = supportProfile(frustration);
  const stageInstructions = turnCount < 3
    ? "LISTENING STAGE: This is the fan's first or second message. Focus on listening, empathy and a grounded club perspective. Do not mention, suggest, research or link videos, YouTube, highlights, the Frustration Arena, a throwing game, eggs, tomatoes or lettuce. Set videos and memory.videos to empty arrays, and memory.query to an empty string."
    : turnCount < 5
    ? "MEMORIES STAGE: The fan has sent at least three messages. You may gently suggest nostalgic videos about their club. Do not mention or suggest the Frustration Arena, a throwing game or throwing food."
    : "LATER SUPPORT STAGE: Only if the fan's LATEST message is still negative may you gently mention the optional Frustration Arena. If the fan is calmer, positive or neutral, do not suggest or mention it. The application handles the invitation button. Videos may be offered from this stage too. Never pressure the fan to use either option.";
  const prompt = `You are the Fan Buddy at "The Third Half", a cosy football pub for fans of ${club.name} (${club.leagueName}). Today is ${new Date().toISOString().slice(0, 10)}. Write ALL user-facing content in English, including the message, memory title, memory text, source titles and video titles. Speak warmly and naturally, as a thoughtful fellow fan at the bar. No therapy jargon.
The fan has sent ${turnCount} user messages in this chat. Count only user messages, not your replies. ${stageInstructions}
Set fanSentiment to negative, neutral or positive based on the fan's latest message in its conversation context. This describes their CURRENT football frustration, not whether the club's situation is objectively bad. "I am not angry anymore" and "Thanks, I feel better" are positive, even with the fan-temperature slider at 100. "Thanks, but I am still furious" is negative. A high temperature alone never proves the latest message is negative.
The fan has set their frustration to ${profile.temperature}/100 (${profile.label}). This means their desired support is: ${profile.support}. SUPPORT INSTRUCTIONS: ${profile.tone}
The SAME slider also controls response creativity. Requested reply style: ${profile.replyStyle}. STYLE INSTRUCTIONS: ${profile.styleInstructions}
Creativity changes expression, not the truth: metaphors may be inventive, but names, transfers, results, prices, dates and sources must be verified. Do not invent a factual anecdote for the sake of originality. A higher sampling temperature adds variation; the explicit style and support instructions determine tone.
Higher frustration means MORE empathy and reassurance, NOT more hostile or inflammatory language. Validate feelings without endorsing unverified accusations, transfer fees or personal abuse. Criticism of sporting decisions is fine. Do not encourage harassment or violence. Do not imply that shouting or drinking is required. If a person explicitly describes immediate self-harm risk, prioritise immediate human support over football banter; the temperature slider alone is not evidence of that.
Use web_search to verify historical counterexamples and current football facts. Prefer official club, league, UEFA and DFB sources. Distinguish transfer fees from total costs and mark reported fees as reported. Never invent names, prices, dates or sources. Use two or three short paragraphs in message; at higher temperatures, four short paragraphs are fine if the extra space is used for support. A relevant, verified positive memory must be about this exact club. If you cannot verify one, ask a thoughtful question rather than inventing a story. Put factual source links in sources, displayed directly under your message. Only use URLs actually returned by web search or from the curated seed.
The memory is a short source-backed positive club story. Its title should be a warm "Remember when ...?" question about the verified player, season or moment. If you cannot find an appropriate verified memory, use this English seed exactly: ${JSON.stringify(seed)}.
${turnCount >= 3 ? `Find YouTube videos relevant to the player, match, transfer or era you mention. Use existing 11-character video IDs from actual retrieved YouTube URLs, preferably from official channels. If none are found, leave videos empty and give a precise English YouTube search phrase in memory.query. year describes the event, not its upload date.
For EVERY video, write a nostalgic headline and a short recollection in English, like one fan saying to another at the bar: "Remember when ...?" Name the verified player, season or moment rather than giving a generic highlight label. The recollection should gently recall what made it special in one or two sentences. Keep title as the descriptive video title. Do not claim the fan personally attended a match or watched it at the time. Never invent a trophy, performance or season for a nostalgic hook. At high frustration, offer the memory without insisting the fan feel better immediately.` : "Do not research or include videos during the listening stage."}
For EVERY chat reply, put exactly one short, natural emotional check-in question in checkIn. The app places it last, after the reassurance and any invitation. Tailor it to the fan's latest message AND what you have just said. Vary the wording from earlier assistant replies; never repeat an earlier check-in verbatim. Do not use the blunt "Are you still angry?" or a repetitive satisfaction survey. Examples of the intended tone: "Does that take the edge off, or is something still getting to you?" and "A little easier to carry now, or have I missed the part that really hurts?" Leave room for honest disagreement and never assume the fan now feels better or that the club's problem has been solved. If the fan says they feel better, give them room to pause rather than reopening their frustration. The check-in must respect the stage gates above; it must not introduce videos or the Arena early. Do not put any other questions in message; use statements there so the fan only gets one conversational question to answer. Do not include the check-in in message too.
The application adds a separate English closing to EVERY chat response: other clubs have difficult chapters too, without minimising this fan's feelings, and there are real reasons they support ${club.name}. Do not contradict or trivialise that reminder.
${action === "highlights" ? "The user is looking for videos. Focus on YouTube results for the selected club. Use web_search. Never turn a search-results URL into a video ID." : "Reply in this order: acknowledge the feeling, offer the amount of support requested, share a verified club memory if appropriate, and put one thoughtful emotional check-in in the separate checkIn field. You do not know current standings without checking."}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.4-mini", instructions: prompt, input: messages.map(({ role, content }) => ({ role, content })), tools: [{ type: "web_search", search_context_size: "medium" }], include: ["web_search_call.action.sources"], max_tool_calls: 4, reasoning: { effort: "none" }, temperature: profile.modelTemperature, max_output_tokens: 4000, text: { format: { type: "json_schema", name: "fan_support", strict: true, schema } }, store: false }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(50000)]),
  });
  const result = await response.json();
  if (!response.ok) {
    const code = result.error?.code;
    if (response.status === 400 && ["temperature", "reasoning", "reasoning.effort"].includes(result.error?.param)) {
      const error = new Error("The selected OpenAI model does not support this temperature configuration. Please check OPENAI_MODEL on the server.");
      error.status = 502; throw error;
    }
    const error = new Error(response.status === 401 ? "The OpenAI key is invalid. Please check it in Vercel." : response.status === 429 ? (code === "insufficient_quota" ? "The API credit or spending limit has been reached." : "There are too many requests right now. Please try again in a moment.") : [403, 404].includes(response.status) ? "This OpenAI project does not have access to the selected model or feature." : "Your Fan Buddy is not available right now. Please try again.");
    error.status = 502; throw error;
  }
  const parts = (result.output || []).flatMap((item) => item.content || []);
  const refusal = parts.find((part) => part.type === "refusal");
  if (refusal) return { message: refusal.refusal, memory: seed, sources: [], videos: [], demo: false, refused: true };
  if (result.status === "incomplete") throw new Error("The research did not finish. Please try a more specific question.");
  const text = parts.filter((part) => part.type === "output_text").map((part) => part.text).join("");
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error("The reply could not be read. Please try again."); }
  if (!payload.message || !payload.memory || !Array.isArray(payload.sources)) throw new Error("The reply was incomplete. Please try again.");
  return sanitize(result, payload, club);
}

export default {
  async fetch(request) {
    const url = new URL(request.url); const action = url.searchParams.get("action") || "status";
    if (request.method === "GET" && action === "status") return json({ ready: Boolean(process.env.OPENAI_API_KEY), demo: !process.env.OPENAI_API_KEY, clubs: clubs.size, updated: dataset.updated });
    if (request.method === "GET" && action === "memory") {
      const club = clubs.get(url.searchParams.get("clubId"));
      return club ? json({ memory: clubMemory(club) }) : json({ error: "Please choose a club first." }, 400);
    }
    if (request.method !== "POST" || !["chat", "highlights"].includes(action)) return json({ error: "This request is not supported." }, 405);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json({ error: "This request is not allowed." }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Invalid message format." }, 415);
    let body;
    try { const raw = await request.text(); if (raw.length > 45000) return json({ error: "This conversation is too long. Please start a new chat." }, 413); body = JSON.parse(raw); } catch { return json({ error: "The message could not be read." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid message format." }, 400);
    const club = clubs.get(String(body.clubId));
    if (!club) return json({ error: "Please choose a club first." }, 400);
    const frustration = body.frustration === undefined ? 45 : body.frustration;
    if (typeof frustration !== "number" || !Number.isFinite(frustration) || frustration < 0 || frustration > 100) return json({ error: "Fan temperature must be a number between 0 and 100." }, 400);
    const temperature = Math.round(frustration);
    const messages = action === "highlights" ? [{ role: "user", content: `Find matching YouTube highlights for ${club.name}: ${String(body.query || "best moments in club history").slice(0, 180)}` }] : body.messages;
    if (!Array.isArray(messages) || !messages.length || messages.length > 12 || messages.some((m) => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || !m.content.trim() || m.content.length > 5000) || messages.at(-1).role !== "user") return json({ error: "Please send a valid message." }, 400);
    const visibleUserTurns = messages.filter((message) => message.role === "user").length;
    const turnCount = body.turnCount === undefined ? visibleUserTurns : body.turnCount;
    if (!Number.isInteger(turnCount) || turnCount < visibleUserTurns || turnCount > 10000) return json({ error: "Invalid conversation progress. Please start a new chat." }, 400);
    if (action === "highlights" && turnCount < 3) return json({ error: "Let us talk first. Memories become available after your third message." }, 403);
    if (!process.env.OPENAI_API_KEY) {
      if (action === "highlights") { const memory = clubMemory(club); const query = String(body.query || "").toLowerCase(); const relevant = !query || [memory.title, memory.text, memory.query].some((text) => text.toLowerCase().includes(query)); return json({ videos: relevant ? memory.videos : [], memory, demo: true, query: body.query || memory.query }); }
      return json(applyConversationProgress({ ...demoReply(club, messages.at(-1).content, temperature), fanSentiment: inferFanSentiment(messages) }, messages, turnCount));
    }
    try {
      const result = await generate(club, messages, action, request.signal, temperature, turnCount);
      return json(applyConversationProgress({ ...result, closing: reassuranceFor(club, temperature), temperature, supportBand: supportProfile(temperature).label, replyStyle: supportProfile(temperature).replyStyle, modelTemperature: supportProfile(temperature).modelTemperature }, messages, turnCount));
    }
    catch (error) { return json({ error: error.name === "TimeoutError" ? "The research is taking too long. Please try a more specific question." : error.message || "The connection was interrupted." }, error.status || 502); }
  }
};
