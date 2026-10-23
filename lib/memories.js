import { supportProfile, reassuranceFor } from "../public/support.js";
import { classifyFanMessage } from "../public/conversation.js";

export const memories = {
  "124": {
    title: "Remember when Kagawa made a small fee feel priceless?", year: "2010–2012", text: "Shinji Kagawa arrived from Osaka in 2010 for around €350,000. He went on to win two league titles and the 2012 German Cup with Dortmund. Sometimes a genuinely brilliant find is the best reminder that a big price tag is not the whole story.",
    query: "Shinji Kagawa Borussia Dortmund 2010 2012 Bundesliga official highlights",
    sources: [{ title: "UEFA: Kagawa’s journey from Osaka to Dortmund", url: "https://de.uefa.com/news-media/news/01fe-0f880f2ad1e7-76969358ad26-1000--kagawa-wechselt-zu-manu/" }],
    videos: [{ id: "KRN8hoW79nE", title: "Kagawa, Reus & co. · Dortmund goals against Köln", headline: "Remember Kagawa, Reus and that Dortmund feeling?", recollection: "Those familiar faces. Those goals against Köln. A little reminder of why watching your club can feel so good.", channel: "Borussia Dortmund", year: "Through the years" }, { id: "fhDwW6o2fy0", title: "Kagawa’s first Revierderby · 2010", headline: "Remember when Kagawa was the new face in the derby?", recollection: "Back to his first Revierderby in 2010. Sometimes one player is enough to bring a whole chapter in black and yellow back to life.", channel: "Bundesliga · regional restrictions", year: "2010" }, { id: "YXd_ZtpzT9c", title: "Kagawa, Freiburg and the league trophy", headline: "Remember that title-winning feeling in 2012?", recollection: "Kagawa, Freiburg and the trophy. Today can be frustrating, and those brilliant Dortmund days can still belong to you.", channel: "Bundesliga · regional restrictions", year: "2012" }]
  },
  "132": {
    title: "Remember when Lewandowski scored five in nine minutes?", year: "2015", text: "On 22 September 2015, Robert Lewandowski scored five goals in nine minutes against Wolfsburg. That memory does not fix today’s problems. But it belongs to your club just as much as this frustrating matchday does.",
    query: "Robert Lewandowski Bayern Wolfsburg 2015 5 goals 9 minutes Bundesliga",
    sources: [{ title: "FC Bayern: Lewandowski’s unforgettable five-goal haul", url: "https://fcbayern.com/fcbayerntv/en/videos/2019/03/robert-lewandowskis-unforgettable-five-goal-haul-against-wolfsburg" }],
    videos: [{ id: "OmKbGOARXao", title: "Lewandowski · 5 goals in 9 minutes", headline: "Remember when Lewandowski scored five in nine minutes?", recollection: "That Wolfsburg game in 2015. The goals just kept coming — one of those Bayern moments worth going back to when today feels heavy.", channel: "Bundesliga", year: "2015" }, { id: "rUxMmrHEFCc", title: "Nine minutes for the history books", headline: "Remember when the next goal barely gave you time to breathe?", recollection: "A short trip back to Lewandowski’s remarkable nine minutes. What comes back to you when you watch it again?", channel: "Bundesliga · Short", year: "2015" }]
  },
  "364": {
    title: "Remember Robertson and those great Liverpool years?", year: "2017", text: "Andy Robertson joined Liverpool from Hull City in 2017. Looking back, the club put the fee at around £8 million. An unheralded arrival became an important part of some great Liverpool years. Good transfers do not always make the loudest entrance.",
    query: "Andy Robertson Liverpool best moments official LFC",
    sources: [{ title: "Liverpool FC: The story of Andy Robertson", url: "https://lfcbeta.liverpoolfc.com/news/thank-you-robbo-story-andy-robertsons-liverpool-love-affair" }], videos: []
  },
  "359": {
    title: "Remember Henry and those Invincibles years?", year: "1999–2007", text: "Thierry Henry arrived at Arsenal in 1999 after a difficult spell at Juventus. Arsène Wenger played him as a striker. Henry became the club’s record goalscorer and part of the unbeaten 2003/04 Invincibles. A difficult spell does not have to be the final chapter.",
    query: "Thierry Henry Arsenal Invincibles official best goals",
    sources: [{ title: "Premier League: Henry’s move to Arsenal", url: "https://www.premierleague.com/en/news/1299931" }], videos: []
  },
  "133": {
    title: "Remember when Raúl brought that feeling to Schalke?", year: "2010–2012", text: "Raúl played for Schalke from 2010 to 2012 and helped the club win the 2011 German Cup. A short spell left a long-lasting mark. That is why the love for a club can stay, even when the present is exhausting.",
    query: "Schalke Raul DFB Pokalfinale 2011 DFB official",
    sources: [{ title: "Schalke 04 on Raúl’s time at the club", url: "https://schalke04.de/inside/raul-beendet-seine-karriere-mit-einem-titel/" }],
    videos: [{ id: "3hn7uHYggXU", title: "Draxler & Raúl · German Cup final 2011", headline: "Remember Raúl, Draxler and that cup-final feeling?", recollection: "Back to the 2011 German Cup final. A brighter Schalke chapter to revisit — and a reminder that this club has given you reasons to smile, too.", channel: "DFB", year: "2011" }]
  },
  "86": {
    title: "Remember Marcelo and those trophy-filled years?", year: "2007–2022", text: "Marcelo made his Real Madrid debut in January 2007. By the time he left in 2022, he had won 25 trophies with the club. Great club stories sometimes grow one step at a time, long before anyone can see their full value.",
    query: "Marcelo Real Madrid legend official highlights 2007 2022",
    sources: [{ title: "Real Madrid: Marcelo, a club legend", url: "https://www.realmadrid.com/en-US/the-club/history/football-legends/marcelo-vieira" }], videos: []
  }
};

export function clubMemory(club) {
  return memories[club.id] || {
    title: "Your story is bigger than today.", year: "YOUR CLUB", text: `A difficult matchday does not take away your good memories of ${club.name}. Which player or match made you fall in love with this club? That is a good place to start.`,
    query: `${club.name} best moments official highlights`, sources: [], videos: []
  };
}

export function demoReply(club, text, frustration = 45) {
  const profile = supportProfile(frustration);
  const fanSentiment = classifyFanMessage(text);
  if (fanSentiment === "positive") return {
    message: `I am glad it feels a little lighter. You can care about ${club.name} without carrying every decision around all evening. You can take a bit of that headspace back for yourself.`,
    closing: reassuranceFor(club, profile.temperature), temperature: profile.temperature, supportBand: profile.label, replyStyle: profile.replyStyle, modelTemperature: profile.modelTemperature,
    memory: clubMemory(club), sources: [], videos: [], fanSentiment, demo: true
  };
  const lower = text.toLowerCase();
  const openings = {
    calm: `It is understandable to be disappointed with ${club.name}. Let us look at what happened and keep the facts in perspective. `,
    annoyed: `I get why ${club.name} are getting to you today. When you care about a club, the little things stop feeling little. `,
    heated: `Supporting ${club.name} feels pretty exhausting right now. You do not need to put a brave face on it here. The frustration makes sense when you care this much. `,
    boiling: `That sounds like a lot to sit with as a ${club.name} fan. You have invested your time, energy and hope, so of course another disappointment can hit hard. I am not going to ask you to laugh it off. `,
    meltdown: `I hear you. Following ${club.name} feels overwhelming right now, and you do not have to justify how much this matters to you. You can be angry, disappointed and still love your club. There is no need to force a positive take tonight. `
  };
  let message = openings[profile.key];
  const creativeTouches = {
    annoyed: "Some matchdays really test the scarf. ",
    heated: "It feels like the season has picked up a habit of stepping on your scarf. ",
    boiling: "Right now your football brain has 37 tabs open, and every one is replaying that decision. Let us give it one quieter corner of the pub. ",
    meltdown: "This season has enough plot twists to fill a pub quiz. You do not have to untangle them all tonight. "
  };
  message += creativeTouches[profile.key] || "";
  if (/transfer|million|ablöse|100|geld|fee|money|spend|signing/.test(lower)) message += "When the spending is huge and the return on the pitch feels tiny, it is hard not to feel let down. The exact fee and context still deserve checking before we judge the whole deal.";
  else if (/trainer|taktik|aufstell|wechsel|manager|coach|tactic|line.?up|substitut/.test(lower)) message += "Watching decisions you cannot understand can leave you feeling powerless. It makes sense to want a clearer plan from the touchline.";
  else if (/spiel(er|t)|tor|leistung|player|performance|starting/.test(lower)) message += "You can be disappointed in a performance without writing off the person behind the shirt. Let us stay with what is happening on the pitch.";
  else message += "There is room to say what got to you today without dressing it up.";
  if (profile.temperature >= 60) message += "\n\nIf it would help, put the feed down for one minute, take a breath and give yourself a little room. There is no rush to make sense of the whole season.";
  const memory = clubMemory(club);
  if (memories[club.id]) message += `\n\n${profile.temperature >= 60 ? "Only when you feel ready, here is one small reminder — it does not cancel out how you feel: " : "For a little perspective: "}${memory.text}`;
  else message += "\n\nI will not invent a bargain signing or a famous result to cheer you up. Tell me about one good club memory that is yours, and we can start there.";
  return { message, closing: reassuranceFor(club, profile.temperature), temperature: profile.temperature, supportBand: profile.label, replyStyle: profile.replyStyle, modelTemperature: profile.modelTemperature, memory, sources: memory.sources, videos: memory.videos, fanSentiment, demo: true };
}
