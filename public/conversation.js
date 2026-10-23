// These stages count the fan's successfully answered messages, not both speakers.
export function classifyFanMessage(text = "") {
  const normalized = String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").toLowerCase();
  const clauses = normalized.split(/\b(?:but|however|yet|aber|trotzdem)\b/);
  const classify = (value) => {
    if (/\b(?:not|don't|do not)\s+(?:feel(?:ing)?\s+)?(?:any\s+)?(?:better|calmer|happy|okay|ok)\b|\b(?:nicht besser|nicht ruhiger|nicht glucklich|immer noch sauer)\b/.test(value)) return "negative";
    if (/\b(?:feel(?:ing)? (?:much |a little |a bit |so much )?better|(?:feel(?:ing)? |much |a little |a bit )?calmer|calmed down|less angry|cooled (?:down|off)|(?:not|no longer) (?:so |that |as )?(?:angry|upset|frustrated|mad|furious|disappointed|annoyed)|(?:that|this|you) (?:has |have )?helped|all good|i'm okay|i am okay|nicht mehr (?:sauer|wutend|frustriert)|mir geht(?:'s| es)? (?:wieder |viel |etwas )?besser|geht (?:es )?mir (?:wieder )?besser|(?:bin|jetzt|viel) ruhiger)\b/.test(value)) return "positive";
    if (/\b(?:angry|furious|frustrat\w*|disappoint\w*|fed up|annoy\w*|fuming|livid|awful|terrible|rubbish|hate|bad|useless|waste\w*|pathetic|hopeless|exhaust\w*|upset|miserable|sad|unhappy|ridiculous|unbelievable|barely deliver\w*|still hurts|can't take|cannot take|sauer|wutend|schlecht\w*|enttausch\w*|nerv\w*|furchtbar|schrecklich|scheiss\w*|beschissen|katastroph\w*|verzweifel\w*)\b/.test(value)) return "negative";
    if (/\b(?:thanks|thank you|great|happy|hopeful|love this|danke|super|zuversichtlich)\b/.test(value)) return "positive";
    return "neutral";
  };
  if (clauses.length > 1) {
    const last = classify(clauses.at(-1));
    if (last !== "neutral") return last;
  }
  return classify(normalized);
}

export function inferFanSentiment(messages = []) {
  let sentiment = "neutral";
  for (const message of messages.filter((message) => message.role === "user")) {
    const text = message.content.trim();
    if (/^(?:yes|yeah|yep|exactly|same|still|ja|genau|immer noch)[.!\s]*$/i.test(text)) continue;
    sentiment = classifyFanMessage(text);
  }
  return sentiment;
}

export function conversationProgress(turnCount, sentiment = "neutral") {
  const count = Math.max(0, Math.trunc(Number(turnCount) || 0));
  const fanSentiment = ["negative", "neutral", "positive"].includes(sentiment) ? sentiment : "neutral";
  const videosAvailable = count >= 3;
  const arenaAvailable = count >= 5 && fanSentiment === "negative";
  return { turnCount: count, sentiment: fanSentiment, videosAvailable, arenaAvailable, stage: arenaAvailable ? "release" : videosAvailable ? "remember" : "listen" };
}

export function checkInFor({ messages = [], turnCount = 1, sentiment = "neutral", temperature = 45, suggested = "", refused = false } = {}) {
  const previous = messages.filter((message) => message.role === "assistant").map((message) => message.content.toLowerCase().replace(/\s+/g, " "));
  const used = (question) => previous.some((message) => message.includes(question.toLowerCase().replace(/\s+/g, " ")));
  const candidate = typeof suggested === "string" ? suggested.trim() : "";
  const prematureMedia = turnCount < 3 && /\b(?:youtube|videos?|highlights?)\b/i.test(candidate);
  const prematureArena = (turnCount < 5 || sentiment !== "negative") && /\b(?:arena|throwing|eggs|tomatoes|lettuce)\b/i.test(candidate);
  if (candidate.length >= 20 && candidate.length <= 240 && candidate.endsWith("?") && (candidate.match(/\?/g) || []).length === 1 && !/^are you (?:still )?(?:angry|mad|upset|furious)\?$/i.test(candidate) && !prematureMedia && !prematureArena && !used(candidate)) return candidate;
  const general = [
    "Has that taken a little of the edge off, or is something still sitting heavily with you?",
    "Does it feel a little easier to sit with now, or have I missed what is really getting to you?",
    "Have we made a bit of breathing room, or would it help to unpack another part of it?",
    "Has talking it through shifted anything, or does it still feel just as frustrating?",
    "Does that put things in a different light, or does the same part still sting?",
    "Is this feeling a little more manageable, or should we stay with it a while longer?"
  ];
  const positive = [
    "How is it sitting with you now?",
    "Would you rather leave it there for now, or is there one loose end you want to talk through?",
    "Is this a good moment to put the football feed down, or is there something else you want off your chest?",
    "Do you feel ready to get on with your day, or would a little more company help?",
    "What would help you hold on to that bit of breathing room?",
    "Would you like to keep talking, or does this feel like a good place to pause?"
  ];
  const gentle = [
    "Is there a little more room to breathe, or should we slow down and stay with what is hurting?",
    "Would you like me to keep listening, or try a different way of looking at it?",
    "Have we found a little steadier ground, or do you need more room to get it out?"
  ];
  const latest = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() || "";
  let topic = [];
  if (/arena|throwing|eggs|tomatoes|lettuce|eier|tomaten/.test(latest) && turnCount >= 5) topic = ["Has that change of pace taken a little of the pressure off, or is something still bothering you?", "Does it feel a bit lighter after the break, or would talking a little more help?"];
  else if (/video|highlight|memory|memories|erinnerung/.test(latest)) topic = ["Does that memory bring a little breathing room, or does today still feel just as heavy?", "Has looking back given you anything comforting to hold on to, or are you still stuck on today?"];
  else if (/transfer|million|spend|fee|signing|ablose/.test(latest)) topic = ["Does that give you a little perspective on the transfer, or is there a part that still feels hard to accept?", "Does the spending feel a little less overwhelming now, or is it still the part that stings?"];
  else if (/coach|manager|tactic|line.?up|trainer/.test(latest)) topic = ["Does it feel any easier to step back from those decisions, or is the same choice still bothering you?", "Have those decisions lost a bit of their sting, or is there one you still cannot get past?"];
  else if (/result|defeat|loss|lost|ergebnis|niederlage/.test(latest)) topic = ["Does this result feel a little less all-consuming now, or is there a moment you are still replaying?", "Have we found a little distance from that result, or is the disappointment still just as sharp?"];
  else if (/player|performance|spieler|leistung/.test(latest)) topic = ["Does it feel easier to separate this performance from the player, or is one moment still getting to you?", "Has that performance become a little easier to put behind you, or is one moment still sticking?"];
  const pool = refused ? ["What would feel most helpful for you right now?", ...gentle, ...general] : sentiment === "positive" ? positive : [...topic, ...(temperature >= 60 ? gentle : []), ...general];
  const offset = Math.max(0, turnCount - 1) % pool.length;
  const ordered = [...pool.slice(offset), ...pool.slice(0, offset)];
  return ordered.find((question) => !used(question)) || ordered[0];
}

export function applyConversationProgress(payload, messages, turnCount) {
  const sentiment = ["negative", "neutral", "positive"].includes(payload.fanSentiment) ? payload.fanSentiment : inferFanSentiment(messages);
  const progress = conversationProgress(turnCount, sentiment);
  if (payload.refused) { progress.arenaAvailable = false; progress.videosAvailable = false; progress.stage = "listen"; }
  const result = { ...payload, fanSentiment: sentiment, progress, memory: payload.memory ? { ...payload.memory } : null };
  result.checkIn = checkInFor({ messages, turnCount, sentiment, temperature: payload.temperature, suggested: payload.checkIn, refused: payload.refused });
  if (typeof payload.checkIn === "string" && payload.checkIn.trim() && result.message?.trimEnd().endsWith(payload.checkIn.trim())) result.message = result.message.trimEnd().slice(0, -payload.checkIn.trim().length).trimEnd();
  if (!progress.videosAvailable) {
    result.videos = [];
    if (result.memory) { result.memory.videos = []; result.memory.query = ""; }
    const isVideoSource = (source) => { try { return /(^|\.)(?:youtube\.com|youtu\.be)$/.test(new URL(source.url).hostname); } catch { return false; } };
    result.sources = (result.sources || []).filter((source) => !isVideoSource(source));
    if (result.memory) result.memory.sources = (result.memory.sources || []).filter((source) => !isVideoSource(source));
  }
  return result;
}
