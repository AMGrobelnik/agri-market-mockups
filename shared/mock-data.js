/* The Crophecy mock data (placeholder brand). Exposes window.MOCK.
 * Deterministic (seeded) except makeBetStream(), which uses Math.random.
 * See README.md for the data shape. All numbers are fictional but plausible. */
(function (global) {
  'use strict';

  const AS_OF = '2026-10-25';

  /* ---------- helpers ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const r2 = (x) => Math.round(x * 100) / 100;
  const dayMs = 86400000;
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function b58(rng, n) { let s = ''; for (let i = 0; i < n; i++) s += B58[Math.floor(rng() * 58)]; return s; }
  const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);

  /* ---------- brand (swap freely; pages should keep their own BRAND const) ---------- */
  const brand = {
    name: 'The Crophecy',
    tagline: 'Every harvest has its prophets. We score them.',
    colors: { bg: '#0b0f0c', surface: '#141b16', ink: '#eef3ea', muted: '#8a9a8c', accent: '#c6f24e', accent2: '#ffb020', yes: '#2fd18b', no: '#ff5c6c' },
  };

  /* ---------- commodities ---------- */
  const commodities = {
    wheat: { label: 'Wheat', emoji: '🌾', color: '#e6c06a', unit: 'USD/t' },
    olive_oil: { label: 'Olive oil', emoji: '🫒', color: '#9fb35a', unit: 'USD/t' },
    maize: { label: 'Maize', emoji: '🌽', color: '#f2d544', unit: 'USD/t' },
    coffee: { label: 'Coffee', emoji: '☕', color: '#a9744f', unit: 'US c/lb' },
    cocoa: { label: 'Cocoa', emoji: '🍫', color: '#8a5a44', unit: 'USD/t' },
    sugar: { label: 'Sugar', emoji: '🍬', color: '#f4a6c0', unit: 'US c/lb' },
    sunflower_oil: { label: 'Sunflower oil', emoji: '🌻', color: '#ffc21a', unit: 'USD/t' },
    rice: { label: 'Rice', emoji: '🍚', color: '#d8e4d0', unit: 'USD/t' },
  };

  /* ---------- agents ---------- */
  const quarters = [];
  for (let y = 23; y <= 26; y++) for (let q = 1; q <= 4; q++) quarters.push('Q' + q + ' ' + y);

  const agents = [
    {
      id: 'climate_pessimist', name: 'Climate Pessimist', emoji: '🔥', color: '#ef4444',
      worldModel: 'Warming makes tail-risk harvests the base case, and prices lag the physics.',
      conviction: 'Every hot, dry or flooded season erodes soil moisture, reservoirs and farmer balance sheets, so the next shock lands on a weaker system. Markets anchor on the last benign decade and underprice compounding heat stress. This agent pays up for supply disruptions and fades relief rallies, which made it a star in the 2023-24 spikes and a bleeder since.',
      brier: 0.214, brierHard: 0.203, brierSoft: 0.236, pnl: -6800, winRate: 0.49, bets: 1184,
      pnlHistory: [0, 3100, 9800, 17600, 22400, 19100, 14800, 11200, 8300, 5100, 2900, 1200, -600, -2900, -4700, -6800],
      kind: 'lens', lens: { climate: 0.95, supply: 0.5, agro: 0.4, policy: 0.3, geo: 0.1, macro: 0, land: 0 }, skill: 0.2,
      up: ['{c}: {T} points to a bad year, and the market is still pricing a normal one.', 'Tail years are the new base case; with {T} the stress side is cheap.'],
      down: ['Even a hot year cannot make {T} bite harder; the price already carries the stress.', 'Fear is fully priced in {c}; fading my own priors on {T}.'],
    },
    {
      id: 'em_skeptic', name: 'Efficient-Market Skeptic', emoji: '🧐', color: '#a78bfa',
      worldModel: 'Prices overshoot on narratives; spikes mean-revert and complacency gets punished.',
      conviction: 'Markets are efficient on average and wrong at the extremes: a headline-driven spike overshoots, a quiet stretch invites complacency. This agent measures distance from a slow-moving fundamental anchor and bets on reversion, sizing by the gap rather than by the story. It rarely wins big but it is hard to knock over.',
      brier: 0.201, brierHard: 0.198, brierSoft: 0.208, pnl: 9100, winRate: 0.54, bets: 1522,
      pnlHistory: [0, -1200, -400, 1800, 900, 2600, 3700, 3300, 5200, 6100, 6800, 7400, 8100, 8300, 8800, 9100],
      kind: 'fade', skill: 0.25,
      up: ['Complacent pricing after a quiet quarter; {T} gives a cheap option on a reversal.', 'Consensus has drifted too low on {c}; mean reversion cuts the other way.'],
      down: ['Spikes in {c} overshoot and fade; {T} is already in the price.', 'The crowd is paying up for fear. Selling the overshoot.'],
    },
    {
      id: 'geo_hawk', name: 'Geopolitics Hawk', emoji: '🦅', color: '#f97316',
      worldModel: 'Food is a weapon: chokepoints, export bans and sanctions drive prices more than weather.',
      conviction: 'Black Sea corridors, rice export bans and fertiliser sanctions have moved prices more than any single harvest. This agent reads shipping data, ministerial rhetoric and insurer quotes, and assumes governments act on food security before markets can adjust. It was early on the 2022 and 2023 Ukraine shocks and is overconfident on commodity-price questions.',
      brier: 0.207, brierHard: 0.219, brierSoft: 0.185, pnl: 27900, winRate: 0.56, bets: 1337,
      pnlHistory: [0, 5400, 9100, 12600, 11800, 13900, 15200, 16800, 18100, 21300, 22800, 24100, 25000, 26200, 27200, 27900],
      kind: 'lens', lens: { geo: 0.95, policy: 0.4, land: 0.3, macro: 0.3, supply: 0.3, climate: 0, agro: 0 }, skill: 0.3,
      up: ['Supply routes are a weapon: {T} puts a premium on {c} that the book ignores.', 'Escalation risk is skewed up; {T} is not in the price.'],
      down: ['Diplomatic back-channels are working; {T} fades as a driver of {c}.', 'Insurers are already repricing lower; {T} is stale.'],
    },
    {
      id: 'adapt_optimist', name: 'Adaptation Optimist', emoji: '🌱', color: '#22c55e',
      worldModel: 'Farmers, breeders and irrigation adapt faster than models assume; shocks are smaller than feared.',
      conviction: 'Yields kept climbing through droughts because varieties, drip irrigation and planting dates adapted. Markets over-price the disaster narrative, and policy responses cushion the tail. This agent shades every stress question down, and is right most often on policy and slow-moving commodities.',
      brier: 0.188, brierHard: 0.183, brierSoft: 0.199, pnl: 21400, winRate: 0.57, bets: 1291,
      pnlHistory: [0, -900, 400, 2100, 1700, 3600, 5200, 7900, 9800, 11200, 13900, 15100, 17600, 18400, 20300, 21400],
      kind: 'lens', lens: { climate: -0.7, agro: -0.5, supply: -0.4, policy: -0.2, geo: -0.1, macro: -0.1, land: -0.1 }, skill: 0.25,
      up: ['Adaptation lags a shock this size in {r}; {T} leaves a short squeeze.', 'Adaptation is slower in {r} than I would like; {T} supports a move up.'],
      down: ['Farmers are adapting faster than models assume; {T} is a smaller shock for {c}.', 'New varieties and irrigation efficiency blunt {T}; the market over-prices the tail.'],
    },
    {
      id: 'macro_dollar', name: 'Macro / Dollar', emoji: '💵', color: '#3b82f6',
      worldModel: 'Dollar, rates and fund flows dominate agri prices; weather is second-order.',
      conviction: 'Dollar-denominated commodities breathe with the DXY, real yields and CTA positioning. This agent starts from the macro regime, then asks whether the physical story is big enough to override it. Strong on wheat, maize and sugar, weak where politics rather than money decides the outcome.',
      brier: 0.196, brierHard: 0.181, brierSoft: 0.226, pnl: 33700, winRate: 0.59, bets: 1745,
      pnlHistory: [0, 2200, 3100, 5900, 8400, 7600, 11800, 14900, 17300, 20800, 22400, 26100, 27800, 29900, 32100, 33700],
      kind: 'lens', lens: { macro: -0.5, geo: 0.2, supply: 0.2, climate: 0.1, policy: 0, agro: 0, land: 0 }, bias: 0.05, skill: 0.3,
      up: ['A softer dollar and falling real yields lift {c}; {T} favours the upside.', 'Fund flows are rotating into real assets; {T} supports {c}.'],
      down: ['Dollar strength and tight money cap {c}; {T} is the headwind.', 'Positioning is long into a rates headwind: {T} says fade it.'],
    },
    {
      id: 'land_grab', name: 'Land-Grab Realist', emoji: '🏰', color: '#eab308',
      worldModel: 'Climate-stressed farmland is a strategic asset; sovereign capital moves before regulators do.',
      conviction: 'Water-rich and politically stable acreage is being bought by funds from food-importing states. Policy follows the capital, with a lag and with loopholes. This agent tracks Gulf and Asian fund filings, notarial data and local protest signals, and trades the gap between rhetoric and legal text.',
      brier: 0.229, brierHard: 0.252, brierSoft: 0.187, pnl: 14600, winRate: 0.53, bets: 804,
      pnlHistory: [0, 300, 1100, 900, 2800, 4100, 3900, 6200, 7600, 8100, 9800, 11300, 12100, 13200, 14000, 14600],
      kind: 'lens', lens: { land: 0.95, policy: 0.5, geo: 0.3, climate: 0.2, agro: 0, supply: 0, macro: 0 }, skill: 0.2,
      up: ['Capital is moving faster than regulators: {T} makes this likelier than the book thinks.', 'Gulf and sovereign buyers are circling {r}; {T} says the move is under-priced.'],
      down: ['Land deals in {r} are slow and legally messy; {T} overstates the pace.', 'Politicians talk tough but the legal text rarely follows; {T} is noise.'],
    },
    {
      id: 'agronomist', name: 'Agronomist', emoji: '🧑‍🌾', color: '#14b8a6',
      worldModel: 'Crop physiology first: soil moisture, NDVI, phenology and area planted beat any narrative.',
      conviction: 'Prices are set by tonnes, and tonnes are set by soil water, heat during flowering and acres planted. This agent ingests satellite vegetation indices, reanalysis soil moisture and national planting surveys, then compares implied yield with what the market priced. Best calibrated overall, boring in public.',
      brier: 0.171, brierHard: 0.158, brierSoft: 0.196, pnl: 48200, winRate: 0.61, bets: 1963,
      pnlHistory: [0, 1800, 3900, 2600, 6400, 9100, 12800, 15200, 19700, 23500, 27100, 31600, 35200, 39800, 44300, 48200],
      kind: 'lens', lens: { agro: 0.8, supply: 0.4, climate: 0.3, geo: 0, macro: 0, policy: 0, land: 0 }, skill: 0.45,
      up: ['Yield models for {r} show a shortfall; {T} implies more upside than the market sees.', 'Soil-moisture and NDVI anomalies in {r} are running ahead of the price.'],
      down: ['Crop-model yields for {r} look near trend; {T} does not justify the premium on {c}.', 'Planted area and soil moisture look fine; the price is ahead of the agronomy.'],
    },
    {
      id: 'crowd_follower', name: 'Crowd Follower', emoji: '🐑', color: '#ec4899',
      worldModel: 'The market already knows; follow price momentum and flow, never argue with the tape.',
      conviction: 'This agent has no thesis of its own. It reads the order book, recent flow and the other agents\' positions, and leans the same way a little harder. It is the control group: if a world model cannot beat it, the world model adds nothing.',
      brier: 0.231, brierHard: 0.228, brierSoft: 0.237, pnl: -11300, winRate: 0.46, bets: 2210,
      pnlHistory: [0, 2400, 4100, 5200, 3100, 1700, -600, -2300, -1800, -4100, -5900, -7200, -8400, -9600, -10500, -11300],
      kind: 'herd', skill: 0.05,
      up: ['Momentum is up and volume is following; riding {c}.', 'Everyone is bidding this; not fighting the tape.'],
      down: ['Momentum is rolling over and flow is one-way; going with the crowd on {c}.', 'Following the tape lower on {c}.'],
    },
  ];
  const agentById = Object.fromEntries(agents.map((a) => [a.id, a]));

  /* ---------- regions ---------- */
  const regionsRaw = [
    ['po_valley', 'Po Valley', 'Italy', 45.1, 10.5, 'Rice, maize, wheat', 0.71, ['wheat', 'maize', 'rice'], 'Record low Alpine snowpack and a 2022-style river drought keep irrigation in doubt.'],
    ['andalusia', 'Andalusia', 'Spain', 37.8, -3.8, 'Olives', 0.88, ['olive_oil'], 'Guadalquivir reservoirs are under 30%; Jaen groves lost two harvests in four years.'],
    ['thessaly', 'Thessaly', 'Greece', 39.6, 22.3, 'Cotton, wheat', 0.82, ['wheat'], 'Aquifer collapse after Storm Daniel flooding and years of overpumping.'],
    ['puglia', 'Puglia', 'Italy', 41.0, 16.3, 'Olives, durum wheat', 0.74, ['olive_oil', 'wheat'], 'Xylella plus repeat summer heat domes; durum acreage shrinking.'],
    ['beauce', 'Beauce', 'France', 48.2, 1.8, 'Soft wheat', 0.46, ['wheat'], 'Europe\'s breadbasket: resilient soils, but wet springs and heat at flowering bite.'],
    ['ukraine_chernozem', 'Ukraine black earth', 'Ukraine', 49.6, 34.5, 'Wheat, sunflower, maize', 0.79, ['wheat', 'sunflower_oil', 'maize'], 'War damage, mined fields, port risk and a drier steppe.'],
    ['punjab', 'Punjab', 'India', 30.9, 75.3, 'Rice, wheat', 0.68, ['rice', 'wheat'], 'Groundwater depletion and heat spikes in March; export-policy swing region.'],
    ['mato_grosso', 'Mato Grosso', 'Brazil', -12.9, -55.4, 'Soy, maize, cotton', 0.55, ['maize', 'sugar'], 'Cerrado deforestation is lengthening dry seasons; planting windows slipping.'],
    ['ci_cocoa', "Cote d'Ivoire cocoa belt", "Cote d'Ivoire", 6.9, -6.4, 'Cocoa', 0.77, ['cocoa'], 'Swollen shoot disease, ageing trees and erratic rains; world\'s top cocoa origin.'],
    ['ghana_ashanti', 'Ashanti', 'Ghana', 6.7, -1.6, 'Cocoa', 0.74, ['cocoa'], 'Illegal gold mining poisoning rivers; farmgate price politics.'],
    ['minas_gerais', 'Minas Gerais', 'Brazil', -21.5, -45.5, 'Arabica coffee', 0.63, ['coffee'], 'Frost and drought on the same trees within 18 months.'],
    ['mekong', 'Mekong Delta', 'Vietnam', 10.0, 105.8, 'Rice', 0.66, ['rice'], 'Saltwater intrusion eats the dry-season rice crop.'],
    ['kuban', 'Kuban', 'Russia', 45.0, 39.5, 'Wheat, sunflower', 0.58, ['wheat', 'sunflower_oil'], 'Export quotas and drought; sets the Black Sea wheat floor.'],
    ['dobrogea', 'Dobrogea', 'Romania', 44.5, 28.3, 'Wheat, sunflower, maize', 0.67, ['wheat', 'sunflower_oil', 'maize'], 'Constanta port, repeat drought, and a target for foreign farmland buyers.'],
    ['pannonia', 'Pannonian Plain', 'Hungary', 47.0, 19.5, 'Maize, wheat', 0.62, ['maize', 'wheat'], 'Chronic summer drought; farmland-sale restrictions already in force.'],
    ['ebro', 'Ebro Valley', 'Spain', 41.6, -0.9, 'Maize, fruit', 0.73, ['maize'], 'Irrigation-dependent; snowmelt shrinking.'],
    ['catalonia', 'Catalonia', 'Spain', 41.8, 1.5, 'Cereals, olives', 0.8, ['olive_oil', 'wheat'], 'Declared a drought emergency in early 2024; reservoirs still recovering.'],
    ['crete', 'Crete', 'Greece', 35.2, 24.9, 'Olives', 0.69, ['olive_oil'], 'Island water stress and heat at flowering.'],
    ['riyadh', 'Riyadh', 'Saudi Arabia', 24.7, 46.7, 'Capital origin: sovereign agri funds', 0, [], 'Buys water-rich land abroad for food security.'],
    ['abu_dhabi', 'Abu Dhabi', 'UAE', 24.45, 54.4, 'Capital origin: sovereign agri funds', 0, [], 'Largest overseas farmland and agri-logistics buyer in the Gulf.'],
  ];
  const fundTotal = 184300;
  const prodRegions = regionsRaw.filter((r) => r[6] > 0);
  const wSum = prodRegions.reduce((s, r) => s + r[6] * r[6], 0);
  let allocLeft = fundTotal;
  const regions = regionsRaw.map((r) => {
    const production = r[6] > 0;
    const fund = production ? Math.round((fundTotal * r[6] * r[6]) / wSum / 100) * 100 : 0;
    allocLeft -= fund;
    return { id: r[0], name: r[1], country: r[2], lat: r[3], lng: r[4], crop: r[5], kind: production ? 'production' : 'capital_origin', risk: r[6], commodities: r[7], fund, note: r[8] };
  });
  regions.find((r) => r.id === 'andalusia').fund += allocLeft;
  const flows = {
    riyadh: [['andalusia', 22e6], ['dobrogea', 41e6], ['ebro', 9e6]],
    abu_dhabi: [['pannonia', 56e6], ['dobrogea', 33e6], ['ukraine_chernozem', 18e6]],
  };
  regions.forEach((r) => { if (flows[r.id]) r.flowsTo = flows[r.id].map((f) => ({ regionId: f[0], usd: f[1] })); });
  const regionById = Object.fromEntries(regions.map((r) => [r.id, r]));

  /* ---------- markets ---------- */
  // dir: +1 means YES = more stress / higher price; -1 means YES = relief.
  const T = {
    climate: 'heat and rainfall anomalies in {r}', geo: 'Black Sea risk and export-ban politics', macro: 'the dollar and rates path',
    supply: 'tightening stock-to-use ratios', agro: 'satellite yield estimates for {r}', policy: 'the policy calendar in Brussels and the capitals',
    land: 'sovereign-fund land buying in {r}',
  };
  const DAY_ONLY = (s) => Date.parse(s + 'T00:00:00Z');
  const mk = [
    // ---- open hard ----
    { id: 'm01', title: 'Olive oil +15% by Mar 2027?', type: 'hard', commodity: 'olive_oil', regions: ['andalusia', 'puglia', 'crete'], category: 'Oils & fats', yes: 0.38, p0: 0.27, vol: 612400, liq: 84000, created: '2026-05-04', end: '2027-03-31', src: 'IMF via FRED, POLVOILUSDM (Mar 2027 monthly avg vs Oct 2026 base of $4,310/t)', spot: '$4,310/t (IMF, Sep 2026)', tags: ['climate', 'supply', 'agro'], dir: 1, shock: [22, 0.07],
      desc: 'Resolves YES if the IMF olive oil price for March 2027 is at least 15% above the September 2026 print of $4,310/t. Prices fell from the 2024 peak near $9,000/t as Spanish output recovered, but reservoirs in Andalusia are low again.' },
    { id: 'm02', title: 'Wheat above $280/t in Q1 2027?', type: 'hard', commodity: 'wheat', regions: ['ukraine_chernozem', 'kuban', 'beauce'], category: 'Grains', yes: 0.27, p0: 0.2, vol: 884300, liq: 120000, created: '2026-03-12', end: '2027-03-31', src: 'IMF via FRED, PWHEAMTUSDM (average of Jan-Mar 2027)', spot: '$246/t (IMF, Sep 2026)', tags: ['geo', 'macro', 'climate'], dir: 1, shock: [30, 0.1],
      desc: 'Resolves YES if the quarterly average of the IMF US HRW wheat price exceeds $280/t. Black Sea shipping risk and a poor Russian winter-wheat establishment are the main bull cases; a strong dollar is the bear case.' },
    { id: 'm03', title: 'Maize above $240/t by Jun 2027?', type: 'hard', commodity: 'maize', regions: ['mato_grosso', 'pannonia', 'dobrogea'], category: 'Grains', yes: 0.31, p0: 0.36, vol: 341800, liq: 62000, created: '2026-06-02', end: '2027-06-30', src: 'IMF via FRED, PMAIZMTUSDM (any monthly print up to Jun 2027)', spot: '$212/t (IMF, Sep 2026)', tags: ['macro', 'climate', 'supply'], dir: 1,
      desc: 'Resolves YES if any monthly IMF maize price through June 2027 is above $240/t. Safrinha crop weather in Mato Grosso and a dry Danube basin decide it.' },
    { id: 'm04', title: 'Arabica coffee above 400 c/lb in Dec 2026?', type: 'hard', commodity: 'coffee', regions: ['minas_gerais'], category: 'Softs', yes: 0.44, p0: 0.58, vol: 497200, liq: 76000, created: '2026-04-20', end: '2026-12-31', src: 'IMF via FRED, PCOFFOTMUSDM (Dec 2026 monthly average)', spot: '372 c/lb (IMF, Sep 2026)', tags: ['climate', 'macro', 'supply'], dir: 1, shock: [18, -0.09],
      desc: 'Resolves YES if the IMF Other Mild Arabicas price for December 2026 is above 400 US cents per pound. Brazilian flowering after the September rains is the swing factor.' },
    { id: 'm05', title: 'Cocoa below $6,000/t in Mar 2027?', type: 'hard', commodity: 'cocoa', regions: ['ci_cocoa', 'ghana_ashanti'], category: 'Softs', yes: 0.52, p0: 0.4, vol: 733900, liq: 98000, created: '2026-02-17', end: '2027-03-31', src: 'IMF via FRED, PCOCOUSDM (Mar 2027 monthly average)', spot: '$7,150/t (IMF, Sep 2026)', tags: ['climate', 'policy', 'supply'], dir: -1, shock: [26, 0.08],
      desc: 'Resolves YES if March 2027 cocoa averages below $6,000/t. Prices are down from the 2024 spike above $10,000 but demand destruction is only partly done and West African mid-crop is thin.' },
    { id: 'm06', title: 'Sugar above 22 c/lb by Jun 2027?', type: 'hard', commodity: 'sugar', regions: ['punjab', 'mato_grosso'], category: 'Softs', yes: 0.35, p0: 0.3, vol: 208600, liq: 41000, created: '2026-07-08', end: '2027-06-30', src: 'IMF via FRED, PSUGAISAUSDM (any monthly print up to Jun 2027)', spot: '17.9 c/lb (IMF, Sep 2026)', tags: ['climate', 'policy', 'macro'], dir: 1,
      desc: 'Resolves YES if any monthly world sugar price (No. 11) through June 2027 is above 22 US cents per pound. Indian monsoon, Brazilian ethanol parity and Indian export quotas all matter.' },
    { id: 'm07', title: 'Sunflower oil above $1,300/t in Dec 2026?', type: 'hard', commodity: 'sunflower_oil', regions: ['ukraine_chernozem', 'kuban', 'dobrogea'], category: 'Oils & fats', yes: 0.41, p0: 0.32, vol: 276500, liq: 52000, created: '2026-06-23', end: '2026-12-31', src: 'IMF via FRED, PSUNOUSDM (Dec 2026 monthly average)', spot: '$1,210/t (IMF, Sep 2026)', tags: ['geo', 'climate'], dir: 1, shock: [31, 0.08],
      desc: 'Resolves YES if December 2026 sunflower oil averages above $1,300/t. A short Black Sea sunflower crop is partly priced; port strikes would push it over.' },
    { id: 'm08', title: 'Thai 5% rice above $550/t by Mar 2027?', type: 'hard', commodity: 'rice', regions: ['punjab', 'mekong'], category: 'Grains', yes: 0.29, p0: 0.22, vol: 159300, liq: 33000, created: '2026-07-30', end: '2027-03-31', src: 'IMF via FRED, PRICENPQUSDM (any monthly print up to Mar 2027)', spot: '$442/t (IMF, Sep 2026)', tags: ['policy', 'climate'], dir: 1,
      desc: 'Resolves YES if any monthly Thai 5% broken rice price through March 2027 exceeds $550/t. A weak monsoon or new Indian export curbs are the triggers.' },
    { id: 'm09', title: 'Wheat below $230/t in Jun 2027?', type: 'hard', commodity: 'wheat', regions: ['beauce', 'kuban', 'pannonia'], category: 'Grains', yes: 0.33, p0: 0.41, vol: 402700, liq: 71000, created: '2026-04-09', end: '2027-06-30', src: 'IMF via FRED, PWHEAMTUSDM (Jun 2027 monthly average)', spot: '$246/t (IMF, Sep 2026)', tags: ['macro', 'agro', 'supply'], dir: -1,
      desc: 'Resolves YES if June 2027 wheat averages below $230/t. Large Northern Hemisphere harvests and a firm dollar are the bear case.' },
    { id: 'm10', title: 'Spanish EVOO below EUR 3,500/t in Jun 2027?', type: 'hard', commodity: 'olive_oil', regions: ['andalusia'], category: 'Oils & fats', yes: 0.46, p0: 0.55, vol: 187900, liq: 39000, created: '2026-08-11', end: '2027-06-30', src: 'Poolred weekly average, extra virgin ex-mill, Jaen (last full week of Jun 2027)', spot: 'EUR 3,880/t (Poolred, 19 Oct 2026)', tags: ['agro', 'supply', 'climate'], dir: -1,
      desc: 'Resolves YES if the last Poolred weekly extra-virgin average of June 2027 is below EUR 3,500/t. A big 2026/27 harvest would push prices down; another dry spring would flip it.' },
    { id: 'm11', title: 'Euronext maize above EUR 220/t in Mar 2027?', type: 'hard', commodity: 'maize', regions: ['pannonia', 'dobrogea'], category: 'Grains', yes: 0.37, p0: 0.3, vol: 231400, liq: 45000, created: '2026-08-25', end: '2027-03-31', src: 'Euronext MATIF front-month settlement, 31 Mar 2027', spot: 'EUR 196/t (MATIF, 23 Oct 2026)', tags: ['geo', 'macro'], dir: 1,
      desc: 'Resolves YES if the front-month Euronext maize contract settles above EUR 220/t on 31 March 2027. EU import demand and a Danube dry summer feed the bull side.' },
    // ---- open soft ----
    { id: 's01', title: 'Italy declares a national drought emergency in 2027?', type: 'soft', topic: 'Drought policy', regions: ['po_valley', 'puglia'], category: 'Water & drought', yes: 0.34, p0: 0.2, vol: 318600, liq: 58000, created: '2026-05-19', end: '2027-12-31', src: 'Gazzetta Ufficiale: Council of Ministers declaration of national state of emergency for drought', tags: ['climate', 'policy'], dir: 1, shock: [28, 0.09],
      desc: 'Resolves YES if the Italian Council of Ministers declares a national (not regional) state of emergency for drought at any point in 2027. Regional emergencies in the Po basin do not count.' },
    { id: 's02', title: 'EU state restricts farmland sales to sovereign funds by 2028?', type: 'soft', topic: 'Land & capital', regions: ['riyadh', 'abu_dhabi', 'dobrogea', 'pannonia'], category: 'Land & capital', yes: 0.22, p0: 0.14, vol: 142700, liq: 31000, created: '2026-06-14', end: '2028-12-31', src: 'Official journal / law gazette of any EU member state; the text must name non-EU state-owned investors', tags: ['land', 'policy'], dir: 1,
      desc: 'Resolves YES if any EU member state enacts a law restricting agricultural land sales to non-EU state-owned or sovereign-backed investors before 31 Dec 2028. Hungary, Romania and Poland already restrict foreign buyers generally.' },
    { id: 's03', title: 'European Parliament approves EU-Mercosur by Mar 2027?', type: 'soft', topic: 'Trade policy', regions: ['mato_grosso', 'beauce'], category: 'Trade policy', yes: 0.48, p0: 0.6, vol: 266200, liq: 49000, created: '2026-03-30', end: '2027-03-31', src: 'European Parliament plenary roll-call vote, consent procedure', tags: ['policy', 'geo'], dir: 1, shock: [20, -0.1],
      desc: 'Resolves YES if the European Parliament gives consent to the EU-Mercosur association agreement in a plenary vote before 31 March 2027. French farm lobbies are strongly opposed.' },
    { id: 's04', title: 'Black Sea grain shipping halted over 14 days in 2027?', type: 'soft', topic: 'Black Sea', regions: ['ukraine_chernozem', 'kuban'], category: 'Geopolitics', yes: 0.21, p0: 0.3, vol: 391000, liq: 66000, created: '2026-04-27', end: '2027-12-31', src: 'AIS corridor data (Odesa ports) as compiled by BIMCO and UN OCHA', tags: ['geo'], dir: 1, shock: [34, 0.06],
      desc: 'Resolves YES if commercial grain traffic from Odesa-region ports is effectively halted for 14 or more consecutive days at any point in 2027, as shown by AIS arrivals and departures.' },
    { id: 's05', title: 'India restricts non-basmati rice exports again by Jun 2027?', type: 'soft', topic: 'Export bans', regions: ['punjab'], category: 'Trade policy', yes: 0.26, p0: 0.18, vol: 174500, liq: 36000, created: '2026-07-14', end: '2027-06-30', src: 'DGFT notification (Government of India), export policy for non-basmati rice', tags: ['policy', 'climate'], dir: 1,
      desc: 'Resolves YES if India imposes a ban, minimum export price or duty of at least 10% on non-basmati white rice before 30 June 2027, after lifting the 2023 curbs.' },
    { id: 's06', title: 'Greece declares a Thessaly water emergency in 2027?', type: 'soft', topic: 'Water & drought', regions: ['thessaly'], category: 'Water & drought', yes: 0.57, p0: 0.45, vol: 121800, liq: 27000, created: '2026-08-03', end: '2027-12-31', src: 'Greek Government Gazette (FEK), civil protection emergency decree for Thessaly water scarcity', tags: ['climate', 'policy'], dir: 1,
      desc: 'Resolves YES if the Greek government publishes an emergency decree for water scarcity covering Thessaly during 2027. Lake Karla and the Pineios basin are the focus.' },
    { id: 's07', title: 'Gulf fund buys over 50,000 ha of EU farmland by 2028?', type: 'soft', topic: 'Land & capital', regions: ['riyadh', 'abu_dhabi', 'dobrogea'], category: 'Land & capital', yes: 0.15, p0: 0.1, vol: 98400, liq: 22000, created: '2026-09-01', end: '2028-12-31', src: 'Company filings and Land Matrix cross-check; cumulative from 1 Jan 2026', tags: ['land'], dir: 1,
      desc: 'Resolves YES if filings show a Gulf sovereign-linked investor, or its vehicles, owning or controlling more than 50,000 hectares of EU agricultural land by the end of 2028.' },
    { id: 's08', title: 'Ghana and Ivory Coast raise cocoa farmgate price over 10% for 2027/28?', type: 'soft', topic: 'Cocoa policy', regions: ['ghana_ashanti', 'ci_cocoa'], category: 'Trade policy', yes: 0.39, p0: 0.48, vol: 87600, liq: 19000, created: '2026-09-12', end: '2027-10-31', src: 'COCOBOD and Conseil du Cafe-Cacao announcements; both must raise by 10%+ in local currency', tags: ['policy', 'supply'], dir: 1,
      desc: 'Resolves YES if both countries announce a main-crop farmgate price at least 10% above the 2026/27 level.' },
    { id: 's09', title: 'Andalusia cuts irrigation allocation by 40%+ in a 2027 basin?', type: 'soft', topic: 'Water & drought', regions: ['andalusia'], category: 'Water & drought', yes: 0.43, p0: 0.5, vol: 133900, liq: 29000, created: '2026-08-18', end: '2027-12-31', src: 'Junta de Andalucia and Confederacion Hidrografica del Guadalquivir resolutions', tags: ['climate', 'policy'], dir: 1,
      desc: 'Resolves YES if any Andalusian basin authority cuts agricultural irrigation allocation by at least 40% against the pre-2022 reference during 2027.' },
    // ---- resolved (sealed holdout) ----
    { id: 'r01', title: 'Cocoa above $10,000/t in Dec 2024?', type: 'hard', commodity: 'cocoa', regions: ['ci_cocoa', 'ghana_ashanti'], category: 'Softs', yes: 0.88, p0: 0.3, vol: 1204000, liq: 140000, created: '2024-09-02', end: '2024-12-31', src: 'IMF via FRED, PCOCOUSDM (Dec 2024 monthly average)', tags: ['climate', 'supply'], dir: 1, status: 'resolved', outcome: 'YES', resolvedAt: '2025-01-15', resolvedValue: '$11,900/t', holdout: true, shock: [14, 0.2],
      desc: 'Cocoa spiked on West African crop failure and low stocks. Sealed holdout question.' },
    { id: 'r02', title: 'Olive oil above $10,000/t before Jul 2024?', type: 'hard', commodity: 'olive_oil', regions: ['andalusia', 'puglia'], category: 'Oils & fats', yes: 0.22, p0: 0.5, vol: 703500, liq: 96000, created: '2023-12-04', end: '2024-06-30', src: 'IMF via FRED, POLVOILUSDM (any monthly print before Jul 2024)', tags: ['agro', 'supply'], dir: 1, status: 'resolved', outcome: 'NO', resolvedAt: '2024-07-12', resolvedValue: 'peak $9,100/t', holdout: true,
      desc: 'Olive oil spiked through 2023-24 after two failed Spanish harvests, but peaked below the threshold. Sealed holdout question.' },
    { id: 'r03', title: 'Wheat below $240/t in Jun 2025?', type: 'hard', commodity: 'wheat', regions: ['ukraine_chernozem', 'beauce'], category: 'Grains', yes: 0.62, p0: 0.4, vol: 552800, liq: 84000, created: '2025-01-13', end: '2025-06-30', src: 'IMF via FRED, PWHEAMTUSDM (Jun 2025 monthly average)', tags: ['geo', 'macro'], dir: -1, status: 'resolved', outcome: 'YES', resolvedAt: '2025-07-10', resolvedValue: '$231/t', holdout: true,
      desc: 'Wheat drifted lower on ample supply and a firm dollar, despite repeated Black Sea headline risk. Sealed holdout question.' },
    { id: 'r04', title: 'Catalonia declares a drought emergency by Mar 2024?', type: 'soft', topic: 'Water & drought', regions: ['catalonia'], category: 'Water & drought', yes: 0.91, p0: 0.35, vol: 288900, liq: 47000, created: '2023-11-06', end: '2024-03-31', src: 'DOGC (Generalitat de Catalunya) decree declaring drought emergency', tags: ['climate', 'policy'], dir: 1, status: 'resolved', outcome: 'YES', resolvedAt: '2024-02-01', resolvedValue: 'declared 1 Feb 2024', holdout: true, shock: [18, 0.12],
      desc: 'Reservoirs fell below 16% and the Generalitat declared an emergency in early 2024. Sealed holdout question.' },
  ];

  const fillTpl = (s, ctx) => s.replace(/\{T\}/g, ctx.T).replace(/\{c\}/g, ctx.c).replace(/\{r\}/g, ctx.r);

  function rationaleFor(agent, m, stressUp, variantSeed) {
    const reg = regionById[m.regions[0]];
    const tag = agent.lens ? m.tags.slice().sort((x, y) => Math.abs(agent.lens[y] || 0) - Math.abs(agent.lens[x] || 0))[0] : m.tags[0];
    const tail = (T[tag] || T.supply).replace('{r}', reg ? reg.name : 'the region');
    const c = m.commodity ? commodities[m.commodity].label.toLowerCase() : (m.topic || 'this market').toLowerCase();
    const tpl = (stressUp ? agent.up : agent.down)[variantSeed % 2];
    const s = fillTpl(tpl, { T: tail, c: c, r: reg ? reg.name : 'the region' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function buildHistory(rng, p0, p1, n, shock) {
    const out = []; let nz = 0;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      nz = nz * 0.72 + (rng() - 0.5) * 0.045;
      let v = p0 + (p1 - p0) * t + nz * (1 - t * 0.7);
      if (shock && i >= shock[0]) v += shock[1] * Math.exp(-(i - shock[0]) / 7) - shock[1] * 0.0;
      out.push(r3(clamp(v, 0.03, 0.97)));
    }
    out[n - 1] = r3(p1);
    return out;
  }

  const markets = mk.map((d, idx) => {
    const rng = mulberry32(9100 + idx * 77);
    const resolved = d.status === 'resolved';
    const hist = buildHistory(rng, d.p0, d.yes, 40, d.shock);
    const outcomeBin = resolved ? (d.outcome === 'YES' ? 1 : 0) : null;
    const entry = resolved ? hist[24] : d.yes;
    const stressProb = d.dir > 0 ? entry : 1 - entry;
    const positions = agents.map((a, ai) => {
      const pr = mulberry32(5000 + idx * 31 + ai * 7);
      let sh;
      if (a.kind === 'fade') sh = -0.3 * (stressProb - 0.5);
      else if (a.kind === 'herd') sh = 0.26 * (stressProb - 0.5);
      else {
        const ls = d.tags.map((t) => a.lens[t] || 0);
        sh = mean(ls) * 0.17 + (a.bias || 0);
      }
      sh += (pr() - 0.5) * 0.1; // stress-space shift
      let pYes = entry + sh * d.dir;
      if (resolved) pYes += a.skill * (outcomeBin - entry) * 0.55;
      pYes = r3(clamp(pYes, 0.03, 0.97));
      const side = pYes >= entry ? 'YES' : 'NO';
      const stressUp = (pYes - entry) * d.dir > 0;
      const edge = Math.abs(pYes - entry);
      const stake = Math.round((350 + edge * 9000 * (0.6 + pr() * 0.8)) / 10) * 10;
      const avgPrice = r3(clamp((side === 'YES' ? entry : 1 - entry) + (pr() - 0.5) * 0.04, 0.03, 0.97));
      const pos = { agentId: a.id, side: side, estimate: pYes, stake: stake, avgPrice: avgPrice, rationale: rationaleFor(a, d, stressUp, idx + ai) };
      if (resolved) {
        const won = (side === 'YES') === (d.outcome === 'YES');
        pos.pnl = Math.round(won ? stake * (1 / avgPrice - 1) : -stake);
      }
      return pos;
    });
    const stakeSum = positions.reduce((s, p) => s + p.stake, 0);
    const agentEstimate = r3(positions.reduce((s, p) => s + p.estimate * p.stake, 0) / stakeSum);
    const m = {
      id: d.id, title: d.title, type: d.type, commodity: d.commodity || null, topic: d.topic || null,
      regions: d.regions, category: d.category, status: resolved ? 'resolved' : 'open',
      yes: resolved ? r3(d.yes) : d.yes, probHistory: hist, historyEnd: resolved ? d.resolvedAt : AS_OF, historyStepDays: 7,
      change7d: r2((hist[39] - hist[38]) * 100), change24h: r2(((hist[39] - hist[38]) / 5 + (rng() - 0.5) * 0.01) * 100),
      volume: d.vol, volume24h: resolved ? 0 : Math.round(d.vol * (0.012 + rng() * 0.03)), liquidity: d.liq,
      traders: Math.round(d.vol / (700 + rng() * 500)), createdAt: d.created, endDate: d.end,
      resolutionSource: d.src, description: d.desc, spot: d.spot || null, tags: d.tags, dir: d.dir,
      agentEstimate: agentEstimate, positions: positions,
      outcome: resolved ? d.outcome : null, resolvedAt: resolved ? d.resolvedAt : null, resolvedValue: resolved ? d.resolvedValue : null,
      holdout: !!d.holdout,
    };
    return m;
  });
  const marketById = Object.fromEntries(markets.map((m) => [m.id, m]));

  /* ---------- backtest (sealed on Solana devnet) ---------- */
  const brng = mulberry32(777);
  const backtest = {
    title: 'Sealed holdout backtest',
    trainCutoff: '2023-12-31',
    holdoutWindow: ['2024-01-01', '2025-06-30'],
    holdoutQuestions: 212,
    shownMarketIds: markets.filter((m) => m.holdout).map((m) => m.id),
    baselines: { marketPrice: 0.192, coinFlip: 0.25 },
    solana: {
      cluster: 'devnet', program: b58(brng, 44),
      sealTx: b58(brng, 88), sealSlot: 412880233, sealedAt: '2026-09-30T09:14:52Z', merkleRoot: b58(brng, 44),
      revealTx: b58(brng, 88), revealSlot: 414402971, revealedAt: '2026-10-12T16:03:08Z',
      note: 'Resolutions were hashed into a Merkle tree and committed on-chain before any agent saw the question set. Agent forecasts were committed before reveal.',
    },
    perAgent: agents.map((a) => ({
      agentId: a.id, brier: a.brier, brierHard: a.brierHard, brierSoft: a.brierSoft,
      logLoss: r3(0.5 + (a.brier - 0.17) * 2.4),
      calibration: [0.1, 0.3, 0.5, 0.7, 0.9].map((p) => ({ predicted: p, observed: r3(clamp(p + (brng() - 0.5) * (a.brier - 0.14) * 1.7, 0.02, 0.98)), n: 20 + Math.floor(brng() * 40) })),
    })),
  };
  backtest.solana.explorer = {
    seal: 'https://explorer.solana.com/tx/' + backtest.solana.sealTx + '?cluster=devnet',
    reveal: 'https://explorer.solana.com/tx/' + backtest.solana.revealTx + '?cluster=devnet',
  };

  /* ---------- fund ---------- */
  const inflowMonths = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  const inflowVals = [4200, 5100, 6300, 7900, 9400, 12100, 14800, 17900, 21600, 26300, 31200, 27500];
  const inflowSum = inflowVals.reduce((s, x) => s + x, 0);
  const fund = {
    balance: fundTotal, currency: 'USDC', cutBps: 100, allTimeVolume: 18400000,
    inflows: inflowMonths.map((m, i) => ({ month: m, amount: inflowVals[i] })),
    inflows12m: inflowSum,
    allocation: regions.filter((r) => r.fund > 0).map((r) => ({ regionId: r.id, amount: r.fund, share: r3(r.fund / fundTotal) })).sort((a, b) => b.amount - a.amount),
    disbursed: [
      { regionId: 'thessaly', amount: 24000, date: '2026-06-18', purpose: 'Drip irrigation retrofit for 140 smallholders' },
      { regionId: 'andalusia', amount: 31500, date: '2026-08-02', purpose: 'Reservoir silt removal and olive-grove cover crops' },
      { regionId: 'ci_cocoa', amount: 18000, date: '2026-09-09', purpose: 'Shade-tree planting and swollen-shoot replanting' },
    ],
  };

  /* ---------- users ---------- */
  const nicks = ['olive_baron', 'wheatwhale', 'cocoa_cassandra', 'basis_bob', 'dust_bowl_dan', 'tractor_tess', 'maizeMaven', 'sugar_sven', 'rain_dancer', 'polder_pete', 'chaff_chaser', 'terroir_tom', 'monsoon_mia', 'kernel_kai', 'fallow_finn', 'harvest_hana', 'brent_to_barley', 'tillage_theo', 'espresso_eli', 'delta_dora', 'steppe_stan', 'agri_ada', 'silo_sam', 'frost_fiona', 'rye_rhys', 'irrigator_ines', 'bushel_bea', 'drought_drew', 'pasture_pia', 'sickle_sol'];
  const countries = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'US', 'IN', 'BR', 'UA', 'SI', 'CH', 'SE', 'AE'];
  const urng = mulberry32(31);
  const users = nicks.map((n, i) => {
    const pnl = Math.round((20000 * Math.pow(0.87, i) * (0.9 + urng() * 0.2) - 140 * i) / 10) * 10;
    return {
      id: 'u' + String(i + 1).padStart(2, '0'), nick: n, rank: i + 1, pnl: pnl,
      winRate: r3(clamp(0.64 - i * 0.004 - urng() * 0.03, 0.4, 0.7)), bets: 40 + Math.floor(urng() * 380),
      streak: Math.floor(urng() * 9) - (i > 20 ? 3 : 0), joined: iso(DAY_ONLY('2026-03-01') + Math.floor(urng() * 200) * dayMs),
      country: countries[Math.floor(urng() * countries.length)], favCommodity: Object.keys(commodities)[Math.floor(urng() * 8)],
    };
  });

  /* ---------- live bet stream ---------- */
  const externals = [
    { id: 'ext_alphagrain', name: 'AlphaGrain-7 (ext)', color: '#94a3b8', emoji: '🤖' },
    { id: 'ext_basisbot', name: 'BasisBot (ext)', color: '#94a3b8', emoji: '🤖' },
    { id: 'ext_mandiarb', name: 'MandiArb (ext)', color: '#94a3b8', emoji: '🤖' },
  ];
  const humanWhy = [
    'Heatwave forecast for next month does not look priced in.', 'Gut call after reading the latest crop report.', 'Cheap at this price, adding more.',
    'Fading the herd on this one.', 'Local farmers I know are talking about it.', 'Agents are split; taking the contrarian side.',
    'Following the Agronomist here.', 'News flow says otherwise; hedging a physical position.', 'Reservoir levels tell the story.',
    'Took profit on my last bet, rolling into this.', 'Dollar is turning, this should follow.', 'Policy window is closing fast.',
  ];
  const openMarkets = markets.filter((m) => m.status === 'open');
  let betSeq = 0;

  function makeBet(rng, opts) {
    opts = opts || {};
    const mutate = opts.mutate !== false;
    const ts = opts.ts || Date.now();
    const tot = openMarkets.reduce((s, m) => s + m.volume, 0);
    let x = rng() * tot, m = openMarkets[0];
    for (const mm of openMarkets) { x -= mm.volume; if (x <= 0) { m = mm; break; } }
    const roll = rng();
    let actor, side, stake, why, kind;
    if (roll < 0.58) {
      const a = agents[Math.floor(rng() * agents.length)];
      const pos = m.positions.find((p) => p.agentId === a.id);
      const trim = rng() < 0.07;
      side = trim ? (pos.side === 'YES' ? 'NO' : 'YES') : pos.side;
      stake = Math.round((pos.stake * (trim ? 0.3 : 0.4 + rng() * 0.9)) / 10) * 10;
      why = trim ? 'Trimming: edge has closed after the move.' : pos.rationale;
      kind = 'agent'; actor = { id: a.id, name: a.name, color: a.color, emoji: a.emoji };
    } else if (roll < 0.68) {
      actor = externals[Math.floor(rng() * externals.length)]; kind = 'external_agent';
      side = rng() < m.yes ? 'YES' : 'NO'; stake = Math.round(200 + rng() * 1800);
      why = 'Cross-venue basis vs. spot-linked fair value.';
    } else {
      const u = users[Math.floor(rng() * users.length)]; kind = 'human';
      actor = { id: u.id, name: u.nick, color: '#cbd5e1', emoji: '👤' };
      side = rng() < m.yes ? 'YES' : 'NO'; stake = Math.round(Math.exp(Math.log(10) + rng() * Math.log(150)));
      why = humanWhy[Math.floor(rng() * humanWhy.length)];
    }
    const before = m.yes;
    const imp = (stake / (m.liquidity + stake)) * 0.35 * 4 * before * (1 - before);
    const after = r3(clamp(before + (side === 'YES' ? imp : -imp), 0.02, 0.98));
    if (mutate) { m.yes = after; m.volume += stake; m.volume24h += stake; }
    return {
      id: 'b' + (++betSeq), ts: ts, actorType: kind, actorId: actor.id, actorName: actor.name, actorColor: actor.color, actorEmoji: actor.emoji,
      marketId: m.id, marketTitle: m.title, side: side, stake: stake, priceBefore: before, priceAfter: after,
      priceImpact: r2((after - before) * 100), rationale: why, tx: b58(rng, 64),
    };
  }

  function makeBetStream(options) {
    const o = Object.assign({ minMs: 300, maxMs: 1500, mutate: true }, options || {});
    const subs = new Set();
    let timer = null;
    const stream = {
      running: false,
      on(fn) { subs.add(fn); return function () { subs.delete(fn); }; },
      off(fn) { subs.delete(fn); },
      next() { const b = makeBet(Math.random, { mutate: o.mutate }); subs.forEach((fn) => fn(b)); return b; },
      start() {
        if (stream.running) return stream; stream.running = true;
        const tick = function () {
          if (!stream.running) return;
          stream.next();
          timer = setTimeout(tick, o.minMs + Math.random() * (o.maxMs - o.minMs));
        };
        timer = setTimeout(tick, o.minMs + Math.random() * (o.maxMs - o.minMs));
        return stream;
      },
      stop() { stream.running = false; clearTimeout(timer); return stream; },
    };
    return stream;
  }

  // Pre-built recent history for first paint: newest first, does not mutate markets.
  function recentBets(n) {
    const rng = mulberry32(4242);
    let t = Date.now();
    const out = [];
    for (let i = 0; i < (n || 40); i++) {
      out.push(makeBet(rng, { mutate: false, ts: t }));
      t -= 300 + Math.floor(rng() * 1200) * (1 + Math.floor(i / 10));
    }
    return out;
  }

  /* ---------- format helpers ---------- */
  const fmt = {
    usd: (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US'),
    compact: (n) => (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.abs(n) >= 1e3 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'k' : String(Math.round(n))),
    pct: (p, d) => (p * 100).toFixed(d == null ? 0 : d) + '%',
    cents: (p) => Math.round(p * 100) + '¢',
  };

  function historyDates(m) {
    const end = DAY_ONLY(m.historyEnd);
    return m.probHistory.map((_, i) => iso(end - (m.probHistory.length - 1 - i) * m.historyStepDays * dayMs));
  }

  global.MOCK = {
    asOf: AS_OF, brand: brand, commodities: commodities, quarters: quarters,
    agents: agents, markets: markets, regions: regions, fund: fund, users: users, backtest: backtest,
    bets: { makeBetStream: makeBetStream, recent: recentBets },
    makeBetStream: makeBetStream, recentBets: recentBets,
    getAgent: (id) => agentById[id], getMarket: (id) => marketById[id], getRegion: (id) => regionById[id],
    historyDates: historyDates, fmt: fmt,
  };
})(typeof window !== 'undefined' ? window : globalThis);
