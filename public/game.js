export function pickPlayerTargets(roster = [], preferredName = "", customName = "", count = 3, random = Math.random) {
  const key = (name) => String(name || "").trim().normalize("NFKC").toLocaleLowerCase("en");
  const names = new Set(); const ids = new Set();
  const squad = roster.filter((entry) => {
    const name = key(entry.name); const id = String(entry.id || "");
    if (!name || names.has(name) || (id && ids.has(id))) return false;
    names.add(name); if (id) ids.add(id); return true;
  });
  const preferred = squad.find((entry) => key(entry.name) === key(preferredName)) || squad[0];
  const custom = String(customName || "").trim();
  const first = custom ? squad.find((entry) => key(entry.name) === key(custom)) || { ...preferred, name: custom, number: preferred?.number || "" } : preferred;
  if (!first || count < 1) return [];
  const rest = squad.filter((entry) => key(entry.name) !== key(first.name) && (!first.id || String(entry.id) !== String(first.id)));
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  return [first, ...rest].slice(0, count);
}

export function createArena(canvas) {
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const configs = { 1: { speed: 0.6, scale: 1.15, wind: 0 }, 2: { speed: 1.2, scale: 0.9, wind: 0 }, 3: { speed: 1.9, scale: 0.68, wind: 24 } };
  const ammoConfig = { egg: { icon: "🥚", radius: 12, points: 100, color: "#f7d251" }, tomato: { icon: "🍅", radius: 25, points: 80, color: "#f26c49" }, lettuce: { icon: "🥬", radius: 43, points: 60, color: "#abd86b" } };
  let club = { id: "", name: "Your club", abbr: "FAN", color: "#d6ff4f", players: [] };
  let level = 1; let ammo = "egg"; let targetRole = "all"; let player = "Player"; let customName = "";
  let visible = false; let running = false; let paused = false; let raf = 0;
  let score = 0; let streak = 0; let hits = 0; let throws = 0; let remaining = 30; let elapsed = 0; let lastFrame = 0; let lastThrow = -1000;
  let targets = []; let flights = []; let splats = []; let particles = [];
  let aim = { x: 500, y: 320 }; let pointerIn = false; let feedbackUntil = 0;

  function createTargets() {
    const players = pickPlayerTargets(club.players, player, customName, targetRole === "player" ? 3 : 1);
    const roles = targetRole === "all" ? ["coach", "manager", "player", "stadium"] : targetRole === "player" ? players.map(() => "player") : [targetRole, targetRole, targetRole];
    let playerIndex = 0;
    targets = roles.map((role, i) => ({ role, player: role === "player" ? players[playerIndex++] : null, base: roles.length === 1 ? 500 : 125 + i * (750 / Math.max(1, roles.length - 1)), x: 0, y: 0, phase: i * 1.8 + 0.4, hit: 0, index: i }));
    const lineup = $("arena-lineup");
    lineup.hidden = targetRole !== "player";
    lineup.textContent = targetRole === "player" ? `On the pitch: ${players.map((entry) => entry.name).join(" · ")}` : "";
    canvas.setAttribute("aria-label", `Throwing game. ${targetRole === "player" ? lineup.textContent + ". " : ""}Aim with your mouse or finger and click to throw. Use arrow keys to aim and Space to throw.`);
    updateTargets();
  }
  function updateTargets() {
    const config = configs[level];
    for (const t of targets) {
      t.x = t.base + Math.sin(elapsed * config.speed * 2 + t.phase) * (level === 1 ? 24 : 48);
      t.y = 305 + Math.cos(elapsed * config.speed * 1.4 + t.phase) * (level === 3 ? 35 : 13) + (t.index % 2) * 40;
    }
  }
  function labelFor(target) {
    const role = target.role;
    if (role === "player") return target.player?.name || customName || player;
    if (role === "coach") return customName || "COACH";
    if (role === "manager") return customName || "MANAGEMENT";
    return club.stadiumVerified ? club.stadium : `${club.short || club.name} Arena`;
  }
  function rounded(x, y, w, h, radius, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill(); }
  function drawStadium() {
    const sky = ctx.createLinearGradient(0, 0, 0, 600); sky.addColorStop(0, "#16382d"); sky.addColorStop(0.53, "#355943"); sky.addColorStop(1, "#60813d"); ctx.fillStyle = sky; ctx.fillRect(0, 0, 1000, 600);
    ctx.fillStyle = "#f3f5c3"; ctx.globalAlpha = 0.06; ctx.beginPath(); ctx.arc(820, 78, 47, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    // Grandstand, seats, club-coloured banners and floodlights.
    ctx.fillStyle = "#173b28"; ctx.beginPath(); ctx.moveTo(0, 135); ctx.lineTo(500, 105); ctx.lineTo(1000, 135); ctx.lineTo(1000, 345); ctx.lineTo(0, 345); ctx.fill();
    for (let row = 0; row < 10; row++) for (let col = 0; col < 50; col++) { ctx.fillStyle = (row + col) % 5 === 0 ? club.color : (row + col) % 3 === 0 ? "#536c48" : "#38543b"; ctx.globalAlpha = 0.65; ctx.fillRect(col * 21 + 3, 167 + row * 14, 13, 8); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#e4e4be"; ctx.fillRect(0, 151, 1000, 9); ctx.fillStyle = "#142e23"; ctx.fillRect(0, 296, 1000, 33);
    ctx.fillStyle = club.color; ctx.globalAlpha = 0.8; ctx.fillRect(0, 301, 1000, 22); ctx.globalAlpha = 1;
    const hex = club.color.replace("#", ""); const brightness = parseInt(hex.slice(0, 2), 16) * .299 + parseInt(hex.slice(2, 4), 16) * .587 + parseInt(hex.slice(4, 6), 16) * .114;
    ctx.fillStyle = brightness > 130 ? "#173624" : "#fff"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
    for (let i = 0; i < 4; i++) ctx.fillText(`${club.abbr} · WE WILL BE BACK`, 125 + i * 250, 317);
    ctx.strokeStyle = "#a5b89a"; ctx.lineWidth = 5;
    for (const x of [65, 935]) { ctx.beginPath(); ctx.moveTo(x, 270); ctx.lineTo(x, 62); ctx.stroke(); rounded(x - 38, 48, 76, 18, 3, "#eff6bf"); ctx.fillStyle = "#edf5c6"; ctx.globalAlpha = .035; ctx.beginPath(); ctx.moveTo(x, 67); ctx.lineTo(x - 120, 320); ctx.lineTo(x + 120, 320); ctx.fill(); ctx.globalAlpha = 1; }
    const pitch = ctx.createLinearGradient(0, 329, 0, 600); pitch.addColorStop(0, "#4d733e"); pitch.addColorStop(1, "#73904d"); ctx.fillStyle = pitch; ctx.fillRect(0, 329, 1000, 271);
    for (let i = 0; i < 7; i++) { ctx.globalAlpha = .06; ctx.fillStyle = i % 2 ? "#fff" : "#000"; ctx.fillRect(0, 329 + i * 45, 1000, 45); } ctx.globalAlpha = 1;
    ctx.strokeStyle = "#d5e2ad66"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(500, 329); ctx.lineTo(500, 600); ctx.moveTo(110, 329); ctx.lineTo(-90, 600); ctx.moveTo(890, 329); ctx.lineTo(1090, 600); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(500, 444, 124, 39, 0, 0, Math.PI * 2); ctx.stroke();
    if (level === 3) { const wind = Math.round(Math.sin(elapsed * .8) * configs[3].wind); rounded(395, 88, 210, 24, 5, "#0b2019aa"); ctx.fillStyle = "#dce9be"; ctx.font = "11px Arial"; ctx.fillText(`WIND ${wind > 0 ? "→" : "←"} ${Math.abs(wind)} · AIM AHEAD!`, 500, 104); }
  }
  function drawTarget(t) {
    const s = configs[level].scale; const wobble = t.hit > 0 ? Math.sin(t.hit * 28) * .15 : 0;
    ctx.save(); ctx.translate(t.x, t.y); ctx.scale(s, s); ctx.rotate(wobble);
    ctx.fillStyle = "#122a2060"; ctx.beginPath(); ctx.ellipse(0, 92, t.role === "stadium" ? 64 : 44, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b6a57e"; ctx.fillRect(-3, 22, 6, 70);
    if (t.role === "stadium") {
      rounded(-68, -38, 136, 92, 6, "#dfdcc3"); rounded(-62, -32, 124, 78, 4, "#203e2b");
      ctx.fillStyle = club.color; ctx.fillRect(-55, -16, 110, 12); ctx.fillStyle = "#8ba26a"; ctx.beginPath(); ctx.ellipse(0, 15, 48, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#345934"; ctx.beginPath(); ctx.ellipse(0, 15, 27, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e5ead2"; ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.fillText(club.abbr, 0, -18);
    } else {
      // Intentionally illustrated cardboard figures, not portraits of real people.
      ctx.fillStyle = "#c6b38e"; ctx.fillRect(-29, 16, 58, 56); rounded(-36, 5, 72, 56, 9, t.role === "manager" ? "#243b32" : club.color);
      if (t.role === "coach") { ctx.fillStyle = "#263a2d"; ctx.fillRect(-5, 5, 10, 56); ctx.fillStyle = "#d4dcc7"; ctx.fillRect(13, 21, 11, 4); }
      if (t.role === "manager") { ctx.fillStyle = "#f0eee0"; ctx.beginPath(); ctx.moveTo(-12, 5); ctx.lineTo(12, 5); ctx.lineTo(0, 36); ctx.fill(); ctx.fillStyle = club.color; ctx.beginPath(); ctx.moveTo(-4, 12); ctx.lineTo(4, 12); ctx.lineTo(6, 33); ctx.lineTo(0, 38); ctx.lineTo(-6, 33); ctx.fill(); }
      if (t.role === "player") { ctx.fillStyle = brightnessFor(club.color) > 130 ? "#233528" : "#f1f1df"; ctx.font = "bold 23px Arial"; ctx.textAlign = "center"; ctx.fillText(String(t.player?.number || "—"), 0, 42); }
      ctx.fillStyle = "#ddba8b"; ctx.beginPath(); ctx.arc(0, -13, 24, 0, Math.PI * 2); ctx.fill();
      const hair = t.role === "player" ? t.index % 3 : 0;
      ctx.fillStyle = ["#524832", "#c39949", "#252822"][hair]; ctx.beginPath(); ctx.arc(0, -18, 23, Math.PI, Math.PI * 2); ctx.fill();
      if (t.role === "player" && hair === 1) { ctx.fillRect(-22, -26, 10, 16); ctx.fillRect(12, -26, 10, 16); }
      if (t.role === "player" && hair === 2) { ctx.beginPath(); ctx.moveTo(-18, -29); ctx.lineTo(-12, -43); ctx.lineTo(-4, -33); ctx.lineTo(5, -45); ctx.lineTo(15, -29); ctx.fill(); }
      ctx.fillStyle = "#433a2e"; ctx.fillRect(-9, -15, 3, 3); ctx.fillRect(7, -15, 3, 3); ctx.strokeStyle = "#8f6f4c"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(6, -3); ctx.stroke();
      if (t.role === "coach") { ctx.fillStyle = "#243b32"; ctx.fillRect(-25, -31, 50, 8); ctx.fillRect(-24, -36, 38, 7); }
      if (t.role === "manager") { ctx.strokeStyle = "#59634b"; ctx.lineWidth = 2; ctx.strokeRect(-15, -19, 12, 8); ctx.strokeRect(3, -19, 12, 8); ctx.beginPath(); ctx.moveTo(-3, -16); ctx.lineTo(3, -16); ctx.stroke(); }
    }
    const name = labelFor(t); rounded(-80, 75, 160, 23, 3, "#f5f1d9"); ctx.fillStyle = "#405431"; ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.fillText(name.length > 23 ? name.slice(0, 22) + "…" : name, 0, 90); ctx.restore();
  }
  function brightnessFor(color) { const hex = color.replace("#", ""); return parseInt(hex.slice(0, 2), 16) * .299 + parseInt(hex.slice(2, 4), 16) * .587 + parseInt(hex.slice(4, 6), 16) * .114; }
  function drawSplat(s) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.fillStyle = s.color; ctx.globalAlpha = Math.min(1, s.life / .3) * .85;
    ctx.beginPath(); for (let i = 0; i < 16; i++) { const angle = i / 16 * Math.PI * 2; const radius = s.radius * (i % 2 ? .58 : 1); const x = Math.cos(angle) * radius; const y = Math.sin(angle) * radius * .75; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); ctx.fill();
    if (s.ammo === "egg") { ctx.fillStyle = "#fff5d1"; ctx.beginPath(); ctx.ellipse(0, 0, s.radius * .45, s.radius * .3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffc52e"; ctx.beginPath(); ctx.arc(2, 0, s.radius * .18, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
  }
  function impact(flight) {
    const a = ammoConfig[flight.ammo]; let hit = false;
    for (const t of targets) {
      const s = configs[level].scale; const rx = (t.role === "stadium" ? 66 : 35) * s + a.radius; const ry = (t.role === "stadium" ? 43 : 52) * s + a.radius; const dy = flight.to.y - (t.y + 15 * s);
      if (((flight.to.x - t.x) / rx) ** 2 + (dy / ry) ** 2 <= 1) { hit = true; t.hit = .8; }
    }
    if (hit) { hits++; streak++; const combo = Math.min(5, 1 + Math.floor((streak - 1) / 3)); score += a.points * level * combo; $("game-score").textContent = score; $("game-combo").textContent = `×${combo}`; $("game-feedback").textContent = streak > 2 ? `${streak} HITS IN A ROW! ${a.icon}` : ["NICE AND CLEAN. WELL … ALMOST.", "ONLY CARDBOARD. FEELS GOOD.", "THAT LANDED!", "FRUSTRATION: A LITTLE LOWER."][hits % 4]; }
    else { streak = 0; $("game-combo").textContent = "×1"; $("game-feedback").textContent = "JUST WIDE. KEEP GOING."; }
    feedbackUntil = elapsed + 1.1;
    splats.push({ x: flight.to.x, y: flight.to.y, radius: a.radius + 19, color: a.color, life: 3.5, ammo: flight.ammo });
    for (let i = 0; i < 13; i++) particles.push({ x: flight.to.x, y: flight.to.y, vx: (Math.random() - .5) * 160, vy: -50 - Math.random() * 110, life: .65, color: a.color, size: 2 + Math.random() * 4 });
  }
  function throwAmmo() {
    if (!running || paused || elapsed - lastThrow < .22) return;
    lastThrow = elapsed; throws++;
    const wind = Math.sin(elapsed * .8) * configs[level].wind;
    flights.push({ from: { x: 500, y: 650 }, to: { x: aim.x + wind, y: aim.y }, t: 0, duration: ammo === "lettuce" ? .55 : .38, ammo });
  }
  function drawCrosshair() {
    if (!pointerIn || !running || paused) return;
    ctx.strokeStyle = "#e8f5bd"; ctx.lineWidth = 1.7; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(aim.x, aim.y, 13, 0, Math.PI * 2); ctx.moveTo(aim.x - 20, aim.y); ctx.lineTo(aim.x - 7, aim.y); ctx.moveTo(aim.x + 7, aim.y); ctx.lineTo(aim.x + 20, aim.y); ctx.moveTo(aim.x, aim.y - 20); ctx.lineTo(aim.x, aim.y - 7); ctx.moveTo(aim.x, aim.y + 7); ctx.lineTo(aim.x, aim.y + 20); ctx.stroke(); ctx.globalAlpha = 1;
  }
  function draw(dt) {
    ctx.clearRect(0, 0, 1000, 600); drawStadium();
    for (const t of targets) { drawTarget(t); t.hit = Math.max(0, t.hit - dt); }
    for (const s of splats) { drawSplat(s); s.life -= dt; } splats = splats.filter((s) => s.life > 0);
    for (const f of flights) { f.t += dt; const progress = Math.min(1, f.t / f.duration); const x = f.from.x + (f.to.x - f.from.x) * progress; const y = f.from.y + (f.to.y - f.from.y) * progress - Math.sin(progress * Math.PI) * 90; ctx.save(); ctx.translate(x, y); ctx.rotate(progress * 4); ctx.font = `${55 - progress * 22}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ammoConfig[f.ammo].icon, 0, 0); ctx.restore(); if (progress === 1) impact(f); } flights = flights.filter((f) => f.t < f.duration);
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 250 * dt; ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / .65); ctx.fillRect(p.x, p.y, p.size, p.size); } particles = particles.filter((p) => p.life > 0); ctx.globalAlpha = 1;
    drawCrosshair();
  }
  function loop(now) {
    if (!visible) { raf = 0; return; }
    const dt = Math.min(.06, lastFrame ? (now - lastFrame) / 1000 : 0); lastFrame = now;
    if (running && !paused) { elapsed += dt; remaining = Math.max(0, remaining - dt); updateTargets(); $("game-time").textContent = Math.ceil(remaining); if (elapsed > feedbackUntil) $("game-feedback").textContent = ""; draw(dt); if (remaining <= 0) end(); }
    else draw(0);
    raf = requestAnimationFrame(loop);
  }
  function overlay(title, copy, button) { $("game-overlay-title").textContent = title; $("game-overlay-copy").textContent = copy; $("game-start").replaceChildren(document.createTextNode(button + " ↗")); $("game-overlay").hidden = false; }
  function start() {
    if (running && paused) { paused = false; lastFrame = performance.now(); $("game-overlay").hidden = true; $("game-pause").textContent = "Pause Ⅱ"; canvas.focus({ preventScroll: true }); return; }
    running = true; paused = false; score = 0; streak = 0; hits = 0; throws = 0; remaining = 30; elapsed = 0; lastThrow = -1000; lastFrame = performance.now(); flights = []; splats = []; particles = []; createTargets();
    $("game-overlay").hidden = true; $("game-hud").hidden = false; $("game-score").textContent = "0"; $("game-combo").textContent = "×1"; $("game-time").textContent = "30"; $("game-feedback").textContent = ""; $("game-pause").disabled = false; $("game-pause").textContent = "Pause Ⅱ"; canvas.focus({ preventScroll: true });
  }
  function end() {
    running = false; paused = false; $("game-pause").disabled = true; flights = [];
    let best = 0; try { best = Number(localStorage.getItem(`nachspielzeit.best.${club.id}`)) || 0; if (score > best) localStorage.setItem(`nachspielzeit.best.${club.id}`, String(score)); } catch {}
    $("personal-best").textContent = Math.max(score, best);
    const accuracy = throws ? Math.round(hits / throws * 100) : 0;
    overlay(score > best ? "New record. Frustration released." : "Full time. Take a breath.", `${score} points · ${hits} hits · ${accuracy} % accuracy. The comments section survived without you today.`, "Play again");
  }
  function pause() { if (!running) return; if (paused) { start(); return; } paused = true; $("game-pause").textContent = "Resume ▷"; overlay("Take a breather.", "The clock has stopped. The scarf stays on.", "Keep playing"); }
  function reset() { running = false; paused = false; score = 0; elapsed = 0; flights = []; splats = []; particles = []; $("game-hud").hidden = true; $("game-feedback").textContent = ""; $("game-pause").disabled = true; $("game-pause").textContent = "Pause Ⅱ"; overlay("Before you post, let it out here.", "Eggs, tomatoes or lettuce. 30 seconds. All cardboard. Let the food fly.", "Start round"); createTargets(); }
  function setVisible(value) { if (!value && running && !paused) pause(); visible = value; if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; } if (visible && !raf) { lastFrame = performance.now(); raf = requestAnimationFrame(loop); } }
  function pointerPosition(event) { const rect = canvas.getBoundingClientRect(); aim = { x: (event.clientX - rect.left) / rect.width * 1000, y: (event.clientY - rect.top) / rect.height * 600 }; pointerIn = true; }
  canvas.addEventListener("pointermove", pointerPosition); canvas.addEventListener("pointerleave", () => { pointerIn = false; });
  canvas.addEventListener("pointerdown", (event) => { event.preventDefault(); pointerPosition(event); canvas.focus({ preventScroll: true }); throwAmmo(); });
  canvas.addEventListener("keydown", (event) => { const directions = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }; if (directions[event.key]) { event.preventDefault(); pointerIn = true; aim.x = Math.max(0, Math.min(1000, aim.x + directions[event.key][0])); aim.y = Math.max(0, Math.min(600, aim.y + directions[event.key][1])); } if ([" ", "Enter"].includes(event.key)) { event.preventDefault(); throwAmmo(); } if (event.key === "Escape") pause(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && running && !paused) pause(); });
  createTargets(); draw(0);
  return { start, pause, reset, setVisible, isRunning: () => running && !paused, isRoundActive: () => running, setClub(value) { club = value; createTargets(); }, setLevel(value) { level = configs[value] ? value : 1; createTargets(); }, setAmmo(value) { if (ammoConfig[value]) ammo = value; }, setTarget(role, name, custom) { targetRole = ["all", "coach", "manager", "player", "stadium"].includes(role) ? role : "all"; player = name; customName = custom; createTargets(); } };
}
