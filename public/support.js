// One fan slider controls frustration, support and reply creativity.
// The UI uses 0–100; model sampling is mapped separately to 0.2–1.1.
export const HEAT_BANDS = [
  { min: 0, key: "calm", label: "Keeping it together", support: "A little perspective", description: "A bit annoyed? A little football perspective and a good memory can help.", tone: "Keep it light and conversational. Brief validation, one grounded positive memory and clear practical perspective. Do not overstate the distress." },
  { min: 20, key: "annoyed", label: "Getting frustrated", support: "A friendly lift", description: "Fair enough. Your buddy will listen first, then help you find a brighter angle.", tone: "Acknowledge the frustration explicitly. Be warm and encouraging, with a specific positive memory. Use gentle humour only after validating the feeling." },
  { min: 40, key: "heated", label: "Properly heated", support: "Extra reassurance", description: "This one stings. More understanding, more reassurance, and no forced silver linings.", tone: "Give the fan extra emotional validation before discussing football facts. Be patient and reassuring. Explain a relevant good memory without using it to dismiss the present frustration. Ask one gentle follow-up question." },
  { min: 60, key: "boiling", label: "At boiling point", support: "Support first", description: "You do not need to laugh it off. Take your time — your buddy is here to listen.", tone: "Prioritise support over analysis. Give two specific, sincere validating sentences. Use a calm, steady tone and no banter at the fan's expense. Offer a small optional pause, then a carefully grounded reminder of why the club matters. Do not overwhelm with stats or minimise the feeling." },
  { min: 80, key: "meltdown", label: "Full matchday meltdown", support: "Maximum support", description: "No judgement. No tough love. Let us slow it down and take this one moment at a time.", tone: "This fan has requested maximum emotional support. Start with unhurried, non-patronising validation and explicitly say they do not need to justify how much the club matters. Offer one gentle optional grounding step, such as stepping away from the feed for a moment. Keep paragraphs short and easy to read. No teasing, forced optimism, competitive suffering, or 'it is only football'. Provide a brief positive memory only after the person feels heard. The scale measures football frustration, not a diagnosis or evidence of crisis." }
];

const REPLY_STYLES = {
  calm: { replyStyle: "Straightforward", styleInstructions: "Use clear, direct, measured sentences and practical football perspective. Avoid jokes, elaborate metaphors and surprising turns of phrase. Be warm without becoming formal or clinical." },
  annoyed: { replyStyle: "Conversational", styleInstructions: "Use natural, friendly phrasing with a little variety. Keep the answer grounded and easy to follow; at most one light football expression after acknowledging the feeling." },
  heated: { replyStyle: "Expressive", styleInstructions: "Use more expressive, varied language and one fresh football comparison if helpful. Offer an unexpected but grounded angle on the situation. Empathy comes before humour." },
  boiling: { replyStyle: "Creative", styleInstructions: "Use imaginative, vivid football or pub imagery and varied phrasing to make the reassurance personal. Gentle humour about football situations is welcome after validation, but never at the fan's expense. Do not force a joke." },
  meltdown: { replyStyle: "Most creative", styleInstructions: "Use your most original, vivid and varied supportive language: a fresh football metaphor, a surprising comforting comparison or gentle situational humour when appropriate. Give maximum empathy first. The fan is angrier; you remain kind and steady. Do not become manic, mocking or inflammatory. If the fan asks for no humour, honour that while keeping the wording original." }
};

export function supportProfile(value = 45) {
  const temperature = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 45;
  const band = [...HEAT_BANDS].reverse().find((band) => temperature >= band.min);
  const modelTemperature = Number((0.2 + temperature * 0.009).toFixed(2));
  return { ...band, ...REPLY_STYLES[band.key], temperature, modelTemperature };
}

export function reassuranceFor(club, value = 45) {
  const { key } = supportProfile(value);
  const endings = {
    calm: `Other clubs have their head-in-hands moments too. You chose ${club.name} for reasons bigger than one result — those reasons are still yours.`,
    annoyed: `Fans at other clubs have frustrating weeks too; nobody gets a drama-free season. There are reasons you fell for ${club.name}, and a bad patch does not erase the moments or the people behind them.`,
    heated: `You are not the only fan having a rough time — other clubs have their own painful chapters too. That does not make yours hurt less. You had real reasons to fall for ${club.name}, and those reasons have not disappeared with this result or transfer.`,
    boiling: `Other clubs have difficult chapters too, so you are not alone in this. That is perspective, not a reason to brush your feelings aside. There are memories, people and moments behind your love for ${club.name}. You do not have to feel positive right now for that love to count.`,
    meltdown: `Fans at other clubs know this kind of disappointment too, and you do not have to carry yours alone. Your frustration is allowed. There are real reasons you became a ${club.name} fan — your memories, your people, your sense of belonging. This difficult chapter does not take those away. You do not have to solve the whole season tonight.`
  };
  return endings[key];
}
