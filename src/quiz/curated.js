import { q } from './q.js';
import { CURATED_A } from './curated-a.js';
import { CURATED_B } from './curated-b.js';
import { CURATED_C } from './curated-c.js';
import { CURATED_D } from './curated-d.js';

// Hand-written scenario questions. Each answer comes from the sourced route and reference data
// (Binder, Feb 2026 PPT Parts 1–2). `choices` includes the answer; `topic` must match a topic chip.
const BASE = [
  q('Goliad', 'Reference', 'You are inbound to Goliad on course rules, setting up for the initial.',
    'Which town must you not overfly?', 'Berclair', ['Woodsboro', 'Bayside', 'Refugio']),
  q('Goliad', 'Reference', 'You are inbound to Goliad and have not yet set up on the initial.',
    'What is the closest you may be to the field unless you are above 5,000\' MSL?', '5 NM', ['2 NM', '3 NM', '4 NM']),
  q('Goliad', 'Reference', 'You are on the Goliad initial.',
    'How far out on the extended centerline is the initial?', '4 NM', ['2 NM', '3 NM', '5 NM']),
  q('Goliad', 'Reference', 'You are intercepting the extended centerline for the Goliad initial.',
    'What is the maximum angle you may use to intercept?', '45° or less', ['30° or less', '60° or less', '90°']),
  q('Goliad → Aransas County', 'Routes', 'You just departed Goliad and are clear of the pattern, heading for Aransas County.',
    'What heading do you fly direct to Woodsboro?', 'Approximately 140°', ['Approximately 090°', 'Approximately 180°', 'Approximately 225°']),
  q('Goliad → Aransas County', 'Routes', 'You just departed Goliad and are clear of the pattern, heading for Aransas County.',
    'Which altitude and airspeed do you climb to?', '2,500\' MSL · 240 KIAS', ['1,500\' MSL · 200 KIAS', '3,500\' MSL · 240 KIAS', '2,500\' MSL · 200 KIAS']),
  q('Goliad → Aransas County', 'Routes', 'You are flying from Woodsboro toward Aransas County.',
    'What approximate heading do you fly from Woodsboro to Bayside?', '145°', ['090°', '155°', '322°']),
  q('KNGP → Goliad', 'Routes', 'You are past Point Rusty on the Rusty departure, bound for Goliad.',
    'Which way do you turn at Point Rusty, and toward what?', 'Right, toward Bayside', ['Left, toward Bayside', 'Right, toward Woodsboro', 'Left, toward Goliad']),
  q('KNGP → Goliad', 'Routes', 'You turn right at Point Rusty toward Bayside.',
    'Which altitude and airspeed do you hold on that leg?', '5,500\' MSL · 240 KIAS', ['2,500\' MSL · 240 KIAS', '4,500\' MSL · 240 KIAS', '5,500\' MSL · 200 KIAS']),
  q('KNGP → Goliad', 'Routes', 'You are on the Rusty departure heading from Point Rusty to Bayside.',
    'Goliad arrival traffic is at 2,500\' MSL between Woodsboro and Bayside. What do you do?',
    'Remain clear of it', ['Descend below it', 'Cross at 2,500\' MSL', 'Turn toward Woodsboro']),
  q('KNGP → Goliad', 'Routes', 'You are abeam Bayside on the Rusty departure.',
    'What heading do you turn to for NOLF Goliad?', 'Approximately 322°', ['Approximately 360°', 'Approximately 145°', 'Approximately 140°']),
  q('KNGP → Goliad', 'Routes', 'You are abeam Bayside heading for NOLF Goliad.',
    'Which altitudes do you climb or descend to?', '4,500\' or 6,500\' MSL', ['2,500\' or 5,500\' MSL', '3,500\' or 7,500\' MSL', '1,500\' or 4,500\' MSL']),
  q('Waldron', 'Reference', 'You are inbound to Waldron past the Camel Humps.',
    'What are your altitude and airspeed after passing the Humps?', '1,000\' MSL · 200 KIAS', ['2,500\' MSL · 240 KIAS', '1,000\' MSL · 240 KIAS', '1,500\' MSL · 200 KIAS']),
  q('Waldron', 'Reference', 'You are proceeding north up the shoreline toward the Shrimp Ponds.',
    'Which landmark do you stay south of?', 'The Flour Bluff Water Tower', ['The Power Plant', 'The Camel Humps', 'The Shrimp Ponds']),
  q('Waldron', 'Reference', 'You are flying to the initial for a Waldron runway.',
    'Which landmark must you not overfly?', 'The Power Plant', ['The Water Tower', 'The Camel Humps', 'The Shrimp Ponds']),
  q('KNGP → Waldron', 'Routes', 'You are inbound to Waldron, passing the Camel Humps.',
    'Which waterway do you parallel as you proceed north toward the Shrimp Ponds?', 'The Intracoastal Waterway', ['The Crosstown Expressway', 'The Nueces River', 'The Aransas Causeway']),
  q('Aransas County', 'Reference', 'You are inbound to Aransas County from the north.',
    'What is the minimum altitude when overflying the wildlife refuge?', '3,000\' AGL', ['1,000\' AGL', '2,500\' AGL', '1,500\' AGL']),
  q('Aransas County', 'Reference', 'You are inbound to Aransas County and crossing the Intracoastal Waterway.',
    'What is the minimum altitude when crossing it?', '2,500\' MSL', ['1,000\' MSL', '1,500\' MSL', '3,000\' MSL']),
  q('Aransas County', 'Reference', 'You are descending to the Aransas County 2 NM initial.',
    'What altitude and airspeed do you descend to?', '1,000\' MSL · 200 KIAS', ['1,500\' MSL · 200 KIAS', '1,000\' MSL · 240 KIAS', '2,500\' MSL · 200 KIAS']),
  q('Aransas County', 'Reference', 'You are descending to the Aransas County initial.',
    'What should you be wary of over the Intracoastal?', 'Traffic on course rules at 1,500\'', ['Traffic at 3,000\' MSL', 'IFR traffic at 5,500\'', 'Parachute operations']),
  q('KNGP → Mustang', 'Routes', 'You are climbing out of KNGP on the beach line departure.',
    'Until what height may you not turn?', '300\' AGL', ['100\' AGL', '500\' AGL', '800\' AGL']),
  q('KNGP → Mustang', 'Routes', 'You are climbing out of KNGP on the beach line departure.',
    'What altitude and airspeed do you climb to first?', '500\' MSL · 200 KIAS', ['500\' MSL · 240 KIAS', '800\' MSL · 200 KIAS', '1,000\' MSL · 200 KIAS']),
  q('Foxtrot', 'Reference', 'You are operating in or departing from Foxtrot.',
    'Which airspace must you avoid at all times?', 'North Mustang (6,500–17,500\' MSL)', ['Central Mustang', 'South Mustang (below 6,500\')', 'KINGS 4']),
];

const seen = new Set();
export const CURATED = [...BASE, ...CURATED_A, ...CURATED_B, ...CURATED_C, ...CURATED_D].filter((item) => {
  const key = `${item.topic}|${item.scenario}|${item.text}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

