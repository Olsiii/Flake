// Seeds ~75 mock listings across Prishtina's neighborhoods (plus a couple
// other Kosovo cities, so map search has believable clusters), each with
// photos uploaded to Supabase Storage and 10 mock agents to assign them to.
// Rerunnable: clears previously seeded rows first.
//
// Photos come from picsum.photos (free, no API key, no rate-limit auth) —
// there's no free *real-estate-specific* photo API left that doesn't need a
// key (Unsplash Source, which used to serve keyworded photos, was shut down
// in 2023), so these are generic placeholder photos, not actual house
// photography. They're fetched at seed time and never committed to git.
import { config } from "dotenv";
import { faker } from "@faker-js/faker";
import {
  getListingImagesBucket,
  getListingImagePublicUrl,
} from "../src/lib/storage";
import { getSupabaseAdmin } from "../src/lib/supabase-admin";
import { slugify } from "../src/lib/slug";

config({ path: ".env.local" });

// Primary market is Prishtina, Kosovo — so most "cities" here are actually
// Prishtina neighborhoods (Kosovo doesn't have US-style states, and for a
// single-metro site the useful geographic granularity is the neighborhood
// level, not the city level). A couple of other real Kosovo cities are
// mixed in for variety. `state` is just "Kosovo" for all of them.
const CITIES = [
  { city: "Dardania", state: "Kosovo", lat: 42.655, lng: 21.15 },
  { city: "Ulpiana", state: "Kosovo", lat: 42.6486, lng: 21.1642 },
  { city: "Bregu i Diellit", state: "Kosovo", lat: 42.6428, lng: 21.1717 },
  { city: "Sunny Hill", state: "Kosovo", lat: 42.6606, lng: 21.1364 },
  { city: "Arbëria", state: "Kosovo", lat: 42.6656, lng: 21.1494 },
  { city: "Velania", state: "Kosovo", lat: 42.6708, lng: 21.1614 },
  { city: "Mati 1", state: "Kosovo", lat: 42.6494, lng: 21.1553 },
  { city: "Lakrishte", state: "Kosovo", lat: 42.6389, lng: 21.1608 },
  { city: "Prizren", state: "Kosovo", lat: 42.2139, lng: 20.7397 },
  { city: "Pejë", state: "Kosovo", lat: 42.6591, lng: 20.2883 },
] as const;

const PROPERTY_TYPES = [
  "single-family",
  "condo",
  "townhouse",
  "multi-family",
  "land",
] as const;

const STATUSES = [
  "for-sale",
  "for-sale",
  "for-sale",
  "pending",
  "sold",
  "for-rent",
] as const;

const LISTING_COUNT = 75;
const AGENT_COUNT = 10;
const HOT_HOME_FRACTION = 0.1;
const IMAGE_CONCURRENCY = 6;

// Hand-written per-city content for the listing page's neighborhood card —
// there's no live data source for this yet, so it's "editable seed content"
// per the brief, matched to a listing by city/state at query time.
const NEIGHBORHOODS = [
  {
    city: "Dardania",
    state: "Kosovo",
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
    city: "Ulpiana",
    state: "Kosovo",
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
    city: "Bregu i Diellit",
    state: "Kosovo",
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
    city: "Sunny Hill",
    state: "Kosovo",
    name: "Sunny Hill",
    description:
      "A leafy, family-oriented neighborhood on Prishtina's southern edge, home to the Sunny Hill festival grounds and Germia Park's entrance.",
    crime_score: 20,
    walk_score: 55,
    local_insights: [
      "Minutes from Germia Park's trails and picnic areas",
      "Home to the annual Sunny Hill music festival",
      "Mostly single-family homes and townhouses",
    ],
  },
  {
    city: "Arbëria",
    state: "Kosovo",
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
    city: "Velania",
    state: "Kosovo",
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
    city: "Mati 1",
    state: "Kosovo",
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
    city: "Lakrishte",
    state: "Kosovo",
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
    state: "Kosovo",
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
    state: "Kosovo",
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
] as const;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

function buildAgent() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const name = `${firstName} ${lastName}`;
  return {
    name,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number({ style: "national" }),
    photo_url: `https://i.pravatar.cc/300?u=${encodeURIComponent(name)}`,
    bio: faker.lorem.paragraph(),
  };
}

function buildListing(agentId: string) {
  const propertyType = faker.helpers.arrayElement(PROPERTY_TYPES);
  const cityInfo = faker.helpers.arrayElement(CITIES);
  const isLand = propertyType === "land";
  const status = faker.helpers.arrayElement(STATUSES);

  const beds = isLand ? null : faker.number.int({ min: 1, max: 6 });
  const baths = isLand
    ? null
    : roundToHalf(faker.number.float({ min: 1, max: 4.5 }));
  // Sizes/prices are Kosovo-scale, not converted US numbers: Prishtina
  // apartments/houses run roughly 45-260 m², land parcels a few hundred
  // to ~1.5 hectares, and sale prices around €700-2200/m² depending on
  // neighborhood — nowhere close to US price-per-sqft figures.
  const sqft = isLand ? null : faker.number.int({ min: 45, max: 260 });
  const lotSize = isLand
    ? faker.number.int({ min: 300, max: 15000 })
    : faker.number.int({ min: 80, max: 1200 });
  const yearBuilt = isLand ? null : faker.number.int({ min: 1970, max: 2024 });

  const isRent = status === "for-rent";
  const pricePerSqm = faker.number.int({ min: 700, max: 2200 });
  const price = isLand
    ? faker.number.int({ min: 5000, max: 150000 })
    : isRent
      ? faker.number.int({ min: 200, max: 900 })
      : Math.round(((sqft ?? 70) * pricePerSqm) / 500) * 500;

  const hoaFee =
    propertyType === "condo" || propertyType === "townhouse"
      ? faker.number.int({ min: 15, max: 60 })
      : Math.random() < 0.15
        ? faker.number.int({ min: 10, max: 30 })
        : null;

  const isHotHome = false; // assigned after generation, on a random subset
  const daysOnMarket = faker.number.int({ min: 1, max: 180 });

  const propertyTypeLabel = propertyType.replace("-", " ");
  const title = isLand
    ? `${lotSize.toLocaleString()} m² Lot in ${cityInfo.city}, ${cityInfo.state}`
    : `${beds} Bed, ${baths} Bath ${propertyTypeLabel} in ${cityInfo.city}`;

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
    description: faker.lorem.paragraphs({ min: 2, max: 3 }, "\n\n"),
    price,
    status,
    property_type: propertyType,
    beds,
    baths,
    sqft,
    lot_size: lotSize,
    year_built: yearBuilt,
    address: faker.location.streetAddress(),
    city: cityInfo.city,
    state: cityInfo.state,
    zip: faker.location.zipCode("#####"),
    location: `POINT(${lng} ${lat})`,
    hoa_fee: hoaFee,
    days_on_market: daysOnMarket,
    is_hot_home: isHotHome,
  };
}

async function uploadListingImages(listingId: string, count: number) {
  const bucket = getListingImagesBucket();

  const uploads = await mapWithConcurrency(
    Array.from({ length: count }, (_, i) => i),
    IMAGE_CONCURRENCY,
    async (index) => {
      const seed = `${listingId}-${index}`;
      const res = await fetch(`https://picsum.photos/seed/${seed}/1200/800`);
      if (!res.ok) {
        throw new Error(`picsum fetch failed (${res.status}) for ${seed}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const key = `listings/${listingId}/${index}.jpg`;

      const { error } = await bucket.upload(key, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) throw error;

      return {
        listing_id: listingId,
        url: getListingImagePublicUrl(key),
        sort_order: index,
        is_floor_plan: index === count - 1,
        is_3d_tour: index === count - 2 && Math.random() < 0.4,
      };
    },
  );

  return uploads;
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
    .select("id, city, state");
  if (neighborhoodsError) throw neighborhoodsError;
  const neighborhoodIdByCity = new Map(
    neighborhoods.map((n) => [`${n.city}|${n.state}`, n.id as string]),
  );

  console.log(`Inserting ${AGENT_COUNT} agents...`);
  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .insert(Array.from({ length: AGENT_COUNT }, buildAgent))
    .select("id");
  if (agentsError) throw agentsError;
  const agentIds = agents.map((a) => a.id as string);

  console.log(`Inserting ${LISTING_COUNT} listings...`);
  const listingRows = Array.from({ length: LISTING_COUNT }, () => {
    const row = buildListing(faker.helpers.arrayElement(agentIds));
    return {
      ...row,
      neighborhood_id:
        neighborhoodIdByCity.get(`${row.city}|${row.state}`) ?? null,
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

  console.log(
    `Uploading photos to Supabase Storage for ${listings.length} listings...`,
  );
  let totalImages = 0;
  for (const [i, listing] of listings.entries()) {
    const imageCount = faker.number.int({ min: 15, max: 30 });
    const images = await uploadListingImages(listing.id as string, imageCount);

    const { error: imagesError } = await supabase
      .from("listing_images")
      .insert(images);
    if (imagesError) throw imagesError;

    totalImages += images.length;
    console.log(
      `  [${i + 1}/${listings.length}] ${listing.id} — ${images.length} photos`,
    );
  }

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
