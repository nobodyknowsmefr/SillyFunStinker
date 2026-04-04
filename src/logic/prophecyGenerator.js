/**
 * Prophecy Generator — produces authored, rule-based fortunes
 * derived from the actual necklace sequence.
 */

import seedrandom from 'seedrandom';
import { getStarPosition, analyzeRegions, detectPatterns } from './sequenceGenerator';

// Color meanings
const COLOR_MEANINGS = {
  red: { domain: 'passion', themes: [
    'courage', 'fire', 'bold action', 'fierce loyalty', 'raw audacity', 'unfiltered nerve',
    'stubbornness disguised as bravery', 'a heartbeat that refuses to slow down',
    'the energy of someone who double-texts without hesitation',
    'the confidence of a man who parallel parks on the first try',
  ]},
  blue: { domain: 'wisdom', themes: [
    'depth', 'clarity', 'calm knowing', 'oceanic patience', 'the quiet flex of understanding',
    'big brain energy with no explanation needed', 'silent genius behavior',
    'the peace of someone who already knows the answer', 'knowledge that arrived without studying',
    'the stillness of a person who has seen the spreadsheet', 'an inner knowing that cannot be googled',
  ]},
  green: { domain: 'abundance', themes: [
    'growth', 'harvest', 'flourishing', 'quiet wealth', 'money moving in your direction for unclear reasons',
    'financial situations resolving themselves', 'bags appearing from unexpected coordinates',
    'a bank account that heals itself', 'generational wealth energy on a personal level',
    'the kind of growth that makes your lil enemies recalibrate', 'silent abundance with no announcement',
  ]},
  yellow: { domain: 'fortune', themes: [
    'luck', 'golden timing', 'bright arrivals', 'cosmic favor', 'main character timing',
    'everything landing exactly when it should', 'divine scheduling at its finest',
    'the universe personally handling your calendar', 'luck so specific it feels intentional',
    'coincidences that are clearly not coincidences', 'a golden window opening right on time',
  ]},
  purple: { domain: 'mastery', themes: [
    'rare skill', 'secret knowledge', 'ancient technique', 'niche royalty',
    'an expertise so specific it has no competition', 'quiet dominance in a field nobody expected',
    'the energy of someone who has been practicing in private', 'elite understanding of obscure systems',
    'mastery that looks effortless because it was earned', 'a skill tree that nobody else even found',
    'knowledge that would be classified if the government knew about it',
  ]},
  orange: { domain: 'transformation', themes: [
    'unexpected change', 'strange upgrades', 'wonderful mutation', 'beneficial chaos',
    'a glow-up so aggressive your old photos feel nervous', 'reinvention at an unreasonable pace',
    'the kind of transformation that makes people ask what happened', 'evolution without permission',
    'a shift so clean it rewrites the timeline', 'change arriving like a software update you did not request',
    'becoming someone your past self would not recognize at a party',
  ]},
};

// Shape type meanings
const TYPE_MEANINGS = {
  cube: 'structure and certainty',
  round: 'flow and possibility',
  star: 'singular destiny',
};

// Star position categories
const STAR_POSITION_MEANING = {
  early: 'Your destiny announces itself immediately. No subtlety. It simply arrives.',
  middle: 'Your fate is patient. It waits at the center, gathering strength from all directions.',
  late: 'Your fortune is a slow reveal. The best part has been saved for the very end.',
};

// Prophecy templates by category
const PROPHECY_TEMPLATES = {
  abundance: [
    'A deeply unnecessary amount of {thing} is quietly making its way toward you.',
    'You will receive {number} {thing} from a source that cannot be explained by conventional logistics.',
    'An abundance of {thing} will enter your life. You did not ask for it. It chose you.',
    'Somewhere, a warehouse of {thing} has your name on it. Literally.',
    '{number} separate instances of unexpected {thing} are scheduled for your near future.',
    'The shapes confirm: {thing} is being routed to your coordinates as we speak.',
    'Your {thing} reserves are about to triple. The math checks out.',
    'A {adj} surplus of {thing} will arrive and you will have no choice but to accept it.',
    'Someone you barely know is about to hand you {number} {thing} and walk away without explanation.',
    'The universe has been stockpiling {thing} for you. The shipment drops soon.',
    '{thing} will appear in your life at a rate that concerns your neighbors.',
    'You are about to receive {thing} in bulk. There is no return policy on cosmic gifts.',
    'A {adj} quantity of {thing} is en route. Clear some shelf space.',
    'The pipeline of {thing} flowing toward you cannot be stopped by human means.',
    'Your supply of {thing} is about to become {adj}. Budget accordingly.',
    '{number} units of {thing} are converging on your location from different time zones.',
    'An unreasonable amount of {thing} has been earmarked for your enjoyment.',
    'The shapes have allocated {number} {thing} to your account. No appeals.',
  ],
  inheritance: [
    'You will inherit {number} {thing} and become a great {thing} master.',
    'A distant relative you have never met will leave you their entire collection of {thing}.',
    'You are the rightful heir to a {adj} kingdom of {thing}. The paperwork is being processed.',
    'An inheritance of {thing} is traveling toward you at the speed of bureaucracy.',
    'A stranger will bequeath you {number} {thing} in a will you didn\'t know existed.',
    'An old family chest contains {thing} that was always meant for you specifically.',
    'Someone is about to pass down their life\'s work in {thing} and you are the chosen recipient.',
    'A {adj} inheritance involving {thing} and a notarized letter is in transit.',
    'You are next in line for a legacy of {thing} that spans {number} generations.',
    'A sealed envelope containing the deed to {number} {thing} will arrive by Thursday.',
    'An ancestor you never met invested heavily in {thing}. The dividends are yours.',
    'The estate of a mysterious benefactor contains exactly {number} {thing} with your name on them.',
    'A {adj} lineage of {thing} collectors has selected you as the final heir.',
    'You will receive a key to a storage unit containing nothing but {thing}.',
    'A trust fund made entirely of {thing} has matured. Check your mail.',
  ],
  mastery: [
    'You will be recognized for a talent nobody else had the courage to develop.',
    'A {adj} skill you didn\'t know you had will surface and become your defining trait.',
    'You will master the art of {thing} so thoroughly that a small committee will form to study you.',
    'Your expertise in {thing} will become legendary in at least {number} communities.',
    'A dormant talent is waking up inside you. It involves {thing} and it cannot be stopped.',
    'Within {number} days you will perform something so skilled that witnesses will question reality.',
    'You will become the foremost authority on {thing} in your entire zip code.',
    'A {adj} level of competence in {thing} is about to reveal itself through your hands.',
    'People will travel to learn your technique. They will bring {thing} as tribute.',
    'Your skill with {thing} will become a topic of academic study in {number} institutions.',
    'You are {number} hours of practice away from unlocking a {adj} ability.',
    'A secret talent for {thing} is about to surface and it will be deeply unsettling to your peers.',
    'You will develop a method so effective that {number} people will try to replicate it and fail.',
    'Your hands were built for {thing}. The shapes have confirmed this at the molecular level.',
    'The shapes detect mastery-grade potential in you. It has been dormant for {number} years.',
    'A {adj} proficiency is being compiled. Do not interrupt the process.',
    'You will casually do something with {thing} that takes most people {number} attempts.',
  ],
  discovery: [
    'You will discover a niche kingdom and somehow be accepted by it immediately.',
    'A {adj} discovery awaits you in an unexpected location. Possibly a drawer.',
    'You will find {thing} in a place where {thing} has no business being.',
    'An entirely new category of {thing} will reveal itself to you before the season ends.',
    'You are about to stumble upon {thing} in circumstances that defy explanation.',
    'A hidden room in your life contains {number} {thing} you never noticed.',
    'The shapes reveal a {adj} find involving {thing} and a location you walk past daily.',
    'You will discover {thing} behind something you have owned for {number} years.',
    'A pocket of {thing} exists where nobody thought to look. You will look there.',
    'Within {number} days you will find something {adj} that was hiding in plain sight.',
    'A {adj} discovery will present itself so obviously you\'ll wonder how everyone else missed it.',
    'You are {number} steps away from finding {thing} in a place that makes no geographic sense.',
    'Something {adj} is waiting under a surface you interact with daily.',
    'The shapes have flagged a previously unknown deposit of {thing} in your general vicinity.',
    'You will uncover {thing} during a routine activity and it will change your week.',
    'A {adj} revelation involving {thing} is disguised as an ordinary Tuesday.',
    'You will open something mundane and find {number} {thing} inside. Do not panic.',
  ],
  transformation: [
    'A wonderful and statistically strange transformation is already underway.',
    'Something {adj} is about to shift in your favor. The shapes have confirmed it.',
    'You are {number} days away from a {adj} change that will improve everything by at least 40%.',
    'Your life is about to undergo a {adj} upgrade that was not in the original plan.',
    'A structural revision of {adj} proportions is being processed. Estimated completion: {number} days.',
    'Something you thought was permanent is about to change in a {adj} way.',
    'The shapes indicate a {adj} metamorphosis involving {thing} and better outcomes.',
    'You are currently in a transitional holding pattern. What follows will be {adj}.',
    'A before-and-after of your life is being prepared. The after is {adj}.',
    'Within {number} days a {adj} shift will occur and your trajectory will adjust upward.',
    'The old version of you has been deprecated. The update is {adj}.',
    'Something involving {thing} will catalyze a change so {adj} that people will stare.',
    'You are about to change direction so completely that prior documentation becomes irrelevant.',
    'The shapes detect a {adj} evolution in progress. Do not resist it.',
    'A transformation involving {thing} will occur at {adj} speed with no warning.',
    'Your current situation is a rough draft. The final version is {adj}.',
    'In {number} days you will look back at today and not recognize the gap.',
    'Something {adj} is rearranging itself in your favor while you sleep.',
  ],
  lucky_nonsense: [
    'A bird will land near you soon and it will mean something. We cannot say what.',
    'You will find exactly {number} coins in your next load of laundry. This is significant.',
    'A {adj} coincidence involving {thing} will occur within {number} days. Prepare accordingly.',
    'The shapes indicate that your next Tuesday will be uncommonly {adj}.',
    'Something involving {thing} and the number {number} will become important. Do not question it.',
    'You will be in the right place at the right time. The shapes are very specific about this.',
    'A stranger will say something to you about {thing} and it will be weirdly relevant.',
    'The number {number} will appear {number} times this week. Keep a tally.',
    'Someone will hand you {thing} unprompted. Accept it. Ask nothing.',
    'You will witness something {adj} involving {thing} and a drainage system.',
    'A notification you receive at exactly {number} o\'clock will change your afternoon.',
    'The shapes predict a {adj} encounter with {thing} near a body of water.',
    'You will sign exactly {number} documents this month and each one will carry weight.',
    'A {adj} event involving {thing} and a person in beige will occur this month.',
    'Something {adj} will happen to your left within {number} hours. Stay alert.',
    '{thing} will arrive in a context so unexpected that you will text someone about it.',
    'The shapes have identified a {adj} window of opportunity involving {thing}. It opens soon.',
    'You will overhear a conversation about {thing} that is somehow about you.',
    'A sequence of {number} minor {adj} events will cascade into something enormous.',
    'You will receive {thing} from a direction that is not on any compass.',
    'The shapes insist that {thing} and the color blue will intersect in your life within {number} days.',
    'A municipal notice will arrive at your address. The shapes say this matters.',
    'You will remember something about {thing} at the exact moment it becomes useful.',
    'The shapes have reviewed your records and they are {adj} about what comes next.',
  ],
  momentum: [
    'Something you started {number} days ago is about to pay off in a {adj} way.',
    'The momentum building around {thing} in your life is about to become visible.',
    'You have been accelerating quietly and the shapes have noticed.',
    'A {adj} chain reaction involving {thing} has already been triggered by your last decision.',
    'You are closer than you think. The shapes measured and it is approximately {number} steps.',
    'The compound interest on your efforts is about to hit. The returns will be {adj}.',
    'Everything you did last month is about to stack up in a {adj} avalanche of results.',
    'A process you initiated {number} days ago has exceeded its original scope considerably.',
    'Your trajectory is {adj}. Maintain heading.',
    'The shapes detect forward motion at a rate that is frankly {adj}.',
    'Something you forgot you planted is about to bloom. It involves {thing}.',
    '{number} small wins are about to collapse into one {adj} breakthrough.',
    'The dominos you set up are about to fall. The last one knocks over {thing}.',
    'A {adj} flywheel of {thing} has been spinning up in the background of your life.',
    'Your quiet consistency has been logged. The payout is {adj}.',
  ],
  protection: [
    'Something you narrowly avoided last week was worse than you thought. The shapes had your back.',
    'A {adj} shield of {thing} is forming around your plans. Nothing can penetrate it.',
    'You dodged something on a Tuesday and didn\'t even notice. The shapes did.',
    'An obstacle involving {thing} will dissolve before you reach it.',
    'The shapes have placed a {adj} buffer around your next {number} decisions.',
    'Someone tried to send negative energy your way and it bounced. The shapes confirmed.',
    'A situation involving {thing} will resolve itself before you have to lift a finger.',
    '{number} potential problems have been quietly removed from your path.',
    'Your luck is defended by forces that are frankly {adj}.',
    'The shapes have rerouted {thing} away from your timeline. You\'re welcome.',
    'A {adj} forcefield of good timing is protecting your next move.',
    'Whatever could go wrong with {thing} has been preemptively handled.',
    'The shapes detect zero threats in your immediate future. Proceed with {adj} confidence.',
    'Something {adj} almost happened to your plans but didn\'t. You\'ll never know how close it was.',
  ],
  connection: [
    'Someone you haven\'t thought about in {number} days is about to reappear with {thing}.',
    'A {adj} connection involving {thing} and a person wearing something memorable is forming.',
    'You will meet someone who understands {thing} at the same {adj} level you do.',
    'A conversation about {thing} will lead to something none of the participants expected.',
    'Someone in your {number}-person radius has {thing} and is looking for exactly you.',
    'The shapes have matched you with a {adj} collaborator. Arrival: {number} days.',
    'A person you see regularly has been carrying {thing} meant for you this entire time.',
    'Within {number} days, a {adj} link will form between you and someone who deals in {thing}.',
    'The shapes say someone is about to enter your situation with {adj} precision.',
    'A mutual interest in {thing} will create a bond that alters your trajectory.',
    'You will receive an invitation from someone who has been observing your {adj} energy.',
    'Someone with exactly {number} {thing} is going to need your specific help.',
    'A {adj} alliance is about to form. It involves {thing} and lasts longer than expected.',
    'The shapes have noticed someone thinking about you. Their intentions are {adj}.',
  ],
};

const ADJECTIVES = [
  // deadpan technical
  'statistically improbable', 'genuinely remarkable', 'cosmically aligned',
  'mathematically perfect', 'clinically precise', 'structurally flawless',
  'frighteningly accurate', 'unnecessarily powerful', 'surgically precise',
  'geometrically inevitable', 'unreasonably specific', 'bureaucratically flawless',
  'gravitationally significant', 'thermally optimal', 'fundamentally unmatched',
  'chronologically perfect', 'cartographically impossible', 'molecularly aligned',
  'algorithmically inevitable', 'cryptographically secure', 'logarithmically scaled',
  'hydraulically smooth', 'tectonically shifting', 'barometrically favorable',
  'seismically relevant', 'topographically unique', 'dimensionally rare',
  'acoustically pristine', 'geographically suspicious', 'metabolically gifted',
  // institutional / bureaucratic
  'enterprise-grade', 'military-spec', 'medical-grade', 'aerospace-tier',
  'museum-quality', 'archive-worthy', 'peer-reviewed', 'ISO-certified',
  'platinum-tier', 'load-bearing', 'code-compliant', 'inspector-approved',
  'federally recognized', 'commercially viable', 'structurally sound',
  'zoning-approved', 'up to specification', 'within tolerance',
  // flat emotional / tonal
  'deeply suburban', 'passively dominant', 'ancestrally approved',
  'generationally significant', 'culturally load-bearing', 'historically dense',
  'spiritually hydraulic', 'psychologically bulletproof', 'socially frictionless',
  'divinely unbothered', 'extremely inevitable', 'lil magnificent',
  'quietly permanent', 'profoundly ordinary', 'aggressively neutral',
  'terminally calm', 'eerily stable', 'suspiciously functional',
  'uncomfortably accurate', 'disturbingly efficient', 'unreasonably durable',
  'oppressively consistent', 'relentlessly adequate', 'violently mundane',
  'strategically boring', 'deceptively load-bearing', 'quietly structural',
  'atmospherically dense', 'emotionally galvanized', 'infrastructurally critical',
  'operationally flawless', 'procedurally airtight', 'thermodynamically sound',
  'legislatively binding', 'contractually obligated', 'notarized',
];

const THINGS = [
  // materials & objects — just stuff that exists
  'copper wire', 'sheet metal', 'gravel', 'drywall', 'rebar',
  'ceramic tile', 'insulation foam', 'brake fluid', 'motor oil', 'transmission parts',
  'lumber', 'concrete mix', 'zip ties', 'duct tape', 'extension cords',
  'printer toner', 'fluorescent tubes', 'filing cabinets', 'carbon paper', 'fax machines',
  'thermal paste', 'solder', 'capacitors', 'resistors', 'ethernet cables',
  'rubber gaskets', 'ball bearings', 'hex bolts', 'washers', 'caulk',
  // mundane life things
  'parking permits', 'lease agreements', 'insurance claims', 'tax returns',
  'credit reports', 'utility bills', 'voicemails', 'email threads',
  'grocery receipts', 'expired coupons', 'appointment reminders', 'tracking numbers',
  'passwords you wrote down somewhere', 'old phone chargers', 'spare keys',
  'manila envelopes', 'certified letters', 'direct deposits', 'wire transfers',
  'routing numbers', 'account statements', 'notarized documents', 'postage stamps',
  // food — just regular food
  'white rice', 'canned beans', 'frozen vegetables', 'plain yogurt', 'wheat bread',
  'instant noodles', 'tap water', 'black coffee', 'table salt', 'vegetable oil',
  'flour', 'sugar packets', 'condensed milk', 'ground beef', 'boxed cereal',
  // nature & weather
  'topsoil', 'creek water', 'limestone', 'sandstone', 'clay',
  'pine needles', 'moss', 'bark', 'river silt', 'morning dew',
  'overcast skies', 'crosswinds', 'barometric pressure', 'tidal patterns', 'sediment',
  // infrastructure
  'traffic patterns', 'zoning permits', 'property lines', 'survey markers',
  'drainage systems', 'load-bearing walls', 'foundation cracks', 'roof shingles',
  'ventilation ducts', 'circuit breakers', 'water meters', 'gas lines',
  'municipal codes', 'building inspections', 'easement rights', 'deed transfers',
  // systems & processes
  'spreadsheets', 'databases', 'server logs', 'firmware updates',
  'patch notes', 'error codes', 'diagnostic reports', 'calibration settings',
  'inventory counts', 'shipping manifests', 'purchase orders', 'invoices',
  'work orders', 'compliance audits', 'quality checks', 'batch numbers',
];

const NUMBERS = [3, 7, 12, 14, 42, 88, 103, 256, 400, 777, 1200, 14000,
  2, 5, 9, 11, 13, 17, 23, 33, 44, 69, 99, 108, 144, 212, 333, 404, 808, 999, 1111, 2500, 5000, 10000];

/**
 * Pick a random element from an array using seeded RNG.
 */
function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Fill a template string with random values.
 */
function fillTemplate(template, rng) {
  return template
    .replace(/\{adj\}/g, () => pick(ADJECTIVES, rng))
    .replace(/\{thing\}/g, () => pick(THINGS, rng))
    .replace(/\{number\}/g, () => pick(NUMBERS, rng));
}

/**
 * Determine the dominant color in a region.
 */
function dominantColor(beads) {
  const counts = {};
  for (const b of beads) {
    counts[b.color] = (counts[b.color] || 0) + 1;
  }
  let max = 0, dom = 'yellow';
  for (const [color, count] of Object.entries(counts)) {
    if (count > max) { max = count; dom = color; }
  }
  return dom;
}

/**
 * Determine dominant type in a region.
 */
function dominantType(beads) {
  const counts = {};
  for (const b of beads) {
    counts[b.type] = (counts[b.type] || 0) + 1;
  }
  let max = 0, dom = 'cube';
  for (const [type, count] of Object.entries(counts)) {
    if (count > max) { max = count; dom = type; }
  }
  return dom;
}

/**
 * Select prophecy categories based on sequence analysis.
 */
function selectCategories(sequence, rng) {
  const regions = analyzeRegions(sequence);
  const patterns = detectPatterns(sequence);
  const starPos = getStarPosition(sequence);

  const openColor = dominantColor(regions.opening);
  const midColor = dominantColor(regions.midpoint);
  const endColor = dominantColor(regions.ending);

  // Map colors to primary categories
  const colorCategoryMap = {
    red: 'mastery',
    blue: 'discovery',
    green: 'abundance',
    yellow: 'lucky_nonsense',
    purple: 'momentum',
    orange: 'transformation',
  };

  // Secondary map for even more variety
  const colorSecondaryMap = {
    red: 'protection',
    blue: 'connection',
    green: 'inheritance',
    yellow: 'momentum',
    purple: 'protection',
    orange: 'connection',
  };

  const allCategoryKeys = Object.keys(PROPHECY_TEMPLATES);

  const categories = new Set();
  categories.add(colorCategoryMap[openColor]);
  categories.add(colorCategoryMap[endColor]);

  // Adjacent same-color pairs suggest inheritance
  if (patterns.adjacentSameColor.length >= 3) {
    categories.add('inheritance');
  }

  // Adjacent same-type pairs suggest transformation
  if (patterns.adjacentSameType.length >= 4) {
    categories.add('transformation');
  }

  // Secondary color categories for variety
  categories.add(colorSecondaryMap[midColor]);

  // Always include at least lucky_nonsense for flavor
  if (categories.size < 3) {
    categories.add('lucky_nonsense');
  }

  // Mid-region color adds flavor
  categories.add(colorCategoryMap[midColor]);

  // Add a random wildcard category for unpredictability
  categories.add(allCategoryKeys[Math.floor(rng() * allCategoryKeys.length)]);

  return Array.from(categories);
}

/**
 * Generate a full prophecy from a necklace sequence.
 * @param {Array} sequence — the ordered bead array
 * @param {string} seed — the sequence seed for deterministic prophecy
 * @returns {{ lines: string[], starMeaning: string, dominantDomain: string }}
 */
export function generateProphecy(sequence, seed) {
  const rng = seedrandom('prophecy-' + seed);

  const categories = selectCategories(sequence, rng);
  const starPos = getStarPosition(sequence);
  const regions = analyzeRegions(sequence);

  // Star position meaning
  let starZone = 'middle';
  if (starPos < 8) starZone = 'early';
  else if (starPos >= 17) starZone = 'late';
  const starMeaning = STAR_POSITION_MEANING[starZone];

  // Opening interpretation based on dominant color
  const openDom = dominantColor(regions.opening);
  const openMeaning = COLOR_MEANINGS[openDom];

  // Pick 2-4 prophecy lines from different categories
  const numLines = 2 + Math.floor(rng() * 3); // 2 to 4
  const lines = [];
  const usedCategories = [...categories];

  // First line: always grounded in the opening color domain
  const chosenTheme = pick(openMeaning.themes, rng);
  const openingLine = `The shapes speak of ${openMeaning.domain}. ${chosenTheme.charAt(0).toUpperCase() + chosenTheme.slice(1)} radiates from your arrangement.`;
  lines.push(openingLine);

  // Middle lines from categories
  for (let i = 0; i < numLines - 1 && usedCategories.length > 0; i++) {
    const cat = usedCategories.splice(Math.floor(rng() * usedCategories.length), 1)[0];
    const templates = PROPHECY_TEMPLATES[cat];
    if (templates) {
      lines.push(fillTemplate(pick(templates, rng), rng));
    }
  }

  // Closing line
  lines.push('go on then, nephew...');

  // Dominant domain
  const allColors = sequence.map(b => b.color);
  const colorCounts = {};
  for (const c of allColors) colorCounts[c] = (colorCounts[c] || 0) + 1;
  // Find the color that appears most in specific positions (first + last + star neighbors)
  const keyPositions = [sequence[0], sequence[sequence.length - 1]];
  if (starPos > 0) keyPositions.push(sequence[starPos - 1]);
  if (starPos < sequence.length - 1) keyPositions.push(sequence[starPos + 1]);
  const keyColor = dominantColor(keyPositions);
  const dominantDomain = COLOR_MEANINGS[keyColor].domain;

  return {
    lines,
    starMeaning,
    dominantDomain,
  };
}
