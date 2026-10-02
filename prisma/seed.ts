/**
 * Seeds store settings, categories, crops, sample products, pincodes and the
 * Owner admin account. Safe to run more than once (upserts everywhere).
 *
 *   SEED_OWNER_PASSWORD=... npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { storeConfig } from "../src/config/store";
import { PrismaClient, type Season, type Unit } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const settings = {
  store: storeConfig,
  shipping: { flatCharge: 60, freeShippingAbove: null },
  cod: { enabled: true, maxOrderValue: 5000, requireOtp: false },
  orders: { onlinePaymentExpiryMinutes: 15 },
};

const categories = [
  { slug: "seeds", nameHi: "बीज", nameEn: "Seeds", sortOrder: 1 },
  { slug: "plant-tonic", nameHi: "प्लांट टॉनिक", nameEn: "Plant Tonic", sortOrder: 2 },
  { slug: "animal-fodder", nameHi: "पशु चारा", nameEn: "Animal Fodder", sortOrder: 3 },
  { slug: "others", nameHi: "अन्य", nameEn: "Others", sortOrder: 4 },
];

const crops: { slug: string; nameHi: string; nameEn: string; seasons: Season[] }[] = [
  { slug: "soybean", nameHi: "सोयाबीन", nameEn: "Soybean", seasons: ["KHARIF"] },
  { slug: "cotton", nameHi: "कपास", nameEn: "Cotton", seasons: ["KHARIF"] },
  { slug: "maize", nameHi: "मक्का", nameEn: "Maize", seasons: ["KHARIF"] },
  { slug: "wheat", nameHi: "गेहूं", nameEn: "Wheat", seasons: ["RABI"] },
  { slug: "gram", nameHi: "चना", nameEn: "Gram", seasons: ["RABI"] },
  { slug: "garlic", nameHi: "लहसुन", nameEn: "Garlic", seasons: ["RABI"] },
  { slug: "onion", nameHi: "प्याज", nameEn: "Onion", seasons: ["RABI"] },
  { slug: "fodder-jowar", nameHi: "चारा ज्वार", nameEn: "Fodder Sorghum", seasons: ["KHARIF", "ZAID"] },
  { slug: "okra", nameHi: "भिंडी", nameEn: "Okra", seasons: ["KHARIF", "ZAID"] },
];

// Sample products from the client mock-up.
// TODO(client): confirm exact names, pack sizes, MRP, HSN codes and GST rates.
const products: {
  slug: string;
  category: string;
  nameHi: string;
  nameEn: string;
  subLabelHi: string;
  descriptionHi: string;
  benefitsHi: string[];
  hsnCode: string;
  gstRate: string;
  crops: string[];
  variant: { sku: string; packSize: string; unit: Unit; label: string; mrp: string; price: string };
}[] = [
  {
    slug: "tarvarth-power-plant-tonic",
    category: "plant-tonic",
    nameHi: "तार्वर्त पावर",
    nameEn: "Tarvarth Power",
    subLabelHi: "(प्लांट टॉनिक)",
    descriptionHi:
      "तार्वर्त पावर एक शक्तिशाली प्लांट टॉनिक है जो पौधों की वृद्धि, फूल और फल बनने की प्रक्रिया को तेजी से बढ़ाता है और उपज में वृद्धि करता है। यह सभी प्रकार की फसलों के लिए उपयोगी है।",
    benefitsHi: [
      "तेज असर और बेहतर परिणाम",
      "सभी फसलों के लिए उपयोगी",
      "पौधों की रोग प्रतिरोधक क्षमता बढ़ाए",
      "उपज में वृद्धि",
    ],
    hsnCode: "3101",
    gstRate: "5",
    crops: ["soybean", "cotton", "wheat", "gram", "onion", "garlic"],
    variant: { sku: "MK-TP-1L", packSize: "1", unit: "LTR", label: "1 लीटर", mrp: "700", price: "650" },
  },
  {
    slug: "csv-33-mf-fodder-jowar",
    category: "animal-fodder",
    nameHi: "CSV 33 MF",
    nameEn: "CSV 33 MF",
    subLabelHi: "(चारे के लिए ज्वार)",
    descriptionHi:
      "CSV 33 MF चारे के लिए ज्वार की उन्नत किस्म है, जो पशुओं के लिए पौष्टिक और भरपूर हरा चारा देती है।",
    benefitsHi: ["अधिक हरा चारा", "कई कटाई", "पशुओं के लिए पौष्टिक"],
    hsnCode: "1209",
    gstRate: "0",
    crops: ["fodder-jowar"],
    variant: { sku: "MK-CSV33-1KG", packSize: "1", unit: "KG", label: "1 किलो", mrp: "900", price: "850" },
  },
  {
    slug: "rustam-99-cotton-seed",
    category: "seeds",
    nameHi: "RUSTAM 99",
    nameEn: "RUSTAM 99",
    subLabelHi: "(कॉटन बीज)",
    descriptionHi: "RUSTAM 99 कपास का उन्नत बीज है, जो अच्छी पैदावार और मजबूत पौधों के लिए जाना जाता है।",
    benefitsHi: ["अच्छी पैदावार", "मजबूत पौधे", "बड़े टिंडे"],
    hsnCode: "1207",
    gstRate: "0",
    crops: ["cotton"],
    variant: {
      sku: "MK-RUSTAM99-450G",
      packSize: "450",
      unit: "GM",
      label: "450 ग्राम",
      mrp: "1350",
      price: "1250",
    },
  },
  {
    slug: "bhindi-hybrid-seed",
    category: "seeds",
    nameHi: "भिंडी बीज",
    nameEn: "Okra Seed",
    subLabelHi: "(हाइब्रिड क्वालिटी)",
    descriptionHi: "हाइब्रिड क्वालिटी का भिंडी बीज — अच्छा अंकुरण, हरी और चमकदार फलियाँ।",
    benefitsHi: ["अच्छा अंकुरण", "हरी और चमकदार फलियाँ", "लगातार तुड़ाई"],
    hsnCode: "1209",
    gstRate: "0",
    crops: ["okra"],
    variant: {
      sku: "MK-BHINDI-250G",
      packSize: "250",
      unit: "GM",
      label: "250 ग्राम",
      mrp: "500",
      price: "450",
    },
  },
];

const pincodes = [
  { pincode: "457550", city: "Sailana", district: "Ratlam", etaDays: 1 },
  { pincode: "457001", city: "Ratlam", district: "Ratlam", etaDays: 1 },
  { pincode: "457226", city: "Jaora", district: "Ratlam", etaDays: 2 },
];

async function seedOwner() {
  const email = (process.env.SEED_OWNER_EMAIL ?? storeConfig.email).trim().toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD;
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`• Owner ${email} already exists — password unchanged`);
    return;
  }
  if (!password || password.length < 10) {
    throw new Error("Set SEED_OWNER_PASSWORD (min. 10 characters) to create the Owner account.");
  }
  await db.adminUser.create({
    data: { name: "Owner", email, role: "OWNER", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`• Owner account created: ${email}`);
}

async function main() {
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  for (const c of crops) {
    await db.crop.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  for (const p of pincodes) {
    await db.serviceablePincode.upsert({ where: { pincode: p.pincode }, update: p, create: p });
  }

  // Sample products with opening stock — skip in production: SEED_SAMPLE_PRODUCTS=false
  const sampleProducts = process.env.SEED_SAMPLE_PRODUCTS === "false" ? [] : products;
  if (!sampleProducts.length) console.log("• Sample products skipped (SEED_SAMPLE_PRODUCTS=false)");
  for (const p of sampleProducts) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: p.category } });
    const data = {
      nameHi: p.nameHi,
      nameEn: p.nameEn,
      subLabelHi: p.subLabelHi,
      descriptionHi: p.descriptionHi,
      benefitsHi: p.benefitsHi,
      hsnCode: p.hsnCode,
      gstRate: p.gstRate,
      licenceNo: storeConfig.licenceNo,
      isFeatured: true,
      categoryId: category.id,
    };
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });

    for (const cropSlug of p.crops) {
      const crop = await db.crop.findUniqueOrThrow({ where: { slug: cropSlug } });
      await db.productCrop.upsert({
        where: { productId_cropId: { productId: product.id, cropId: crop.id } },
        update: {},
        create: { productId: product.id, cropId: crop.id },
      });
    }

    const { sku, ...variantData } = p.variant;
    const variant = await db.productVariant.upsert({
      where: { sku },
      update: variantData,
      create: { sku, productId: product.id, ...variantData },
    });

    const { _min } = await db.productVariant.aggregate({
      where: { productId: product.id, isActive: true },
      _min: { price: true },
    });
    await db.product.update({ where: { id: product.id }, data: { minPrice: _min.price } });

    // Opening stock: one batch per variant, only on the first run.
    const batchNo = "OPENING-001";
    const batch = await db.inventoryBatch.findUnique({
      where: { variantId_batchNo: { variantId: variant.id, batchNo } },
    });
    if (!batch) {
      const qty = 50;
      const created = await db.inventoryBatch.create({
        data: { variantId: variant.id, batchNo, qtyReceived: qty, qtyAvailable: qty },
      });
      await db.stockMovement.create({
        data: {
          variantId: variant.id,
          batchId: created.id,
          type: "PURCHASE",
          quantity: qty,
          reason: "Opening stock (seed)",
        },
      });
    }
  }

  await db.counter.upsert({ where: { key: "order" }, update: {}, create: { key: "order", value: 10000 } });

  await seedOwner();
  console.log("✓ Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
