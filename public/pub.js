import { supportProfile } from "/support.js";

const moods = { calm: "Relaxed", annoyed: "Not amused", heated: "Fuming", boiling: "Boiling over", meltdown: "Absolutely livid" };
const lines = { calm: "Pull up a stool. How was the match?", annoyed: "Go on. I am listening.", heated: "Yeah, that one really stings.", boiling: "No need to put a brave face on it.", meltdown: "Take your time. I have got you." };

export function createPubScene(container, prefix) {
  container.innerHTML = `<svg class="pub-scene" viewBox="0 0 1000 570" role="img" aria-label="A cosy football pub. Your fan avatar is sitting at the bar with the Fan Buddy.">
    <defs>
      <linearGradient id="${prefix}-wall" x2="0" y2="1"><stop stop-color="#302b27"/><stop offset="1" stop-color="#171a18"/></linearGradient>
      <linearGradient id="${prefix}-wood" x2="0" y2="1"><stop stop-color="#a66f41"/><stop offset=".18" stop-color="#71452d"/><stop offset="1" stop-color="#472c22"/></linearGradient>
      <radialGradient id="${prefix}-light"><stop stop-color="#ffc376" stop-opacity=".2"/><stop offset="1" stop-color="#ffc376" stop-opacity="0"/></radialGradient>
      <pattern id="${prefix}-bricks" width="120" height="57" patternUnits="userSpaceOnUse"><path d="M0 0h120v57H0ZM60 0v29M0 29h120" fill="none" stroke="#9c7462" stroke-opacity=".13" stroke-width="2"/></pattern>
    </defs>
    <rect width="1000" height="570" fill="url(#${prefix}-wall)"/>
    <rect width="1000" height="420" fill="url(#${prefix}-bricks)"/>
    <ellipse class="room-glow" cx="510" cy="180" rx="470" ry="310" fill="url(#${prefix}-light)"/>
    <path d="M0 40h1000M0 46h1000" stroke="#574738" stroke-width="7"/>
    <g transform="translate(66 91)"><rect x="-7" y="-7" width="245" height="154" rx="5" fill="#6a4f38"/><rect width="231" height="140" rx="3" fill="#111f1c"/><path d="M20 27h191v86H20Zm95 0v86" fill="none" stroke="#e1dfc1" stroke-opacity=".23" stroke-width="2"/><circle cx="115" cy="69" r="18" fill="none" stroke="#e1dfc1" stroke-opacity=".23" stroke-width="2"/><text x="115" y="69" font-size="25" fill="#d7bd80" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold">+90</text><text class="pub-club-label" x="115" y="101" font-size="11" fill="#b6c2a5" text-anchor="middle" font-family="Arial,sans-serif">YOUR CLUB. YOUR CORNER.</text><circle cx="222" cy="132" r="2" fill="#9dab78"/></g>
    <g transform="translate(360 78)"><rect x="-10" y="-10" width="298" height="101" rx="12" fill="#151511" stroke="#5d513b" stroke-width="2"/><text x="139" y="40" fill="#f2cb87" stroke="#f2cb87" stroke-width=".5" font-family="Impact,Arial,sans-serif" font-size="34" text-anchor="middle" letter-spacing="1.5">THE THIRD HALF</text><text x="139" y="69" fill="#b5a583" font-family="Arial,sans-serif" font-size="10" text-anchor="middle" letter-spacing="4">THE MATCHDAY LOCAL</text></g>
    <g transform="translate(720 77) rotate(4)"><rect width="216" height="145" rx="4" fill="#74543a"/><rect x="7" y="7" width="202" height="131" rx="2" fill="#25362d"/><text x="108" y="33" text-anchor="middle" fill="#dfd4ae" font-family="Georgia,serif" font-size="13">TODAY'S SPECIAL</text><path d="M30 44h156" stroke="#dfd4ae" stroke-opacity=".35"/><text x="108" y="68" text-anchor="middle" fill="#e6d4a8" font-family="Georgia,serif" font-size="15">A listening ear.</text><text x="108" y="91" text-anchor="middle" fill="#e6d4a8" font-family="Georgia,serif" font-size="15">A better memory.</text><text x="108" y="119" text-anchor="middle" fill="#b6bd92" font-family="Arial,sans-serif" font-size="9">NO HOT TAKES REQUIRED.</text></g>
    <g fill="#8c6840"><rect x="54" y="259" width="230" height="8"/><rect x="759" y="258" width="193" height="8"/></g>
    <g fill="#55715a"><path d="M84 258v-53h7v-21h9v21h7v53Z"/><path d="M122 258v-43h7v-22h10v22h7v43Z"/><path d="M179 258v-49h6v-19h10v19h7v49Z"/></g>
    <g fill="#ad8953"><rect x="86" y="225" width="19" height="18" rx="1"/><rect x="124" y="230" width="20" height="15" rx="1"/><rect x="181" y="226" width="19" height="17" rx="1"/></g>
    <g fill="#c8c1a8" opacity=".7"><path d="M794 256v-37h17v37Zm30 0v-37h17v37Zm30 0v-37h17v37Z"/></g>
    <g stroke="#8e7957" stroke-width="3"><path d="M338 45v122M679 45v122"/></g><g fill="#c8a967"><path d="m305 188 17-24h32l19 24Z"/><path d="m646 188 17-24h32l19 24Z"/></g><g fill="#ffdb91" opacity=".65"><ellipse cx="339" cy="189" rx="30" ry="4"/><ellipse cx="680" cy="189" rx="30" ry="4"/></g>
    <g class="bartender" transform="translate(356 274)"><path d="M-49 50q49-25 98 0l23 111h-145Z" fill="#e0d9bd"/><path d="m-30 44 31 36 29-36 17 110h-91Z" fill="#314c3d"/><path d="M-49 75q-36 18-38 65h43M48 75q35 13 39 65H45" fill="none" stroke="#e0d9bd" stroke-width="22" stroke-linecap="round"/><path d="M-27 148h65" stroke="#c89d76" stroke-width="16" stroke-linecap="round"/><circle cy="8" r="37" fill="#cba17c"/><path d="M-38 8q-9-45 38-47 43 1 38 45l-13-21-32 4-25-1Z" fill="#463b31"/><path d="M-29 22q29 36 58 0-7 39-29 35-21 4-29-35Z" fill="#5c4a38"/><path d="M-18 4h8M10 4h8" stroke="#3f372d" stroke-width="4" stroke-linecap="round"/><path d="M-13 24q13 13 26 0" fill="none" stroke="#f1d4aa" stroke-width="3" stroke-linecap="round"/><rect x="-23" y="91" width="47" height="14" rx="3" fill="#c5b584"/><text x="1" y="101" text-anchor="middle" font-size="7" fill="#3e4938" font-family="Arial,sans-serif" font-weight="bold">FAN BUDDY</text></g>
    <g class="fan-steam" fill="none" stroke="#f0bf94" stroke-width="4" stroke-linecap="round" opacity="0"><path d="M625 228q-17-19 0-36t0-29M702 218q19-19 0-36t0-29M738 243q19-19 0-36t0-29"/></g>
    <g class="fan-avatar" transform="translate(674 308)">
      <ellipse cx="0" cy="225" rx="69" ry="16" fill="#0b110c" opacity=".6"/><rect x="-43" y="172" width="87" height="17" rx="8" fill="#835b3d"/><path d="M-32 185v61M32 185v61" stroke="#493f32" stroke-width="9"/>
      <path d="M-32 130 -43 214M32 130l32 78" stroke="#282d29" stroke-width="28" stroke-linecap="round"/>
      <path class="fan-shirt" d="M-50 30q50-25 100 0l13 121H-62Z" fill="#d6ff4f"/>
      <path class="fan-arm fan-arm-left" d="M-47 49-87 84-135 78" fill="none" stroke="#d6ff4f" stroke-width="26" stroke-linecap="round"/>
      <path class="fan-arm fan-arm-right" d="m48 49 36 40-45 8" fill="none" stroke="#d6ff4f" stroke-width="26" stroke-linecap="round"/>
      <ellipse class="fan-skin fan-hand-left" cx="-135" cy="78" rx="16" ry="11" fill="#dbb492"/><ellipse class="fan-skin fan-hand-right" cx="39" cy="97" rx="16" ry="11" fill="#dbb492"/>
      <path class="fan-scarf" d="M-42 26q42 26 84 0l-4 20q-38 25-76 0Z" fill="#173c2d"/><path class="fan-scarf-tail" d="m21 43 18 1 7 63-22 3Z" fill="#173c2d"/><path class="fan-scarf-stripe" d="M25 82h18M26 98h18" stroke="#e9dfb9" stroke-width="5"/>
      <ellipse class="fan-head fan-skin" cy="-11" rx="43" ry="49" fill="#dbb492"/><ellipse class="fan-cheek" cx="-28" cy="4" rx="12" ry="8" fill="#e1967b" opacity=".1"/><ellipse class="fan-cheek" cx="28" cy="4" rx="12" ry="8" fill="#e1967b" opacity=".1"/>
      <path d="M-42-16q-12-49 31-48 52-13 55 45L27-38-7-30-32-36Z" fill="#3e3026"/>
      <path class="fan-brow-left" d="M-27-22-9-24" fill="none" stroke="#463328" stroke-width="5" stroke-linecap="round"/><path class="fan-brow-right" d="m9-24 18 2" fill="none" stroke="#463328" stroke-width="5" stroke-linecap="round"/>
      <ellipse class="fan-eye" cx="-18" cy="-12" rx="3" ry="4" fill="#332c25"/><ellipse class="fan-eye" cx="18" cy="-12" rx="3" ry="4" fill="#332c25"/>
      <path class="fan-mouth" d="M-13 13q13 12 26 0" fill="none" stroke="#754436" stroke-width="3.5" stroke-linecap="round"/>
      <path class="fan-angry-mark" d="m44-34 8-5m-4 5 6 6m-4-3-7 6" fill="none" stroke="#e97861" stroke-width="3" stroke-linecap="round" opacity="0"/>
      <image class="fan-club-crest" x="-25" y="69" width="25" height="29" visibility="hidden"/>
      <rect x="-24" y="117" width="47" height="16" rx="4" fill="#1f3026"/><text x="0" y="128" fill="#f8e1b3" text-anchor="middle" font-size="9" font-family="Arial,sans-serif" font-weight="bold">YOU</text>
    </g>
    <rect y="414" width="1000" height="156" fill="url(#${prefix}-wood)"/><path d="M0 430h1000M0 443h1000" stroke="#c38b51" stroke-opacity=".3" stroke-width="3"/>
    <path d="M45 460h230v95H45Zm262 0h229v95H307Zm263 0h229v95H570Zm262 0h130v95H832Z" fill="none" stroke="#331f19" stroke-width="6"/>
    <rect y="401" width="1000" height="19" rx="3" fill="#b7824e"/><rect y="397" width="1000" height="7" fill="#dbac6a"/><rect y="419" width="1000" height="5" fill="#321f18"/>
    <g transform="translate(514 354)"><ellipse cy="48" rx="37" ry="8" fill="#422f20" opacity=".5"/><path d="M-18 1h36l-3 43h-30Z" fill="#d8ab4c" opacity=".7" stroke="#e7d7ac" stroke-width="2"/><path d="M18 9q26-4 19 19-6 8-20 4" fill="none" stroke="#dcc9a5" stroke-width="5"/><ellipse cy="3" rx="18" ry="7" fill="#f0e3c9"/><circle cx="-4" cy="-2" r="7" fill="#f0e3c9"/><circle cx="8" cy="-1" r="6" fill="#f0e3c9"/></g>
    <g transform="translate(831 365) rotate(-8)"><rect x="-38" y="-5" width="76" height="31" rx="4" fill="#d9c59c"/><text y="14" text-anchor="middle" font-size="10" font-family="Arial,sans-serif" font-weight="bold" fill="#58452e">YOUR SEAT</text></g>
    <g class="pub-speech"><rect x="294" y="202" width="372" height="41" rx="8" fill="#f0dfb9"/><path d="m367 243-12 14 1-14" fill="#f0dfb9"/><text class="pub-speech-text" x="480" y="228" text-anchor="middle" fill="#5b4731" font-size="14" font-family="Arial,sans-serif">Yeah, that one really stings.</text></g>
  </svg>`;
  const svg = container.querySelector("svg");
  const find = (selector) => svg.querySelector(selector);
  function update({ temperature = 45, club = null } = {}) {
    const profile = supportProfile(temperature); const amount = profile.temperature / 100;
    svg.setAttribute("aria-label", `A cosy football pub. Your fan avatar is ${moods[profile.key].toLowerCase()} at ${profile.temperature} out of 100 frustration${club ? `, wearing ${club.name} colours` : ""}.`);
    svg.dataset.mood = profile.key;
    const skin = `rgb(${Math.round(219 + 14 * amount)}, ${Math.round(180 - 62 * amount)}, ${Math.round(146 - 40 * amount)})`;
    svg.querySelectorAll(".fan-skin").forEach((part) => part.setAttribute("fill", skin));
    svg.querySelectorAll(".fan-cheek").forEach((part) => part.setAttribute("opacity", String(.05 + amount * .65)));
    find(".fan-brow-left").setAttribute("d", `M-29 ${-24 - amount * 9} -8 ${-25 + amount * 10}`);
    find(".fan-brow-right").setAttribute("d", `M8 ${-25 + amount * 10} 29 ${-24 - amount * 9}`);
    const mouth = find(".fan-mouth");
    mouth.setAttribute("d", amount >= .8 ? `M-15 20q15 -${18 + amount * 8} 30 0q-15 18-30 0Z` : `M-14 ${12 + amount * 10}q14 ${13 - amount * 33} 28 0`);
    mouth.setAttribute("fill", amount >= .8 ? "#6d3430" : "none");
    find(".fan-steam").setAttribute("opacity", String(Math.max(0, (amount - .55) * 1.9)));
    find(".fan-angry-mark").setAttribute("opacity", String(Math.max(0, (amount - .45) * 1.7)));
    find(".fan-avatar").setAttribute("transform", `translate(674 ${308 - amount * 7}) rotate(${amount * -2})`);
    const clubColor = club?.color || "#c7b273";
    find(".fan-shirt").setAttribute("fill", clubColor);
    svg.querySelectorAll(".fan-arm").forEach((arm) => arm.setAttribute("stroke", clubColor));
    const hex = clubColor.replace("#", ""); const light = parseInt(hex.slice(0, 2), 16) * .299 + parseInt(hex.slice(2, 4), 16) * .587 + parseInt(hex.slice(4, 6), 16) * .114;
    const contrast = light > 145 ? "#26352a" : "#ecdcba";
    find(".fan-scarf").setAttribute("fill", contrast); find(".fan-scarf-tail").setAttribute("fill", contrast); find(".fan-scarf-stripe").setAttribute("stroke", clubColor);
    find(".fan-club-crest").setAttribute("visibility", club ? "visible" : "hidden");
    if (club) find(".fan-club-crest").setAttribute("href", club.logo);
    find(".pub-club-label").textContent = club ? `${club.abbr} · YOU BELONG HERE` : "YOUR CLUB. YOUR CORNER.";
    find(".pub-speech-text").textContent = lines[profile.key];
    return { profile, mood: moods[profile.key] };
  }
  update();
  return { update };
}
