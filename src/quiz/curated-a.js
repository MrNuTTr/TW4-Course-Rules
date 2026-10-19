import { q } from './q.js';

// Hand-written scenario questions: KNGP departures, KNGP reference, Mustang, Foxtrot, KINGS 4.
// Answers come from the sourced route and reference data (Binder, Feb 2026 PPT Parts 1–2).
export const CURATED_A = [
  // KNGP reference
  q('KNGP', 'Reference', 'You are taxiing outbound from the Kilo line on a normal day, away from the TW-4 line.',
    'What taxi speed should you use?', '10–12 kts', ['5–7 kts', '15–18 kts', '20 kts']),
  q('KNGP', 'Reference', 'You are in the Sierra run-ups for a south flow departure and every spot just filled up.',
    'Who do you tell that the run-ups are full?', 'Boomer and Ranger Base', ['Navy Corpus Ground', 'Navy Corpus Tower', 'Navy Corpus Clearance']),
  q('KNGP', 'Reference', 'You are on the east side of the Kilo line loop, the side closest to the hangars.',
    'Which way do you taxi?', 'North', ['South', 'East', 'West']),
  q('KNGP', 'Reference', 'You are entering the Sierra run-ups from the Alfa line.',
    'Where do you park?', 'The westernmost spot available', ['The easternmost spot available', 'Directly behind the last aircraft', 'Up to the black boxes']),
  q('KNGP', 'Reference', 'You are VFR and holding short of RWY 13L on 04/22 behind other aircraft.',
    'Where do you position yourself?', 'Offset all the way to the right side', ['Offset all the way to the left side', 'In one line behind the lead aircraft', 'On the Yankee taxiway']),
  q('KNGP', 'Reference', 'You are inbound for the Shamrock arrival and checking which pattern you will fly.',
    'Which runway has a right-hand pattern?', 'RWY 18', ['RWY 13L', 'RWY 31L', 'RWY 36']),
  q('KNGP', 'Reference', 'Tower has parallel runways 13L and 13R in use and you are flying the Delta pattern.',
    'Which runway does Delta conform to?', '13L/31R', ['13R/31L', '18/36', '04/22']),
  q('KNGP', 'Reference', 'You are on a north flow day, taxiing out from parking toward the run-ups.',
    'Where do you hold short and call Ground for taxi clearance?', 'Charlie / Compass Rose', ['Sierra run-up', 'Echo / Yankee', 'Zulu / 36']),

  // KNGP -> Mustang
  q('KNGP → Mustang', 'Routes', 'You are departing RWY 13L on the beach line departure, past 300 ft AGL.',
    'What heading do you fly until the High Bridge?', '125°', ['105°', '135°', '305°']),
  q('KNGP → Mustang', 'Routes', 'You are departing RWY 13R on the beach line departure, past 300 ft AGL.',
    'What heading do you fly until the High Bridge?', '135°', ['125°', '105°', '315°']),
  q('KNGP → Mustang', 'Routes', 'You are departing RWY 31L on the beach line departure.',
    'What heading do you fly until cleared by Tower?', '305°', ['315°', '125°', '105°']),
  q('KNGP → Mustang', 'Routes', 'You departed RWY 04 on the beach line departure and are climbing through 500 ft MSL.',
    'When do you turn to HDG 105°?', 'Once clear of the pattern', ['Abeam the High Bridge', 'Once cleared by Tower', 'At 300 ft AGL']),
  q('KNGP → Mustang', 'Routes', 'You are on HDG 105° heading to the beach line after the High Bridge.',
    'Which altitude and airspeed is your initial climb after turning at the High Bridge?', '2,500\' MSL · 180 KIAS', ['5,500\' MSL · 240 KIAS', '2,500\' MSL · 200 KIAS', '1,000\' MSL · 200 KIAS']),
  q('KNGP → Mustang', 'Routes', 'You were directed by Tower to Corpus Departure and are now switching, bound for Area 3.',
    'What do you say on CH 8 in your check-in?', '"500 feet off Navy Corpus, Mustang South"', ['"500 feet off Navy Corpus, Mustang North"', '"500 feet off Navy Corpus, Mustang 3 Low"', '"500 feet off Navy Corpus, Foxtrot"']),
  q('KNGP → Mustang', 'Routes', 'You crossed the beach line bound for Mustang Area 4.',
    'How do you proceed after crossing?', 'Turn south, parallel the beach line at ½ WTD, climb to 5,500\' MSL', ['Turn north, parallel the beach line at ½ WTD, climb to 5,500\' MSL', 'Turn south, parallel the beach line at ½ WTD, climb to 2,500\' MSL', 'Continue east to the area at 2,500\' MSL']),
  q('KNGP → Mustang', 'Routes', 'You are departing RWY 36 on the beach line departure toward Mustang.',
    'What should you use extreme caution for?', 'Recovery traffic inbound from PT Shamrock at 1,000\' MSL', ['Formation traffic in Mustang Central at 6,500\'', 'Para-jumping near Mustang Beach', 'Goliad traffic at 2,500\' MSL']),

  // KNGP -> KINGS 4
  q('KNGP → KINGS 4', 'Routes', 'You are about to taxi for a KINGS 4 flight from the Kilo line.',
    'Before taxi, what do you ask Navy Corpus Clearance (CH 2) for?', 'A ZOMBIE 1 on request', ['A VFR squawk and ATIS', 'A KINGS 4 MOA clearance', 'Flight following with Houston Center']),
  q('KNGP → KINGS 4', 'Routes', 'You are airborne from KNGP past 500 ft MSL and Tower has directed you to Corpus Departure.',
    'What is your check-in call?', '"500 feet off Navy Corpus, KINGS 4"', ['"500 feet off Navy Corpus, Mustang North"', '"Passing 500 feet, working KINGS 4"', '"500 feet off Navy Corpus, Rusty"']),
  q('KNGP → KINGS 4', 'Routes', 'You departed RWY 31L on the Rusty departure and are clear of the pattern.',
    'Which course do you fly direct to PT Rusty?', '~350°', ['~010°', '~015°', '~105°']),
  q('KNGP → KINGS 4', 'Routes', 'You were cleared on course by Corpus Approach on the Rusty departure.',
    'What altitude and airspeed do you climb to and maintain up to Point Rusty?', '5,500\' MSL · 240 KIAS', ['2,500\' MSL · 240 KIAS', '14,500\' MSL · 240 KIAS', '5,500\' MSL · 200 KIAS']),
  q('KNGP → KINGS 4', 'Routes', 'You are crossing Point Rusty bound for KINGS 4.',
    'What do you do at Point Rusty?', 'Turn right toward Bayside (~360°) and climb to 14,500\' MSL', ['Turn left toward Woodsboro and climb to 14,500\' MSL', 'Turn right toward Bayside and climb to 5,500\' MSL', 'Continue direct and climb to 15,000\' MSL']),
  q('KNGP → KINGS 4', 'Routes', 'Corpus Departure directs you to contact Houston Center as you proceed to KINGS 4.',
    'Which frequency do you contact?', 'VHF CH 22', ['VHF CH 23', 'UHF CH 6', 'UHF CH 20']),

  // KNGP -> Foxtrot
  q('KNGP → Foxtrot', 'Routes', 'You crossed the beach line on the beach line departure bound for Fox 1.',
    'Which way do you turn and how do you proceed?', 'North, parallel the beach line at ½ WTD and 240 KIAS, climb to 5,500\' MSL', ['South, parallel the beach line at ½ WTD and 240 KIAS, climb to 5,500\' MSL', 'North, parallel the beach line at ½ WTD and 240 KIAS, climb to 2,500\' MSL', 'Continue east to Foxtrot at 2,500\' MSL']),
  q('KNGP → Foxtrot', 'Routes', 'You are approaching the southern boundary of Foxtrot and have not yet deconflicted.',
    'What heading do you fly to remain clear of the lateral boundaries?', '~055°', ['~105°', '~035°', '~360°']),
  q('KNGP → Foxtrot', 'Routes', 'You are approaching Foxtrot and have terminated with Corpus Approach.',
    'Which frequency do you switch to for advisories and area coordination?', 'Foxtrot Common, CH 22', ['Central Common, CH 18', 'KINGS 4 Common, CH 20', 'Corpus Approach, CH 17']),

  // Mustang reference
  q('Mustang', 'Reference', 'You are a solo student planning your working area in Mustang.',
    'Which areas may you use?', 'Areas 1, 2, 3 and 4 only', ['Areas 1 through 6', 'Areas 1, 3, 5 and 7', 'Central only']),
  q('Mustang', 'Reference', 'Para-jumping is in effect at Mustang Beach Airport and you are working below 11,500\' MSL.',
    'How close may you get to KRAS?', 'No closer than 3 NM', ['No closer than 1 NM', 'No closer than 2 NM', 'No closer than 5 NM']),
  q('Mustang', 'Reference', 'You want to practice aerobatics, spins and stalls in the Mustang areas.',
    'Where are they prohibited?', 'West of the beach line', ['East of the beach line', 'Below 11,500\' MSL', 'North of Port Royal']),
  q('Mustang', 'Reference', 'You are southbound paralleling the beach line at 5,500\' MSL bound for Area 7.',
    'What point do you use to request the switch to CH 17?', 'Abeam Padre Balli Park', ['Abeam Mustang Beach', 'Abeam the High Bridge', 'Passing Port Royal']),
  q('Mustang', 'Reference', 'You are cleared into Mustang Central and arriving at your altitude.',
    'Which frequency do you auto-switch to and self-announce on?', 'CH 18', ['CH 17', 'CH 8', 'CH 22']),
  q('Mustang', 'Reference', 'You are north of the Mustang Beach abeam point bound for Area 6.',
    'How do you turn into your area?', 'Turn away from the beach toward your assigned area', ['Turn toward the beach toward your assigned area', 'Continue straight until under the area', 'Climb 270° before turning in']),

  // Foxtrot reference
  q('Foxtrot', 'Reference', 'You are claiming the high block in Fox 2 on CH 22.',
    'What altitudes does the high block cover?', '13,000–17,999 ft MSL', ['7,000–11,999 ft MSL', '4,000–5,999 ft MSL', '12,000–12,999 ft MSL']),
  q('Foxtrot', 'Reference', 'You are leaving the Foxtrot low block southbound and need a transition altitude.',
    'What is the low transition altitude for south/west flight?', '6,200\' MSL', ['6,700\' MSL', '12,200\' MSL', '12,700\' MSL']),
  q('Foxtrot', 'Reference', 'You want flight following from Houston Center while working in Foxtrot.',
    'What must you do to get it?', 'Explicitly request it (VHF CH 22 or CH 23)', ['Nothing, it is automatic', 'Check in on CH 22', 'Call Corpus Approach on CH 17']),

  // KINGS 4 reference
  q('KINGS 4', 'Reference', 'You are inbound to Area 2 High and approaching the MOA boundary.',
    'What altitude must you be at and cleared before entering?', '14,500\' MSL, cleared by Houston', ['14,700\' MSL, cleared by Corpus Departure', '15,000\' MSL, cleared by Houston', '9,000\' MSL, cleared by Houston']),
  q('KINGS 4', 'Reference', 'You are inside the MOA for Area 3 High, a border area.',
    'How do you get into your block?', 'Climb directly into the claimed area', ['Stop at the 14,700\' transition altitude first', 'Stop at the 14,200\' transition altitude first', 'Remain at 14,500\' MSL']),
  q('KINGS 4', 'Reference', 'You are westbound inside the MOA bound for Area 4 Low.',
    'What transition altitude do you use?', '14,200\' MSL', ['14,700\' MSL', '14,500\' MSL', '15,000\' MSL']),
  q('KINGS 4', 'Reference', 'Houston has cleared you into KINGS 4 for Area 7 High.',
    'Which frequency do you use to ask who is working the area?', 'KINGS 4 Common, CH 20', ['Foxtrot Common, CH 22', 'Corpus Approach, CH 17', 'Central Common, CH 18']),
  q('KINGS 4', 'Reference', 'You are transiting KINGS 4 between Goliad and the MOA.',
    'Which area is transit only and never assigned?', 'Area 5 Low', ['Area 1 High', 'Area 9 Low', 'Area 6 Low']),
  q('KINGS 4', 'Reference', 'You are working in KINGS 4 and need extra climb or a weather deviation.',
    'How do you climb?', 'Paralleling the eastern MOA boundary, and advise ATC', ['Over Randolph 1A/1B MOA', 'Paralleling the western MOA boundary', 'Straight ahead without advising ATC']),
  q('KINGS 4', 'Reference', 'You are working a block in KINGS 4.',
    'Which altimeter setting do you use?', 'ATC-supplied', ['KNGP ATIS', 'Standard 29.92', 'Last Corpus Approach setting']),
];

