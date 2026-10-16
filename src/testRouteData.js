const GENERAL_SOURCE =
  'COMTRAWINGFOURINST 3710.14 VFR Course Rules Manual, 20 Feb 2025; chapter and printed-page references below.';
const UPDATE_PART_ONE_SOURCE =
  'Course Rules Update Part 1, updated 26 Feb 2026; slide/PDF page references below.';
const UPDATE_PART_TWO_SOURCE =
  'Course Rules Update Part 2, updated 26 Feb 2026; slide/PDF page references below.';

export const KINGS4_HIGH_AREAS = Array.from({ length: 9 }, (_, index) => {
  const area = index + 1;
  return {
    id: String(area),
    label: `Area ${area} High`,
  };
});

export const TEST_ROUTE_BRIEFING = {
  departure: {
    whatHappens: [
      'This example selects the KNGP RUSTY departure for a KINGS 4 MOA sortie. The February 2026 brief describes a “Zombie” flight plan for KNGP MOA activation.',
      'The supplied manual text for Runway 13L states heading 125° until High Bridge, then refers to a route-plate continuation. That continuation is not transcribed here, so this prototype does not draw or infer the rest of the departure path.',
    ],
    headingAltitude: [
      'Runway 13L fragment in the manual: heading 125° until High Bridge. The omitted plate continuation and any tower/ATC instructions must not be inferred from this prototype.',
      'For the KINGS 4 MOA/Zombie transition, the manual continues from Point RUSTY toward Bayside (approximately 360°), then to 14,500 feet MSL and the applicable MOA entry procedure.',
    ],
    radioCalls: [
      {
        label: 'KNGP Ground — south flow, after run-up',
        script:
          '“Navy Corpus Ground, <callsign>, Sierra Run-ups, taxi information <ATIS>, VFR KINGS 4.”',
        source: `${UPDATE_PART_ONE_SOURCE} slide 26.`,
      },
      {
        label: 'Corpus Departure — when directed by Tower',
        script:
          '“Corpus Departure, <callsign>, 500 feet off Navy Corpus, KINGS 4.”',
        source: `${GENERAL_SOURCE} Chapter 2, §2(f), printed page 2-11.`,
      },
    ],
    sources: [
      `${GENERAL_SOURCE} Chapter 2, §2(f), printed page 2-11 (PDF page 24).`,
      `${UPDATE_PART_ONE_SOURCE} slides 26, 46, and 70.`,
    ],
  },
  'kings-4': ({ area }) => ({
    whatHappens: [
      `Selected working area: KINGS 4 Area ${area} High. The source describes nine high blocks; it does not select an assigned working altitude for this sortie.`,
      'Houston Center clearance is required before entering the MOA. Coordinate the working area on KINGS 4 Common and maintain a listening watch with Houston Center.',
      area === '3'
        ? 'Area 3 is a border area. The brief describes different transition-layer handling for border blocks; weather, clearance, and the current authorized procedure determine the actual entry.'
        : 'This prototype contains route-specific extracted details only for Area 3 High. The selected area does not match that test case.',
    ],
    headingAltitude: [
      'The manual gives the KINGS 4 high-block band as 15,000–22,000 feet MSL. This is an area limit, not an assigned altitude.',
      'The update brief says to maintain 14,500 feet MSL until established inside the MOA; the procedure for border blocks differs from other blocks. The prototype does not depict lateral boundaries or a transition path.',
      'The manual specifies the KNGP altimeter setting while operating in KINGS 4.',
    ],
    radioCalls: [
      {
        label: 'KINGS 4 Common — claim the selected block',
        script:
          `“99 KINGS 4, anybody working area ${area} high?” After responses: “99 KINGS 4, <callsign> claims area ${area} high.”`,
        source: `${GENERAL_SOURCE} Chapter 2, §2(j), printed page 2-26.`,
      },
      {
        label: 'MOA frequency coordination',
        script:
          'Coordinate the working area on UHF CH 20 (KINGS 4 Common); monitor VHF CH 22 (Houston Center) for traffic advisories.',
        source: `${UPDATE_PART_ONE_SOURCE} slides 70–71.`,
      },
    ],
    sources: [
      `${GENERAL_SOURCE} Chapter 2, §2(i)–(j), printed pages 2-24–2-26.`,
      `${UPDATE_PART_ONE_SOURCE} slides 68 and 70–71.`,
    ],
  }),
  'goliad-nolf': {
    whatHappens: [
      'Exit KINGS 4 using an authorized exit method. Before leaving the MOA, terminate with Houston Center and state the departing area and intentions on KINGS 4 Common.',
      'For the Goliad transition, the update brief says to switch to KNGT Common after clear of the MOA and below 9,000 feet MSL. Remain outside 5 NM or above 5,000 feet MSL from KNGT while maneuvering to the initial for the runway in use.',
      'The update brief lists normal hours as Monday–Friday, 0800 until RDO departure. The RDO is the final authority for safe and orderly operations. Pattern operations require the RDO and Crash Crew; the RDO determines the runway in use.',
      'Two-way RDO communication is required for pattern entry. If the initial call is not acknowledged before 2 NM from the airfield boundary, the manual requires a discontinued entry. The RDO does not issue a landing clearance.',
      'This test case does not select a touch-and-go, low approach, or full stop; the corresponding pattern event is not generated.',
    ],
    headingAltitude: [
      'KINGS 4 exit routing depends on the authorized exit method and clearance. This prototype does not draw the MOA boundary or an exit track.',
      'Goliad runway/pattern reference values in the update brief: initial/break 1,300 feet MSL; pattern 1,100 feet MSL; Delta 2,300 feet MSL; high key 2,800–3,300 feet MSL; low key 1,800 feet MSL. The RDO and current procedures govern actual operations.',
      'The manual describes entry via a 4 NM initial for the runway in use and says to avoid overflying Berclair.',
    ],
    radioCalls: [
      {
        label: 'Houston Center — terminate MOA sortie',
        script:
          '“Houston Center, <callsign>, Complete KINGS 4, Terminate Goliad.”',
        source: `${GENERAL_SOURCE} Chapter 2, §2(k), printed page 2-28; current wording is also identified in the 2025 change summary.`,
      },
      {
        label: 'KINGS 4 Common — departing the selected work block',
        script:
          '“99 KINGS 4, <callsign> departing area 3 high, Goliad.”',
        source: `${GENERAL_SOURCE} Chapter 2, §2(k), printed page 2-28.`,
      },
      {
        label: 'Goliad RDO — 4 NM initial',
        script: '“Goliad RDO, <callsign>, initial <runway>.”',
        source: `${GENERAL_SOURCE} Chapter 2, §4(a)(7), printed page 2-30.`,
      },
      {
        label: 'Goliad RDO — departing the field',
        script: '“Goliad RDO, <callsign>, departing.”',
        source: `${GENERAL_SOURCE} Chapter 2, §4(a)(12), printed page 2-36.`,
      },
    ],
    sources: [
      `${GENERAL_SOURCE} Chapter 2, §2(k), printed page 2-28; §4(a), printed pages 2-29–2-30 and 2-36.`,
      `${UPDATE_PART_ONE_SOURCE} slides 72–74.`,
      `${UPDATE_PART_TWO_SOURCE} slides 5–6.`,
      'CR2025 Summary of Changes, page 1 (KINGS 4 termination phrase).',
    ],
  },
  arrival: {
    whatHappens: [
      'After the Goliad stop, the manual describes the Goliad departure toward Woodsboro and joining course rules toward Point Shamrock. The Goliad arrival sequence then joins the Northern Arrival.',
      'On the Northern Arrival, the February 2026 brief identifies the 9 Mile Point and Aransas Causeway reporting/descent sequence before continuing to Point Shamrock.',
      'The route display ends at Point Shamrock. The KNGP arrival flow/runway was not specified, so this prototype does not generate a runway-specific KNGP recovery.',
    ],
    headingAltitude: [
      'Goliad departure reference: after clear of pattern/break traffic, the manual describes 2,500 feet MSL and approximately 140° toward Woodsboro, accelerating to 240 KIAS.',
      'Goliad arrival reference: Woodsboro at 2,500 feet MSL (approximately 140°); then approximately 145° to Bayside, 155° to Port Bay Bridge, and 150° to the Aransas Causeway; join the Northern Arrival. The manual says to contact Corpus Approach at Woodsboro on UHF CH 6 and to fly arrivals at 240 KIAS until Point Shamrock unless otherwise noted.',
      'Northern Arrival reference: contact Corpus Approach on UHF CH 8 at 9 Mile Point; the brief states 1,500 feet MSL and 240 KIAS there, descend to 1,000 feet MSL before the Causeway, then proceed to Point Shamrock at 1,000 feet MSL and 240 KIAS.',
      'No KNGP runway entry or final recovery path is generated without the applicable current arrival flow and ATC instructions.',
    ],
    radioCalls: [
      {
        label: 'Corpus Approach — at Woodsboro',
        script:
          'Contact Corpus Approach on UHF CH 6 at Woodsboro and state intentions.',
        source: `${GENERAL_SOURCE} Chapter 2, §5(a)(6), printed page 2-60; ${UPDATE_PART_TWO_SOURCE} slide 98.`,
      },
      {
        label: 'Corpus Approach — Northern Arrival',
        script:
          'Contact Corpus Approach on UHF CH 8 no later than 9 Mile Point.',
        source: `${UPDATE_PART_TWO_SOURCE} slides 102–103.`,
      },
    ],
    sources: [
      `${GENERAL_SOURCE} Chapter 2, §4(a)(12), printed pages 2-36–2-37; §5(a)(6), printed page 2-60.`,
      `${UPDATE_PART_TWO_SOURCE} slides 98–103.`,
    ],
  },
};

export const TEST_ROUTE_SCOPE =
  'Source-derived draft for KNGP Runway 13L → KINGS 4 Area 3 High → NOLF Goliad → KNGP. The 2025 manual and February 2026 update briefs were transcribed for this visual test only; this is not an approved or complete procedure.';
