// Hand-picked source cards for hand-written questions that the automatic match in locate.js
// cannot resolve (the card paraphrases the answer) or resolves to the wrong card.
//   q      start of the question text        a      start of the answer (optional)
//   title  part of the card's title          find   a phrase the card must contain
//   node   look only at that place's overview cards
//   ends   look only at the route between these two place names
export const SOURCE_HINTS = [
  { q: 'Goliad arrival traffic is at 2,500', title: 'At Point Rusty' },
  { q: 'What is the maximum angle you may use to intercept?', find: 'intercept centerline at 45°' },
  { q: 'What should you be wary of over the Intracoastal?', title: 'Warnings' },
  { q: 'Where do you position yourself?', title: 'Holding short' },
  { q: 'How close may you get to KRAS?', title: 'KRAS' },
  { q: 'How do you turn into your area?', find: 'turn away from the beach toward it' },
  { q: 'How do you get into your block?', find: 'directly into the claimed area' },
  { q: 'By what point must you discontinue', title: 'Discontinued entry' },
  { q: 'Which maneuver is permitted with a solo', title: 'Pattern direction and ELPs' },
  { q: 'What is the maximum number of aircraft permitted', title: 'at a glance' },
  { q: 'Where must you remain relative to the Power Plant?', find: 'remain west of the power plant' },
  { q: 'What is the specified fallback', title: 'Request course rules' },
  { q: 'What restriction applies to Padre Island', title: 'Stay clear of the Seashore' },
  { q: 'What is the required causeway crossing profile?', title: 'Cross Aransas Pass Causeway' },
  { q: 'When should you call Tower, and on what channel?', title: 'Call Tower when number one' },
  { q: 'How do you join the Southern Arrival?', title: 'Re-entry: north flow' },
  { q: 'What is the VHF counterpart', node: 'kngp', title: 'Corpus radio channels' },
  { q: 'Which radio do you use?', node: 'kngp', title: 'Corpus radio channels' },
  { q: 'What altitude and airspeed do you climb to and maintain up to Point Rusty', title: 'Continue to Point Rusty' },
  { q: 'What must be established by no later than 9 Mile Point?', title: 'Southbound on the Northern Arrival', ends: ['Aransas County', 'KNGP'] },
  { q: 'How do you establish on the arrival?', title: 'Join the Southern Arrival' },
  { q: 'What do you do at the upwind numbers?', title: 'Climb out RWY 18' },
  { q: 'What routing does Ground give you?', title: 'Taxi to RWY 13L' },
];

export const hintFor = (item) =>
  SOURCE_HINTS.find((h) => item.text.startsWith(h.q) && (!h.a || item.answers[0].startsWith(h.a)));
