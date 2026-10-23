import { createArena } from "/game.js";
import { supportProfile } from "/support.js";
import { createPubScene } from "/pub.js";
import { conversationProgress, inferFanSentiment, checkInFor } from "/conversation.js";

const $ = (selector) => document.querySelector(selector);
let data = null;
let selected = null;
let filter = null;
let pendingTab = "chat";
let history = [];
let activeRequest = null;
let highlightRequest = null;
let clubEpoch = 0;
let memory = null;
let mode = { demo: true };
let currentTab = "chat";
let conversationTurns = 0;
let videosUnlocked = false;
let arenaUnlocked = false;
let temperatureReview = "open";
const arena = createArena($("#arena"));
const heroPub = createPubScene($("#hero-pub"), "hero");
const fanPub = createPubScene($("#fan-pub"), "fan");
const storedTemperature = localStorageValue();
let frustration = storedTemperature === null ? 45 : supportProfile(Number(storedTemperature)).temperature;

function localStorageValue() { try { return localStorage.getItem("nachspielzeit.frustration"); } catch { return null; } }
function updateTemperature(value) {
  const profile = supportProfile(Number(value));
  frustration = profile.temperature;
  document.body.dataset.heat = profile.key;
  document.documentElement.style.setProperty("--heat-progress", `${frustration}%`);
  $("#frustration").value = frustration;
  $("#frustration").setAttribute("aria-valuetext", `${frustration} out of 100. ${profile.label}. ${profile.support}. ${profile.replyStyle} replies.`);
  $("#heat-value").value = `${frustration}°`;
  $("#heat-value").textContent = `${frustration}°`;
  $("#heat-label").textContent = profile.label;
  $("#support-level").textContent = profile.support;
  $("#reply-style").textContent = profile.replyStyle;
  $("#heat-helper").textContent = profile.description;
  updateTemperatureReviewCopy();
  heroPub.update({ temperature: frustration, club: selected });
  const fan = fanPub.update({ temperature: frustration, club: selected });
  $("#fan-expression").textContent = fan.mood;
  $("#support-level").closest(".support-indicator").dataset.level = Math.min(5, Math.floor(frustration / 20) + 1);
  storeSet("nachspielzeit.frustration", String(frustration));
  const title = $("#chat-welcome h2");
  title.replaceChildren(document.createTextNode(frustration >= 80 ? "Big feelings." : frustration >= 60 ? "A rough one?" : "One of those"), document.createElement("br"));
  const emphasis = document.createElement("em"); emphasis.textContent = frustration >= 80 ? "No judgement." : frustration >= 60 ? "We hear you." : "matchdays?"; title.append(emphasis);
}

function updateTemperatureReviewCopy() {
  $("#confirm-temperature").textContent = `Confirm ${frustration}° & keep chatting →`;
  $("#temperature-ready").textContent = `${frustration}° confirmed · You can reply now.`;
}
function setTemperatureReview(state) {
  temperatureReview = state;
  const required = state === "required";
  $("#temperature-panel").classList.toggle("needs-review", required);
  $("#chat-form").classList.toggle("needs-review", required);
  $("#temperature-review").hidden = !required;
  $("#chat-temperature-gate").hidden = !required;
  $("#temperature-ready").hidden = state !== "confirmed";
  $("#temperature-eyebrow").textContent = required ? "BEFORE YOUR NEXT MESSAGE" : state === "confirmed" ? "YOUR CURRENT TEMPERATURE" : "FIRST, HOW BAD IS IT?";
  if (state === "open") $("#chat-input").removeAttribute("aria-describedby");
  else $("#chat-input").setAttribute("aria-describedby", required ? "chat-temperature-help" : "temperature-ready");
  $("#frustration").setAttribute("aria-describedby", required ? "temperature-review-copy heat-helper heat-note" : "heat-helper heat-note");
  updateTemperatureReviewCopy();
  resizeInput();
}
function focusTemperatureReview() {
  $("#temperature-panel").scrollIntoView({ behavior: "instant", block: "center" });
  $("#frustration").focus({ preventScroll: true });
}

function toast(text) {
  $("#toast").textContent = text; $("#toast").hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { $("#toast").hidden = true; }, 2800);
}
function storeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function storeSet(key, value) { try { localStorage.setItem(key, value); } catch {} }
function safeUrl(value) { try { const u = new URL(value); return u.protocol === "https:" ? u.href : ""; } catch { return ""; } }
function sourceLink(source) {
  const a = document.createElement("a"); a.className = "source-link"; a.href = safeUrl(source.url); a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = `↗ ${source.title || new URL(a.href).hostname}`; return a;
}
function youtubeSearch(query) { return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`; }
function videoCard(video) {
  const article = document.createElement("article"); article.className = "video-card";
  const cover = document.createElement("button"); cover.className = "video-cover"; cover.type = "button"; cover.setAttribute("aria-label", `Play ${video.title}`);
  const image = document.createElement("img"); image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`; image.alt = video.title; image.loading = "lazy";
  const play = document.createElement("span"); play.className = "video-play"; play.textContent = "▶"; cover.append(image, play);
  cover.addEventListener("click", () => {
    const frame = document.createElement("iframe"); frame.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&hl=en`; frame.title = video.title; frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; frame.allowFullscreen = true; frame.referrerPolicy = "strict-origin-when-cross-origin";
    const player = document.createElement("div"); player.className = "video-cover"; player.append(frame); cover.replaceWith(player);
  });
  const text = document.createElement("div"); text.className = "video-copy";
  const title = document.createElement("strong"); title.textContent = video.headline || `Remember this moment with ${selected.short}?`;
  const recollection = document.createElement("p"); recollection.className = "video-recollection"; recollection.textContent = video.recollection || `Take a moment to revisit ${video.title}. What comes back to you when you watch it?`;
  const original = document.createElement("span"); original.className = "video-original-title"; original.textContent = video.title;
  const info = document.createElement("span"); info.textContent = [video.channel || "YouTube", video.year].filter(Boolean).join(" · ");
  const link = document.createElement("a"); link.href = `https://www.youtube.com/watch?v=${video.id}`; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Relive it on YouTube ↗";
  text.append(title, recollection, original, info, link); article.append(cover, text); return article;
}
function renderMemory(nextMemory) {
  if (!nextMemory || !selected) return;
  memory = nextMemory; const root = $("#memory-card"); root.replaceChildren();
  if (!videosUnlocked) return;
  const card = document.createElement("article"); card.className = "memory";
  const label = document.createElement("span"); label.className = "eyebrow"; label.textContent = "A LITTLE TRIP BACK";
  const title = document.createElement("h4"); title.textContent = memory.title;
  const year = document.createElement("span"); year.className = "memory-year"; year.textContent = memory.year;
  const text = document.createElement("p"); text.textContent = memory.text;
  card.append(label, title, year, text);
  (memory.sources || []).forEach((source) => { if (safeUrl(source.url)) card.append(sourceLink(source)); });
  const video = (memory.videos || []).find((v) => /^[\w-]{11}$/.test(v.id));
  if (video) card.append(videoCard(video));
  else {
    const link = document.createElement("a"); link.className = "youtube-fallback"; link.href = youtubeSearch(memory.query || `${selected.name} best moments`); link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "▶ Go back to those moments on YouTube ↗";
    const sub = document.createElement("span"); sub.textContent = "That player. That season. That feeling all over again."; link.append(sub); card.append(link);
  }
  root.append(card);
}
function renderHighlights(videos = []) {
  const grid = $("#highlight-grid"); grid.replaceChildren();
  if (!videosUnlocked) return;
  const unique = [...new Map(videos.filter((v) => /^[\w-]{11}$/.test(v.id)).map((v) => [v.id, v])).values()];
  if (unique.length) unique.forEach((video) => grid.append(videoCard(video)));
  else {
    const card = document.createElement("div"); card.className = "highlight-empty";
    const hasStory = Boolean(memory?.sources?.length);
    const title = document.createElement("strong"); title.textContent = hasStory ? memory.title : `Which ${selected.short} memory takes you straight back?`;
    const text = document.createElement("p"); text.textContent = hasStory ? `${memory.text} We do not have a playable clip here yet — take a trip back with the matching YouTube search.` : "A player you adored. A season you still talk about. We do not have a playable clip for this selection here yet, but the good memories are worth looking for.";
    const link = document.createElement("a"); link.className = "button dark"; link.href = $("#youtube-search").href; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Find that feeling on YouTube ↗";
    card.append(title, text); if (hasStory) memory.sources.forEach((source) => { if (safeUrl(source.url)) card.append(sourceLink(source)); }); card.append(link); grid.append(card);
  }
}
function showTab(tab) {
  if (!selected) { openClubs(tab); return; }
  if ((tab === "game" && !arenaUnlocked) || (tab === "highlights" && !videosUnlocked)) tab = "chat";
  currentTab = tab;
  document.querySelectorAll("[data-tab]").forEach((b) => { const active = b.dataset.tab === tab; b.classList.toggle("active", active); b.setAttribute("aria-current", active ? "page" : "false"); });
  for (const key of ["chat", "game", "highlights"]) $(`#panel-${key}`).hidden = key !== tab;
  arena.setVisible(tab === "game");
  // Hidden players must not continue playing sound when the user changes tabs.
  document.querySelectorAll(".tab-panel[hidden] iframe").forEach((frame) => {
    const id = frame.src.match(/embed\/([\w-]{11})/)?.[1];
    if (id) { frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&hl=en`; }
  });
}
function openClubs(tab = currentTab) {
  pendingTab = tab;
  if (!data) { toast("The club list is still loading."); return; }
  arena.setVisible(false);
  document.querySelectorAll("#dashboard iframe").forEach((frame) => { const id = frame.src.match(/embed\/([\w-]{11})/)?.[1]; if (id) frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&hl=en`; });
  $("#dashboard").hidden = true; $("#landing").hidden = false;
  $("#picker-cancel").hidden = !selected;
  showLeagues();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function showLeagues() {
  filter = null;
  $("#league-step").hidden = false; $("#club-step").hidden = true;
  $("#picker-eyebrow").textContent = "STEP 1 OF 2";
  $("#picker-title").textContent = "Which league is yours?";
  $("#picker-copy").textContent = "Pick your league first. Your club comes next.";
  $("#league-step-indicator").setAttribute("aria-current", "step"); $("#club-step-indicator").removeAttribute("aria-current");
  $("#club-search").value = ""; $("#club-grid").replaceChildren();
  $("#league-options button").focus();
}
function chooseLeague(league) {
  filter = league.id;
  $("#league-step").hidden = true; $("#club-step").hidden = false;
  $("#picker-eyebrow").textContent = "STEP 2 OF 2";
  $("#picker-title").textContent = "Who has your heart?";
  $("#picker-copy").textContent = `${league.name} · Choose your club and your seat is ready.`;
  $("#league-step-indicator").removeAttribute("aria-current"); $("#club-step-indicator").setAttribute("aria-current", "step");
  $("#club-search").value = ""; renderClubs(); $("#club-search").focus();
}
function renderClubs() {
  if (!filter) return;
  const query = $("#club-search").value.toLocaleLowerCase("en").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const matches = data.clubs.filter((club) => club.league === filter && `${club.name} ${club.short} ${club.abbr}`.toLocaleLowerCase("en").normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query));
  const grid = $("#club-grid"); grid.replaceChildren(); $("#club-result-count").textContent = `${matches.length} ${matches.length === 1 ? "club" : "clubs"} · Season ${data.season}`;
  for (const club of matches) {
    const button = document.createElement("button"); button.type = "button"; button.className = "club-choice"; button.setAttribute("aria-label", `Choose ${club.name}`);
    const img = document.createElement("img"); img.src = club.logo; img.alt = ""; img.loading = "lazy"; img.onerror = () => { img.hidden = true; };
    const name = document.createElement("strong"); name.textContent = club.name;
    const league = document.createElement("span"); league.textContent = club.leagueName;
    button.append(img, name, league);
    if (club.id === storeGet("nachspielzeit.club")) { const previous = document.createElement("small"); previous.className = "last-seat"; previous.textContent = "Your last seat"; button.append(previous); }
    button.addEventListener("click", () => selectClub(club)); grid.append(button);
  }
  if (!matches.length) { const p = document.createElement("p"); p.className = "dialog-copy"; p.textContent = "No matches. Try the club name or an abbreviation."; grid.append(p); }
}
function resetChat() {
  if (activeRequest) return;
  history = []; $("#chat-messages").replaceChildren(); $("#chat-welcome").hidden = false; $("#chat-error").hidden = true; $("#chat-input").value = ""; resizeInput();
  resetConversationProgress();
  if (selected) showTab("chat");
}
function resetConversationProgress() {
  conversationTurns = 0; videosUnlocked = false; arenaUnlocked = false; memory = null;
  setTemperatureReview("open");
  $("#tab-highlights").hidden = true; $("#memory-section").hidden = true; $("#listening-card").hidden = false;
  $("#conversation-stage").textContent = "First, let us talk.";
  $("#memory-card").replaceChildren(); $("#highlight-grid").replaceChildren(); $("#highlight-query").value = "";
  arena.reset();
}
function applyProgress(result, messages, turnCount) {
  const sentiment = result.fanSentiment || inferFanSentiment(messages);
  const progress = conversationProgress(turnCount, sentiment);
  const offerVideos = !videosUnlocked && progress.videosAvailable && !result.refused;
  const offerArena = !arenaUnlocked && progress.arenaAvailable && !result.refused;
  conversationTurns = turnCount;
  if (!result.refused) { videosUnlocked ||= progress.videosAvailable; arenaUnlocked ||= progress.arenaAvailable; }
  $("#tab-highlights").hidden = !videosUnlocked; $("#memory-section").hidden = !videosUnlocked; $("#listening-card").hidden = videosUnlocked;
  $("#conversation-stage").textContent = offerArena ? "A little room to let off steam." : videosUnlocked ? "There is room for the good memories, too." : "First, let us talk.";
  return { offerVideos, offerArena };
}
function addConversationInvitation(row, type) {
  const invite = document.createElement("div"); invite.className = "conversation-invitation";
  const title = document.createElement("strong");
  const copy = document.createElement("p");
  const button = document.createElement("button"); button.type = "button"; button.className = "button invitation-button";
  if (type === "game") {
    title.textContent = "A little room to let off steam.";
    copy.textContent = "Before you take it to social media, let your frustration out here. There is a little Frustration Arena out back, if you feel like it.";
    button.textContent = "Let off steam in the Frustration Arena ↗";
  } else {
    title.textContent = "A little trip back.";
    copy.textContent = `Sometimes it helps to remember what made you love ${selected.short}. Revisit a favourite player or season whenever you feel like it.`;
    button.textContent = "Remember the good days ↗";
  }
  button.addEventListener("click", () => showTab(type));
  invite.append(title, copy, button); row.querySelector(".msg-body").append(invite);
  $("#chat-scroll").scrollTop = $("#chat-scroll").scrollHeight;
}
async function selectClub(club) {
  if (club.league !== filter) return;
  clubEpoch++; const epoch = clubEpoch;
  activeRequest?.abort(); highlightRequest?.abort(); arena.reset();
  resetConversationProgress();
  selected = club; storeSet("nachspielzeit.club", club.id);
  updateTemperature(frustration);
  $("#landing").hidden = true; $("#dashboard").hidden = false;
  document.documentElement.style.setProperty("--club", club.color);
  $("#club-logo").src = club.logo; $("#club-logo").alt = `${club.name} crest`;
  $("#club-name").textContent = club.name;
  $("#club-league").textContent = `${club.leagueName.toUpperCase()} · YOUR CORNER`;
  $(".club-switch-label").textContent = club.short;
  $("#welcome-copy").textContent = `You are not alone in this. There is room for everything about ${club.name} that is getting to you. No comments-section war. Just a little perspective and some good memories.`;
  $("#stadium-name").textContent = club.stadiumVerified ? club.stadium : `${club.short} · Club arena`;
  $("#target-player").replaceChildren(...club.players.map((player) => { const option = document.createElement("option"); option.value = player.id; option.textContent = `${player.number ? player.number + " · " : ""}${player.name}`; return option; }));
  if (!club.players.length) { const option = document.createElement("option"); option.value = ""; option.textContent = "Your chosen player"; $("#target-player").append(option); }
  $("#target-name").value = ""; $("#target-role").value = "all";
  arena.setClub(club); arena.setTarget("all", club.players[0]?.name || "Player", "");
  $("#personal-best").textContent = storeGet(`nachspielzeit.best.${club.id}`) || "0";
  if (!activeRequest) resetChat();
  $("#highlight-query").value = "";
  $("#youtube-search").href = youtubeSearch(`${club.name} official highlights`);
  $("#highlight-status").textContent = "";
  memory = null; $("#memory-card").textContent = "Finding a little trip back …"; renderHighlights([]);
  showTab(pendingTab); window.scrollTo({ top: 0, behavior: "instant" });

}
function resizeInput() {
  const input = $("#chat-input");
  const locked = temperatureReview === "required";
  input.readOnly = locked || Boolean(activeRequest);
  input.setAttribute("aria-disabled", String(locked || Boolean(activeRequest)));
  input.placeholder = locked ? "Update your temperature to reply …" : "Go on, let it out. What is bothering you?";
  input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
  $("#chat-send").disabled = locked || !input.value.trim() || Boolean(activeRequest);
}
function appendMessage(role, text = "", sources = [], pending = false, closing = "", temperature = null) {
  const row = document.createElement("article"); row.className = `chat-message ${role}`;
  const avatar = document.createElement("div"); avatar.className = "msg-avatar"; avatar.textContent = role === "user" ? "YOU" : "✳"; avatar.setAttribute("aria-hidden", "true");
  const body = document.createElement("div"); body.className = "msg-body";
  const label = document.createElement("div"); label.className = "msg-label"; label.textContent = role === "user" ? "You" : temperature === null ? "Your Fan Buddy" : `Your Fan Buddy · ${temperature}°`; body.append(label);
  if (pending) { const dots = document.createElement("div"); dots.className = "typing"; dots.setAttribute("aria-label", "Your Fan Buddy is finding the right words"); for (let i = 0; i < 3; i++) dots.append(document.createElement("i")); body.append(dots); }
  else { const p = document.createElement("p"); p.className = "msg-text"; p.textContent = text; body.append(p); if (sources.length) { const list = document.createElement("div"); list.className = "msg-sources"; sources.forEach((s) => { if (safeUrl(s.url)) list.append(sourceLink(s)); }); body.append(list); } }
  if (closing && !pending) {
    const reminder = document.createElement("aside"); reminder.className = "fan-reassurance";
    const title = document.createElement("strong"); title.textContent = "A reminder before you go";
    const paragraph = document.createElement("p"); paragraph.textContent = closing;
    reminder.append(title, paragraph); body.append(reminder);
  }
  row.append(avatar, body); $("#chat-messages").append(row); $("#chat-scroll").scrollTop = $("#chat-scroll").scrollHeight; return row;
}
function appendCheckIn(row, question) {
  const checkIn = document.createElement("p"); checkIn.className = "fan-check-in"; checkIn.textContent = question;
  row.querySelector(".msg-body").append(checkIn);
  $("#chat-scroll").scrollTop = $("#chat-scroll").scrollHeight;
}
async function submitChat(event) {
  event.preventDefault();
  if (!selected || activeRequest) return;
  if (temperatureReview === "required") { $("#review-temperature").focus(); return; }
  const input = $("#chat-input"); const text = input.value.trim(); if (!text) return;
  const epoch = clubEpoch;
  const replyTemperature = frustration;
  const nextTurn = conversationTurns + 1;
  const next = [...history.slice(-10), { role: "user", content: text }];
  $("#chat-error").hidden = true; $("#chat-welcome").hidden = true;
  const sent = appendMessage("user", text); const pending = appendMessage("assistant", "", [], true);
  input.value = ""; input.readOnly = true; activeRequest = new AbortController(); $("#temperature-ready").hidden = true; $("#chat-send").hidden = true; $("#chat-stop").hidden = false; $("#reset-chat").disabled = true; resizeInput();
  try {
    const response = await fetch("/api/service?action=chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clubId: selected.id, messages: next, frustration: replyTemperature, turnCount: nextTurn }), signal: activeRequest.signal });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "The reply is not available right now.");
    if (epoch !== clubEpoch) return;
    if (typeof result.message !== "string") throw new Error("The reply was incomplete.");
    const invitations = applyProgress(result, next, nextTurn);
    pending.remove(); const reply = appendMessage("assistant", result.message, result.sources || [], false, result.closing || "", result.temperature ?? replyTemperature);
    if (invitations.offerVideos) addConversationInvitation(reply, "highlights");
    if (invitations.offerArena) addConversationInvitation(reply, "game");
    const checkIn = checkInFor({ messages: next, turnCount: nextTurn, sentiment: result.fanSentiment || inferFanSentiment(next), temperature: result.temperature ?? replyTemperature, suggested: result.checkIn, refused: result.refused });
    appendCheckIn(reply, checkIn);
    history = [...next, { role: "assistant", content: [result.message, result.closing, checkIn].filter(Boolean).join("\n\n") }];
    if (result.memory) renderMemory(result.memory);
    const videos = [...(result.videos || []), ...(result.memory?.videos || [])];
    $("#youtube-search").href = youtubeSearch(result.memory?.query || `${selected.name} ${text}`); $("#highlight-query").value = result.memory?.query || ""; renderHighlights(videos);
    $("#highlight-status").textContent = result.demo ? "Matched to the example reply. Open-ended AI research is not connected yet." : "Matching videos from your Fan Buddy’s research.";
    setTemperatureReview("required");
  } catch (error) {
    if (epoch !== clubEpoch) return;
    sent.remove(); pending.remove(); input.value = text;
    if (!history.length) $("#chat-welcome").hidden = false;
    if (error.name !== "AbortError") { $("#chat-error").textContent = error.message || "Connection interrupted. Please try again."; $("#chat-error").hidden = false; }
  } finally {
    activeRequest = null; $("#chat-send").hidden = false; $("#chat-stop").hidden = true; $("#reset-chat").disabled = false; $("#temperature-ready").hidden = temperatureReview !== "confirmed"; resizeInput();
    if (epoch !== clubEpoch) resetChat();
    else if (temperatureReview === "required") $("#review-temperature").focus({ preventScroll: true });
    else input.focus({ preventScroll: true });
  }
}
async function searchHighlights(event) {
  event.preventDefault(); if (!selected || !videosUnlocked || highlightRequest) return;
  const query = $("#highlight-query").value.trim() || memory?.query || `${selected.name} best moments`;
  const epoch = clubEpoch; $("#youtube-search").href = youtubeSearch(`${selected.name} ${query}`); $("#highlight-submit").disabled = true;
  $("#highlight-status").textContent = mode.demo ? "Checking matching example videos …" : "Your Fan Buddy is looking for matching videos. This may take a moment …";
  highlightRequest = new AbortController();
  try {
    const response = await fetch("/api/service?action=highlights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clubId: selected.id, query, frustration, turnCount: conversationTurns }), signal: highlightRequest.signal });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Video search is not available right now."); if (epoch !== clubEpoch) return;
    const videos = [...(result.videos || []), ...(!result.demo ? result.memory?.videos || [] : [])]; renderHighlights(videos);
    $("#highlight-status").textContent = result.demo ? "Preview with curated videos. For any other search, open the direct YouTube results." : "Matching YouTube videos. Availability and embedding depend on the original channel.";
  } catch (error) { if (epoch === clubEpoch && error.name !== "AbortError") $("#highlight-status").textContent = error.message; }
  finally { highlightRequest = null; $("#highlight-submit").disabled = false; }
}

$("#club-switch").addEventListener("click", () => openClubs(currentTab));
$("#change-league").addEventListener("click", showLeagues);
$("#picker-cancel").addEventListener("click", () => { if (!selected) return; $("#landing").hidden = true; $("#dashboard").hidden = false; showTab(currentTab); window.scrollTo({ top: 0, behavior: "instant" }); });
$("#club-search").addEventListener("input", renderClubs);
document.querySelectorAll("[data-entry]").forEach((b) => b.addEventListener("click", () => openClubs(b.dataset.entry)));
document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
$("#back-to-chat").addEventListener("click", () => showTab("chat"));
$("#reset-chat").addEventListener("click", resetChat); $("#chat-form").addEventListener("submit", submitChat); $("#chat-stop").addEventListener("click", () => activeRequest?.abort());
$("#chat-input").addEventListener("input", resizeInput); $("#chat-input").addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (temperatureReview === "required") $("#review-temperature").focus(); else if (!activeRequest && $("#chat-input").value.trim()) $("#chat-form").requestSubmit(); } });
$("#review-temperature").addEventListener("click", focusTemperatureReview);
$("#confirm-temperature").addEventListener("click", () => {
  if (temperatureReview !== "required" || activeRequest) return;
  setTemperatureReview("confirmed");
  $("#chat-form").scrollIntoView({ behavior: "instant", block: "center" });
  $("#chat-input").focus({ preventScroll: true });
});
const topics = { transfer: "How can we spend so much on a player who then barely delivers? This transfer is doing my head in.", coach: "I do not understand our manager anymore. These line-ups and substitutions are driving me mad.", results: "Another bad result. I cannot take these constant disappointments anymore.", player: "Why does a player keep starting when he is giving us so little on the pitch?" };
document.querySelectorAll("[data-topic]").forEach((b) => b.addEventListener("click", () => { if (temperatureReview === "required") { focusTemperatureReview(); return; } $("#chat-input").value = topics[b.dataset.topic]; resizeInput(); $("#chat-input").focus(); }));
$("#highlight-form").addEventListener("submit", searchHighlights);
document.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { if (arena.isRoundActive()) { toast("Change difficulty between rounds."); return; } document.querySelectorAll("[data-level]").forEach((x) => x.classList.toggle("selected", x === b)); arena.setLevel(Number(b.dataset.level)); }));
document.querySelectorAll("[data-ammo]").forEach((b) => b.addEventListener("click", () => { document.querySelectorAll("[data-ammo]").forEach((x) => x.classList.toggle("selected", x === b)); arena.setAmmo(b.dataset.ammo); }));
function updateTarget() { const name = selected?.players.find((p) => p.id === $("#target-player").value)?.name || "Player"; arena.setTarget($("#target-role").value, name, $("#target-name").value.trim()); }
$("#target-role").addEventListener("change", updateTarget); $("#target-player").addEventListener("change", updateTarget); $("#target-name").addEventListener("input", updateTarget);
$("#game-start").addEventListener("click", () => arena.start()); $("#game-pause").addEventListener("click", () => arena.pause());
$("#frustration").addEventListener("input", (event) => updateTemperature(event.target.value));
$(".wordmark").addEventListener("click", (event) => { event.preventDefault(); openClubs("chat"); });

async function init() {
  try {
    const [clubResponse, statusResponse] = await Promise.all([fetch("/clubs.json"), fetch("/api/service?action=status")]);
    if (!clubResponse.ok) throw new Error("Club list unavailable");
    data = await clubResponse.json();
    if (statusResponse.ok) mode = await statusResponse.json();
    $("#chat-status").textContent = mode.demo ? "Preview · prepared example replies" : "OpenAI connected · source-backed research";
    $("#demo-note").hidden = !mode.demo;
    for (const league of data.leagues) {
      const button = document.createElement("button"); button.type = "button"; button.className = "league-option"; button.setAttribute("aria-label", `Choose ${league.name}`);
      const country = document.createElement("span"); country.className = "league-country"; country.textContent = league.country;
      const name = document.createElement("strong"); name.textContent = league.name;
      const count = document.createElement("small"); count.textContent = `${data.clubs.filter((club) => club.league === league.id).length} clubs · choose yours ↗`;
      button.append(country, name, count); button.addEventListener("click", () => chooseLeague(league)); $("#league-options").append(button);
    }
    $("#selection-status").textContent = "";
    openClubs("chat");
  } catch { $("#selection-status").textContent = "We could not load the club list. Please refresh the page."; }
}
updateTemperature(frustration);
init();
