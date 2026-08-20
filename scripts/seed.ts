// Seeds a small set of mock listings across Prishtina's neighborhoods (plus
// a couple other Kosovo cities, so map search has believable clusters), with
// 10 mock agents to assign them to. Rerunnable: clears previously seeded
// rows first.
//
// Photos are direct links to a fixed pool of real Unsplash apartment/
// interior photos (see APARTMENT_PHOTO_IDS below) rather than uploads to
// Supabase Storage — good enough to look like real listing photography
// until actual photos replace them, with no storage bucket or API key
// needed.
import { config } from "dotenv";
import { faker } from "@faker-js/faker";
import { getSupabaseAdmin } from "../src/lib/supabase-admin";
import { slugify } from "../src/lib/slug";
import { formatNumber } from "../src/lib/format";

config({ path: ".env.local" });

// Primary market is Prishtina, Kosovo — so most rows below are Prishtina
// neighborhoods sharing one real `city`. Kosovo has no US-style states; the
// nearest real equivalent is the district (qark) a municipality sits in, so
// `state` holds that instead of the country. Each entry also carries a
// `neighborhood` name (the actual geographic granularity for a single-metro
// site) plus a curated street-name pool so generated addresses read as
// Kosovar rather than US Faker output. A couple of other real Kosovo cities
// are mixed in for variety, each with one named neighborhood/district.
const CITIES = [
  {
    city: "Prishtina",
    neighborhood: "Dardania",
    state: "Prishtina District",
    zip: "10000",
    lat: 42.655,
    lng: 21.15,
    streets: [
      "Rruga Bill Klinton",
      "Rruga Zija Shemsiu",
      "Rruga Muharrem Fejza",
      "Rruga Sylejman Vokshi",
    ],
  },
  {
    city: "Prishtina",
    neighborhood: "Ulpiana",
    state: "Prishtina District",
    zip: "10000",
    lat: 42.6486,
    lng: 21.1642,
    streets: [
      "Bulevardi Nënë Tereza",
      "Rruga Ismail Qemali",
      "Rruga Fehmi Agani",
    ],
  },
  {
    city: "Prishtina",
    neighborhood: "Bregu i Diellit",
    state: "Prishtina District",
    zip: "10000",
    lat: 42.6428,
    lng: 21.1717,
    streets: ["Rruga Ali Kelmendi", "Rruga Xhemajl Berisha", "Rruga Robert Doll"],
  },
  {
    city: "Prishtina",
    neighborhood: "Arbëria",
    state: "Prishtina District",
    zip: "10000",
    lat: 42.6656,
    lng: 21.1494,
    streets: ["Rruga Ganimete Terbeshi", "Rruga Isa Kastrati", "Rruga Xhavit Kelmendi"],
  },
  {
    city: "Prishtina",
    neighborhood: "Velania",
    state: "Prishtina District",
    zip: "10000",
    lat: 42.6708,
    lng: 21.1614,
    streets: ["Rruga Agim Ramadani", "Rruga Luan Haradinaj", "Rruga Zenel Salihu"],
  },
  {
    city: "Prishtina",
    neighborhood: "Mati 1",
    state: "Prishtina District",
    zip: "10000",
    lat: 42.6494,
    lng: 21.1553,
    streets: ["Rruga UÇK", "Rruga Dëshmorët e Kombit", "Rruga Ilaz Agushi"],
  },
  {
    city: "Prishtina",
    neighborhood: "Lakrishte",
    state: "Prishtina District",
    zip: "10000",
    lat: 42.6389,
    lng: 21.1608,
    streets: ["Rruga e Prizrenit", "Rruga Anton Çetta", "Rruga Rexhep Mala"],
  },
  {
    city: "Prizren",
    neighborhood: "Prizren Old Town",
    state: "Prizren District",
    zip: "20000",
    lat: 42.2139,
    lng: 20.7397,
    streets: ["Rruga Shatërvani", "Rruga Remzi Ademi", "Rruga Adem Jashari"],
  },
  {
    city: "Pejë",
    neighborhood: "Pejë City Center",
    state: "Pejë District",
    zip: "30000",
    lat: 42.6591,
    lng: 20.2883,
    streets: ["Rruga Mbretëresha Teutë", "Rruga Bedri Pejani", "Rruga Skënderbeu"],
  },
  {
    city: "Ferizaj",
    neighborhood: "Ferizaj City Center",
    state: "Ferizaj District",
    zip: "70000",
    lat: 42.3706,
    lng: 21.155,
    streets: ["Rruga Skënderbeu", "Rruga Dëshmorët e Kombit", "Rruga Kadri Kastrati"],
  },
  {
    city: "Gjakova",
    neighborhood: "Gjakova Old Bazaar",
    state: "Gjakova District",
    zip: "50000",
    lat: 42.3803,
    lng: 20.4308,
    streets: ["Rruga Çarshia e Madhe", "Rruga Zenel Hajdini", "Rruga Ismail Qemali"],
  },
  {
    city: "Gjilan",
    neighborhood: "Gjilan City Center",
    state: "Gjilan District",
    zip: "60000",
    lat: 42.4633,
    lng: 21.4694,
    streets: ["Rruga Zenel Hajdini", "Rruga Bulevardi i Pavarësisë", "Rruga Adem Jashari"],
  },
  {
    city: "Mitrovica",
    neighborhood: "Mitrovica City Center",
    state: "Mitrovica District",
    zip: "40000",
    lat: 42.8914,
    lng: 20.866,
    streets: ["Rruga Afrim Zhitia", "Rruga Isa Boletini", "Rruga Ilaz Kodra"],
  },
  {
    city: "Vushtrri",
    neighborhood: "Vushtrri Center",
    state: "Mitrovica District",
    zip: "41000",
    lat: 42.8228,
    lng: 20.9678,
    streets: ["Rruga Skënderbeu", "Rruga Emin Duraku", "Rruga Ilaz Kodra"],
  },
  {
    city: "Podujevë",
    neighborhood: "Podujevë Center",
    state: "Prishtina District",
    zip: "11000",
    lat: 42.9106,
    lng: 21.1936,
    streets: ["Rruga Zahir Pajaziti", "Rruga Adem Jashari", "Rruga Bajram Curri"],
  },
  {
    city: "Fushë Kosovë",
    neighborhood: "Fushë Kosovë Center",
    state: "Prishtina District",
    zip: "12000",
    lat: 42.6394,
    lng: 21.0989,
    streets: ["Rruga Skënderbeu", "Rruga Ilaz Kodra", "Rruga Bajram Curri"],
  },
  {
    city: "Obiliq",
    neighborhood: "Obiliq Center",
    state: "Prishtina District",
    zip: "13000",
    lat: 42.6836,
    lng: 21.0733,
    streets: ["Rruga Deshmoret e Kombit", "Rruga Skënderbeu", "Rruga UÇK"],
  },
  {
    city: "Lipjan",
    neighborhood: "Lipjan Center",
    state: "Prishtina District",
    zip: "14000",
    lat: 42.5219,
    lng: 21.1258,
    streets: ["Rruga Adem Jashari", "Rruga Skënderbeu", "Rruga Zenel Salihu"],
  },
  {
    city: "Novobërdë",
    neighborhood: "Novobërdë Center",
    state: "Prishtina District",
    zip: "15000",
    lat: 42.6119,
    lng: 21.4394,
    streets: ["Rruga Kryesore", "Rruga Skënderbeu", "Rruga Bajram Curri"],
  },
  {
    city: "Rahovec",
    neighborhood: "Rahovec Center",
    state: "Prizren District",
    zip: "21000",
    lat: 42.3997,
    lng: 20.6539,
    streets: ["Rruga Skënderbeu", "Rruga 19 Nëntori", "Rruga Zahir Pajaziti"],
  },
  {
    city: "Suharekë",
    neighborhood: "Suharekë Center",
    state: "Prizren District",
    zip: "22000",
    lat: 42.3603,
    lng: 20.8228,
    streets: ["Rruga Skënderbeu", "Rruga Adem Jashari", "Rruga Zenel Salihu"],
  },
  {
    city: "Dragash",
    neighborhood: "Dragash Center",
    state: "Prizren District",
    zip: "23000",
    lat: 42.0692,
    lng: 20.6525,
    streets: ["Rruga Kryesore", "Rruga Skënderbeu", "Rruga Zahir Pajaziti"],
  },
] as const;

// Real Unsplash apartment/interior/exterior photo IDs (verified reachable),
// used directly via images.unsplash.com rather than uploaded to storage.
// Placeholder only — swap for real listing photography when available.
const APARTMENT_PHOTO_IDS = [
  "1502672260266-1c1ef2d93688",
  "1522708323590-d24dbb6b0267",
  "1560448204-e02f11c3d0e2",
  "1560185893-a55cbc8c57e8",
  "1560448204-603b3fc33ddc",
  "1484154218962-a197022b5858",
  "1493809842364-78817add7ffb",
  "1567767292278-a4f21aa2d36e",
  "1502672023488-70e25813eb80",
  "1512918728675-ed5a9ecdebfd",
  "1554995207-c18c203602cb",
  "1571508601891-ca5e7a713859",
  "1586023492125-27b2c045efd7",
  "1600585154340-be6161a56a0c",
  "1600607687939-ce8a6c25118c",
  "1615874959474-d609969a20ed",
  "1616486338812-3dadae4b4ace",
  "1618221195710-dd6b41faaea6",
  "1502005229762-cf1b2da7c5d6",
  "1523217582562-09d0def993a6",
] as const;

function apartmentPhotoUrl(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;
}

const PROPERTY_TYPES = ["house", "apartment", "office", "land"] as const;

const STATUSES = [
  "for-sale",
  "for-sale",
  "for-sale",
  "pending",
  "sold",
  "for-rent",
] as const;

// Kept small on purpose: this is placeholder content until real listing
// photos/copy replace the stock ones below, and a handful of believable
// rows is more useful for demoing than 75 near-duplicates. Exactly one
// listing per city (see main()) so every city in CITIES actually shows up
// in the city nav, which only lists cities that have at least one listing.
const LISTING_COUNT = CITIES.length;
const HOT_HOME_FRACTION = 0.1;

// A small, fixed roster of Kosovar agents (real Albanian names, +383 mobile
// numbers) rather than Faker-generated US names/phone formats, which read
// as obviously wrong on a Kosovo site.
const AGENTS = [
  {
    name: "Arben Krasniqi",
    email: "arben.krasniqi@gmail.com",
    phone: "+383 44 123 456",
    bio: "Arben has spent over a decade helping families find homes across Prishtina and its neighborhoods, with a focus on apartments and family houses.",
  },
  {
    name: "Blerta Gashi",
    email: "blerta.gashi@gmail.com",
    phone: "+383 45 234 567",
    bio: "Blerta specializes in Prishtina city-center apartments and new developments, and works closely with first-time buyers.",
  },
  {
    name: "Driton Hoxha",
    email: "driton.hoxha@gmail.com",
    phone: "+383 49 345 678",
    bio: "Driton covers listings across Kosovo's smaller cities and towns, from Gjakova to Gjilan, with deep local market knowledge.",
  },
] as const;

// Hand-written per-city content for the listing page's neighborhood card —
// there's no live data source for this yet, so it's "editable seed content"
// per the brief, matched to a listing by city/state at query time.
const NEIGHBORHOODS = [
  {
    city: "Prishtina",
    state: "Prishtina District",
    name: "Dardania",
    description:
      "One of Prishtina's largest and most established residential areas, a dense mix of socialist-era apartment blocks and newer infill construction close to the University of Prishtina and Bill Clinton Boulevard.",
    crime_score: 28,
    walk_score: 78,
    local_insights: [
      "Walking distance to the University of Prishtina campus",
      "Well-served by city bus lines into the center",
      "Busy local market and shop-lined streets",
    ],
  },
  {
    city: "Prishtina",
    state: "Prishtina District",
    name: "Ulpiana",
    description:
      "A centrally-located neighborhood named after the ancient Roman city, mixing mid-rise apartments with tree-lined streets near Mother Teresa Boulevard and the National Library.",
    crime_score: 25,
    walk_score: 82,
    local_insights: [
      "Steps from Mother Teresa Boulevard's cafes and shops",
      "Close to the National Library and National Theatre",
      "Popular with young professionals and students",
    ],
  },
  {
    city: "Prishtina",
    state: "Prishtina District",
    name: "Bregu i Diellit",
    description:
      "A hillside residential area on Prishtina's eastern edge, known for newer apartment developments and views over the city.",
    crime_score: 22,
    walk_score: 60,
    local_insights: [
      "Quieter than the city center, with newer construction",
      "Growing selection of cafes and bakeries",
      "10–15 minute drive to downtown Prishtina",
    ],
  },
  {
    city: "Prishtina",
    state: "Prishtina District",
    name: "Arbëria",
    description:
      "Prishtina's most upscale hillside district, home to many embassies and diplomatic residences, with newer villas and panoramic city views.",
    crime_score: 15,
    walk_score: 48,
    local_insights: [
      "Highest concentration of embassies and diplomatic residences",
      "Mostly detached villas rather than apartment blocks",
      "Some of the highest per-square-meter prices in the city",
    ],
  },
  {
    city: "Prishtina",
    state: "Prishtina District",
    name: "Velania",
    description:
      "A quiet, established neighborhood just north of the University of Prishtina, popular with students and university staff.",
    crime_score: 27,
    walk_score: 74,
    local_insights: [
      "Close to University of Prishtina faculties",
      "Mix of older houses and student housing",
      "Easy walk to the city center",
    ],
  },
  {
    city: "Prishtina",
    state: "Prishtina District",
    name: "Mati 1",
    description:
      "A dense, central neighborhood a short walk from Mother Teresa Square, mixing older apartment blocks with ground-floor retail.",
    crime_score: 30,
    walk_score: 85,
    local_insights: [
      "Steps from Mother Teresa Square and the Grand Hotel area",
      "Some of the best transit access in the city",
      "Busy pedestrian streets with shops and cafes",
    ],
  },
  {
    city: "Prishtina",
    state: "Prishtina District",
    name: "Lakrishte",
    description:
      "A mixed residential and commercial area near Prishtina's main bus station, undergoing steady redevelopment.",
    crime_score: 35,
    walk_score: 70,
    local_insights: [
      "Close to Prishtina's main inter-city bus station",
      "Convenient for commuters traveling outside the city",
      "Ongoing new residential construction",
    ],
  },
  {
    city: "Prizren",
    state: "Prizren District",
    name: "Prizren Old Town",
    description:
      "Kosovo's historic second city, known for its Ottoman-era old town, stone bridges, and the Sharr Mountains backdrop.",
    crime_score: 24,
    walk_score: 80,
    local_insights: [
      "Ottoman and Byzantine-era architecture throughout the old town",
      "Home to the Dokufest film festival each summer",
      "About 90 minutes from Prishtina by road",
    ],
  },
  {
    city: "Pejë",
    state: "Pejë District",
    name: "Pejë City Center",
    description:
      "A city in western Kosovo at the foot of the Accursed Mountains (Bjeshkët e Nemuna), gateway to Rugova Canyon.",
    crime_score: 26,
    walk_score: 65,
    local_insights: [
      "Closest city to Rugova Canyon and its hiking trails",
      "Historic Patriarchate of Peć monastery nearby",
      "Growing outdoor tourism economy",
    ],
  },
  {
    city: "Ferizaj",
    state: "Ferizaj District",
    name: "Ferizaj City Center",
    description:
      "Kosovo's third-largest city, a rail and road junction town in the south with a growing commercial center and mixed apartment/house housing stock.",
    crime_score: 30,
    walk_score: 68,
    local_insights: [
      "Major railway junction with regular service to Prishtina and Skopje",
      "Compact, walkable center around the main square",
      "About 40 minutes from Prishtina by road",
    ],
  },
  {
    city: "Gjakova",
    state: "Gjakova District",
    name: "Gjakova Old Bazaar",
    description:
      "A historic western city built around the Ottoman-era Old Bazaar (Çarshia e Madhe), one of the best-preserved in the region, with a mix of restored stone houses and newer construction.",
    crime_score: 27,
    walk_score: 74,
    local_insights: [
      "Steps from the restored Old Bazaar's shops and workshops",
      "Rich Ottoman and traditional Kosovar architecture",
      "About 1.5 hours from Prishtina by road",
    ],
  },
  {
    city: "Gjilan",
    state: "Gjilan District",
    name: "Gjilan City Center",
    description:
      "A major eastern city known for its lively bazaar culture and steady residential growth, with a central pedestrian core surrounded by newer apartment blocks.",
    crime_score: 26,
    walk_score: 72,
    local_insights: [
      "Busy pedestrian shopping streets in the center",
      "Close to the Bulgaria/North Macedonia border crossings",
      "About an hour from Prishtina by road",
    ],
  },
  {
    city: "Mitrovica",
    state: "Mitrovica District",
    name: "Mitrovica City Center",
    description:
      "A northern mining city split by the Ibar river, historically tied to the nearby Trepça mines, with a mix of older housing stock and newer development on the southern side.",
    crime_score: 33,
    walk_score: 62,
    local_insights: [
      "Historic industrial center tied to the Trepça mining complex",
      "River Ibar runs through the city center",
      "About 40 minutes from Prishtina by road",
    ],
  },
  {
    city: "Vushtrri",
    state: "Mitrovica District",
    name: "Vushtrri Center",
    description:
      "An old market town between Prishtina and Mitrovica, with a historic hilltop fortress and a growing residential belt along the main road.",
    crime_score: 29,
    walk_score: 60,
    local_insights: [
      "Historic hilltop fortress overlooking the town",
      "Convenient midpoint between Prishtina and Mitrovica",
      "Mostly single-family houses outside the small center",
    ],
  },
  {
    city: "Podujevë",
    state: "Prishtina District",
    name: "Podujevë Center",
    description:
      "A market town north of Prishtina, historically an agricultural center, now a commuter town with steady new-build housing along the road into the capital.",
    crime_score: 25,
    walk_score: 58,
    local_insights: [
      "Growing commuter town on the main road north from Prishtina",
      "Traditional weekly market still active in the center",
      "About 30 minutes from Prishtina by road",
    ],
  },
  {
    city: "Fushë Kosovë",
    state: "Prishtina District",
    name: "Fushë Kosovë Center",
    description:
      "A fast-growing commuter town immediately west of Prishtina, popular for newer, more affordable housing within easy reach of the capital.",
    crime_score: 24,
    walk_score: 64,
    local_insights: [
      "Direct rail line into central Prishtina",
      "Some of the most affordable new-build housing near the capital",
      "Right next to Prishtina International Airport",
    ],
  },
  {
    city: "Obiliq",
    state: "Prishtina District",
    name: "Obiliq Center",
    description:
      "A small town just north of Prishtina best known for Kosovo's main power plants, with modest, mostly single-family housing.",
    crime_score: 28,
    walk_score: 50,
    local_insights: [
      "Home to Kosovo's Kosova A and B power plants",
      "Close to Kosovo's largest coal mining operations",
      "Short drive to central Prishtina",
    ],
  },
  {
    city: "Lipjan",
    state: "Prishtina District",
    name: "Lipjan Center",
    description:
      "A central market town south of Prishtina on the main road and rail line to Ferizaj, with a mix of older village housing and newer construction.",
    crime_score: 26,
    walk_score: 56,
    local_insights: [
      "On the main Prishtina–Ferizaj road and rail line",
      "Mostly single-family houses with garden plots",
      "About 25 minutes from Prishtina by road",
    ],
  },
  {
    city: "Novobërdë",
    state: "Prishtina District",
    name: "Novobërdë Center",
    description:
      "A small historic mining town in the hills east of Prishtina, built around a medieval fortress that once anchored a major silver-mining economy.",
    crime_score: 22,
    walk_score: 40,
    local_insights: [
      "Medieval hilltop fortress and mining ruins nearby",
      "Quiet, rural surroundings with low housing density",
      "About an hour from Prishtina by road",
    ],
  },
  {
    city: "Rahovec",
    state: "Prizren District",
    name: "Rahovec Center",
    description:
      "The center of Kosovo's wine industry, a west-central town surrounded by vineyards, with a small walkable core and mostly low-rise housing.",
    crime_score: 23,
    walk_score: 62,
    local_insights: [
      "Surrounded by Kosovo's largest wine-producing vineyards",
      "Home to the annual Rahovec wine festival",
      "About an hour from Prishtina by road",
    ],
  },
  {
    city: "Suharekë",
    state: "Prizren District",
    name: "Suharekë Center",
    description:
      "A south-central town on the road between Prizren and Prishtina, with a compact commercial center and expanding residential outskirts.",
    crime_score: 25,
    walk_score: 60,
    local_insights: [
      "On the main Prizren–Prishtina road",
      "Known regionally for cherry orchards in the surrounding hills",
      "About 45 minutes from Prizren by road",
    ],
  },
  {
    city: "Dragash",
    state: "Prizren District",
    name: "Dragash Center",
    description:
      "A mountain town in Kosovo's far south, gateway to the Sharr Mountains National Park, with sparse, mostly single-family housing.",
    crime_score: 18,
    walk_score: 35,
    local_insights: [
      "Gateway to the Sharr Mountains National Park",
      "Popular base for hiking and winter sports",
      "About 1.5 hours from Prizren by road",
    ],
  },
] as const;

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

const PROPERTY_TYPE_LABEL_SQ = {
  house: "shtëpi",
  apartment: "banesë",
  office: "zyrë",
  land: "tokë",
} as const;

/** Short, factual EN/SQ descriptions (beds/baths/size/location) instead of
 * Faker Latin lorem ipsum, which reads as obviously fake filler text. */
function buildDescriptions(params: {
  propertyType: (typeof PROPERTY_TYPES)[number];
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  neighborhood: string;
  city: string;
  hasGarageStorage: boolean;
}): { en: string; sq: string } {
  const { propertyType, beds, baths, sqft, lotSize, yearBuilt, neighborhood, city, hasGarageStorage } = params;
  const isLand = propertyType === "land";
  const isOffice = propertyType === "office";
  const yearEn = yearBuilt ? `, built in ${yearBuilt}` : "";
  const yearSq = yearBuilt ? `, ndërtuar në ${yearBuilt}` : "";

  if (isLand) {
    return {
      en: `A ${formatNumber(lotSize!)} m² parcel of land in ${neighborhood}, ${city}, ready for a new build or investment.`,
      sq: `Parcelë tokë prej ${formatNumber(lotSize!)} m² në ${neighborhood}, ${city}, gati për ndërtim të ri ose investim.`,
    };
  }

  if (isOffice) {
    return {
      en: `A ${formatNumber(sqft!)} m² office space in ${neighborhood}, ${city}${yearEn}, suited for a small business or professional practice.`,
      sq: `Hapësirë zyre prej ${formatNumber(sqft!)} m² në ${neighborhood}, ${city}${yearSq}, e përshtatshme për biznes të vogël ose praktikë profesionale.`,
    };
  }

  const garageEn = hasGarageStorage ? " Includes a storage room in the garage." : "";
  const garageSq = hasGarageStorage ? " Përfshin depo në garazh." : "";

  return {
    en: `A ${beds}-bedroom, ${baths}-bathroom ${propertyType} spanning ${formatNumber(sqft!)} m² in ${neighborhood}, ${city}${yearEn}.${garageEn}`,
    sq: `Një ${PROPERTY_TYPE_LABEL_SQ[propertyType]} me ${beds} dhoma gjumi dhe ${baths} banjo, me sipërfaqe ${formatNumber(sqft!)} m² në ${neighborhood}, ${city}${yearSq}.${garageSq}`,
  };
}

function buildAgent(a: (typeof AGENTS)[number]) {
  return {
    name: a.name,
    email: a.email,
    phone: a.phone,
    photo_url: `https://i.pravatar.cc/300?u=${encodeURIComponent(a.name)}`,
    bio: a.bio,
  };
}

function buildListing(agentId: string, cityInfo: (typeof CITIES)[number]) {
  const propertyType = faker.helpers.arrayElement(PROPERTY_TYPES);
  const isLand = propertyType === "land";
  const status = faker.helpers.arrayElement(STATUSES);

  const isOffice = propertyType === "office";
  const isResidential = !isLand && !isOffice; // house or apartment
  const beds = isResidential ? faker.number.int({ min: 1, max: 6 }) : null;
  const baths = isResidential
    ? roundToHalf(faker.number.float({ min: 1, max: 4.5 }))
    : null;
  // Sizes/prices are Kosovo-scale, not converted US numbers: Prishtina
  // apartments/houses run roughly 45-260 m² (offices a bit wider, 30-500
  // m²), land parcels a few hundred to ~1.5 hectares, and sale prices
  // around €700-2200/m² depending on neighborhood — nowhere close to US
  // price-per-sqft figures.
  const sqft = isLand
    ? null
    : faker.number.int({ min: isOffice ? 30 : 45, max: isOffice ? 500 : 260 });
  // Only standalone houses and raw land have a meaningful separate lot —
  // apartments/offices are units within a building.
  const lotSize = isLand
    ? faker.number.int({ min: 300, max: 15000 })
    : propertyType === "house"
      ? faker.number.int({ min: 80, max: 1200 })
      : null;
  const yearBuilt = isLand ? null : faker.number.int({ min: 1970, max: 2024 });

  const isRent = status === "for-rent";
  const pricePerSqm = faker.number.int({ min: 700, max: 2200 });
  const price = isLand
    ? faker.number.int({ min: 5000, max: 150000 })
    : isRent
      ? faker.number.int({ min: 200, max: 900 })
      : Math.round(((sqft ?? 70) * pricePerSqm) / 500) * 500;

  // Apartments and offices sit in shared buildings with a service/building
  // fee; standalone houses rarely do, land never does.
  const hoaFee = isLand
    ? null
    : propertyType === "apartment" || isOffice
      ? faker.number.int({ min: 15, max: 60 })
      : Math.random() < 0.15
        ? faker.number.int({ min: 10, max: 30 })
        : null;

  const isHotHome = false; // assigned after generation, on a random subset
  const daysOnMarket = faker.number.int({ min: 1, max: 180 });
  const hasGarageStorage = Math.random() < 0.5;

  const propertyTypeLabel = propertyType.replace("-", " ");
  const title = isLand
    ? `${formatNumber(lotSize!)} m² Lot in ${cityInfo.neighborhood}, ${cityInfo.city}`
    : isOffice
      ? `${formatNumber(sqft!)} m² Office in ${cityInfo.neighborhood}`
      : `${beds} Bed, ${baths} Bath ${propertyTypeLabel} in ${cityInfo.neighborhood}`;

  const descriptions = buildDescriptions({
    propertyType,
    beds,
    baths,
    sqft,
    lotSize,
    yearBuilt,
    neighborhood: cityInfo.neighborhood,
    city: cityInfo.city,
    hasGarageStorage,
  });

  // Prishtina's neighborhoods are each only a few hundred meters to ~1-2km
  // across, so a tight jitter keeps listings inside their named area —
  // the old ±0.08° (~8km) US-city-scale spread would scatter them across
  // several neighboring areas.
  const lat = cityInfo.lat + faker.number.float({ min: -0.012, max: 0.012 });
  const lng = cityInfo.lng + faker.number.float({ min: -0.012, max: 0.012 });

  return {
    mls_id:
      Math.random() < 0.3 ? faker.string.alphanumeric(10).toUpperCase() : null,
    agent_id: agentId,
    title,
    description: descriptions.en,
    description_sq: descriptions.sq,
    price,
    status,
    property_type: propertyType,
    beds,
    baths,
    sqft,
    lot_size: lotSize,
    year_built: yearBuilt,
    address: `${faker.helpers.arrayElement(cityInfo.streets)}, nr. ${faker.number.int({ min: 1, max: 180 })}`,
    city: cityInfo.city,
    state: cityInfo.state,
    zip: cityInfo.zip,
    location: `POINT(${lng} ${lat})`,
    hoa_fee: hoaFee,
    days_on_market: daysOnMarket,
    is_hot_home: isHotHome,
    has_garage_storage: hasGarageStorage,
    neighborhoodName: cityInfo.neighborhood,
  };
}

function buildListingImages(listingId: string, count: number) {
  // Cycle through the fixed photo pool (shuffled per listing) rather than
  // uploading anything — repeats are fine, this is a placeholder gallery.
  const pool = faker.helpers.shuffle([...APARTMENT_PHOTO_IDS]);
  return Array.from({ length: count }, (_, index) => ({
    listing_id: listingId,
    url: apartmentPhotoUrl(pool[index % pool.length]),
    sort_order: index,
    is_floor_plan: false,
    is_3d_tour: false,
  }));
}

async function main() {
  const supabase = getSupabaseAdmin();

  console.log("Clearing previously seeded data...");
  const NIL_UUID = "00000000-0000-0000-0000-000000000000";
  await supabase.from("listing_images").delete().neq("id", NIL_UUID);
  await supabase.from("listings").delete().neq("id", NIL_UUID);
  await supabase.from("agents").delete().neq("id", NIL_UUID);
  await supabase.from("neighborhoods").delete().neq("id", NIL_UUID);

  console.log(`Inserting ${NEIGHBORHOODS.length} neighborhoods...`);
  const neighborhoodRows = NEIGHBORHOODS.map((n) => ({
    ...n,
    slug: slugify(n.name),
  }));
  const { data: neighborhoods, error: neighborhoodsError } = await supabase
    .from("neighborhoods")
    .insert(neighborhoodRows)
    .select("id, name");
  if (neighborhoodsError) throw neighborhoodsError;
  // Keyed by neighborhood name, not city: several neighborhoods now share
  // the same real city (Prishtina), so city alone is no longer unique.
  const neighborhoodIdByName = new Map(
    neighborhoods.map((n) => [n.name as string, n.id as string]),
  );

  console.log(`Inserting ${AGENTS.length} agents...`);
  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .insert(AGENTS.map(buildAgent))
    .select("id");
  if (agentsError) throw agentsError;
  const agentIds = agents.map((a) => a.id as string);

  console.log(`Inserting ${LISTING_COUNT} listings...`);
  const listingRows = CITIES.map((cityInfo, i) => {
    const { neighborhoodName, ...row } = buildListing(
      agentIds[i % agentIds.length],
      cityInfo,
    );
    return {
      ...row,
      neighborhood_id: neighborhoodIdByName.get(neighborhoodName) ?? null,
    };
  });

  const hotHomeCount = Math.round(LISTING_COUNT * HOT_HOME_FRACTION);
  for (const row of faker.helpers.arrayElements(listingRows, hotHomeCount)) {
    row.is_hot_home = true;
    row.days_on_market = faker.number.int({ min: 1, max: 5 });
  }

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .insert(listingRows)
    .select("id");
  if (listingsError) throw listingsError;

  console.log(`Attaching photos for ${listings.length} listings...`);
  const imageRows = listings.flatMap((listing) =>
    buildListingImages(
      listing.id as string,
      faker.number.int({ min: 8, max: 14 }),
    ),
  );
  const { error: imagesError } = await supabase
    .from("listing_images")
    .insert(imageRows);
  if (imagesError) throw imagesError;
  const totalImages = imageRows.length;

  console.log("\nDone.");
  console.log(`  neighborhoods: ${NEIGHBORHOODS.length}`);
  console.log(`  agents:        ${agentIds.length}`);
  console.log(
    `  listings:      ${listings.length} (${hotHomeCount} hot homes)`,
  );
  console.log(`  images:        ${totalImages}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
