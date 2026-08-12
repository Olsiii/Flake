// Seeds ~75 mock listings across a handful of real US cities (so map search
// has believable clusters), each with photos uploaded to R2 and 10 mock
// agents to assign them to. Rerunnable: clears previously seeded rows first.
//
// Photos come from picsum.photos (free, no API key, no rate-limit auth) —
// there's no free *real-estate-specific* photo API left that doesn't need a
// key (Unsplash Source, which used to serve keyworded photos, was shut down
// in 2023), so these are generic placeholder photos, not actual house
// photography. They're fetched at seed time and never committed to git.
import { config } from "dotenv";
import { faker } from "@faker-js/faker";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName, getR2PublicUrl } from "../src/lib/r2";
import { getSupabaseAdmin } from "../src/lib/supabase-admin";

config({ path: ".env.local" });

const CITIES = [
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321 },
  { city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918 },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  { city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074 },
  { city: "Raleigh", state: "NC", lat: 35.7796, lng: -78.6382 },
  { city: "Portland", state: "OR", lat: 45.5152, lng: -122.6784 },
  { city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589 },
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
  const sqft = isLand ? null : faker.number.int({ min: 650, max: 5200 });
  const lotSize = isLand
    ? faker.number.int({ min: 5000, max: 217800 })
    : faker.number.int({ min: 1200, max: 20000 });
  const yearBuilt = isLand ? null : faker.number.int({ min: 1950, max: 2024 });

  const isRent = status === "for-rent";
  const pricePerSqft = faker.number.int({ min: 180, max: 620 });
  const price = isLand
    ? faker.number.int({ min: 40000, max: 650000 })
    : isRent
      ? faker.number.int({ min: 1200, max: 6500 })
      : Math.round(((sqft ?? 1500) * pricePerSqft) / 500) * 500;

  const hoaFee =
    propertyType === "condo" || propertyType === "townhouse"
      ? faker.number.int({ min: 150, max: 750 })
      : Math.random() < 0.15
        ? faker.number.int({ min: 50, max: 300 })
        : null;

  const isHotHome = false; // assigned after generation, on a random subset
  const daysOnMarket = faker.number.int({ min: 1, max: 180 });

  const propertyTypeLabel = propertyType.replace("-", " ");
  const title = isLand
    ? `${lotSize.toLocaleString()} sqft Lot in ${cityInfo.city}, ${cityInfo.state}`
    : `${beds} Bed, ${baths} Bath ${propertyTypeLabel} in ${cityInfo.city}`;

  const lat = cityInfo.lat + faker.number.float({ min: -0.08, max: 0.08 });
  const lng = cityInfo.lng + faker.number.float({ min: -0.08, max: 0.08 });

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
  const client = getR2Client();
  const bucket = getR2BucketName();

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

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: "image/jpeg",
        }),
      );

      return {
        listing_id: listingId,
        url: getR2PublicUrl(key),
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

  console.log(`Inserting ${AGENT_COUNT} agents...`);
  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .insert(Array.from({ length: AGENT_COUNT }, buildAgent))
    .select("id");
  if (agentsError) throw agentsError;
  const agentIds = agents.map((a) => a.id as string);

  console.log(`Inserting ${LISTING_COUNT} listings...`);
  const listingRows = Array.from({ length: LISTING_COUNT }, () =>
    buildListing(faker.helpers.arrayElement(agentIds)),
  );

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

  console.log(`Uploading photos to R2 for ${listings.length} listings...`);
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
  console.log(`  agents:   ${agentIds.length}`);
  console.log(`  listings: ${listings.length} (${hotHomeCount} hot homes)`);
  console.log(`  images:   ${totalImages}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
