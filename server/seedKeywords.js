import mongoose from "mongoose";
import dotenv from "dotenv";
import Keyword from "./models/keyword.js";

dotenv.config(); // <-- load .env

const MONGO_URL = process.env.MONGO_URL_PROD;

if (!MONGO_URL) {
  console.error("❌ MONGO_URL is missing in environment variables");
  process.exit(1);
}

const categories = [
  {
    name: "Fashion",
    subcategories: [
      "Apparel Design",
      "Accessory Design",
      "Textile Design",
      "Fashion Styling",
      "Trend Forecasting",
    ],
  },
  {
    name: "Design",
    subcategories: [
      "Graphic Design",
      "Visual Design",
      "Branding",
      "UI/UX Design",
      "Poster Design",
      "Illustration",
    ],
  },
  {
    name: "Photography",
    subcategories: [
      "Fashion Photography",
      "Portrait Photography",
      "Editorial Photography",
      "Lifestyle Photography",
      "Product Photography",
    ],
  },
  {
    name: "Creativity",
    subcategories: [
      "Creative Direction",
      "Content Creation",
      "Social Media Visuals",
      "Campaign Design",
      "Visual Storytelling",
    ],
  },
];

const extraKeywords = {
  industry: ["Fashion", "Design", "Photography"],

  type: [
    "Illustration",
    "Pattern",
    "Mockup",
    "Template",
    "Preset",
    "Tech Pack",
    "3D Garment",
    "Guide",
    "Branding Kit",
    "Photo Pack",
  ],

  category: {
    Fashion: [
      "Fashion Sketch",
      "Croquis Template",
      "Flat Sketch",
      "Textile Pattern",
      "Surface Print",
      "Seamless Design",
      "Apparel Mockup",
      "Accessory Mockup",
      "CLO3D Garment",
      "Accessory Model",
      "Trend Report",
      "Portfolio Template",
      "Fashion Guide",
      "Tech Pack Spec Sheet",
      "Measurement Sheet",
    ],
    Design: [
      "Logo Pack",
      "Typography Kit",
      "Color Palette",
      "Social Media Template",
      "Poster Mockup",
      "Packaging Mockup",
      "Portfolio Layout",
      "Creative Illustration",
      "Pattern Pack",
      "Design Guide",
    ],
    Photography: [
      "Lightroom Preset",
      "Color LUT",
      "Styled Stock Photos",
      "Editorial Photo Pack",
      "Retouch Overlay",
      "Photography Guide",
    ],
  },

  format: [
    "PSD",
    "AI",
    "PDF",
    "PNG",
    "JPG",
    "SVG",
    "CANVA",
    "ZPRJ",
    "OBJ",
    "FBX",
    "MP4",
    "Lightroom Preset (.xmp)",
    "CUBE",
    "ZIP",
  ],

  licenseType: ["Personal", "Commercial", "Extended"],

  softwareCompatibility: [
    "Photoshop",
    "Illustrator",
    "Canva",
    "Figma",
    "InDesign",
    "CLO3D",
    "Marvelous Designer",
    "Lightroom",
    "Premiere Pro",
    "After Effects",
  ],

  resolution: [
    "1080p (HD)",
    "2K",
    "4K",
    "8K",
    "300 DPI",
    "600 DPI",
    "Vector (Scalable)",
  ],
};

// ---------------------------
// HELPERS
// ---------------------------

function normalize(text) {
  return text?.trim();
}

async function saveKeyword(text) {
  const clean = normalize(text);
  if (!clean) return;

  await Keyword.findOneAndUpdate(
    { text: clean },
    { $setOnInsert: { text: clean }, $inc: { popularity: 1 } },
    { upsert: true }
  );

  console.log("✔ Added keyword:", clean);
}

// ---------------------------
// SEED FUNCTION
// ---------------------------
async function seed() {
  try {
    console.log("🌐 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Seed main categories + subcategories
    for (const c of categories) {
      await saveKeyword(c.name);
      for (const sub of c.subcategories) {
        await saveKeyword(sub);
      }
    }

    // Seed extra keyword groups
    for (const group of Object.keys(extraKeywords)) {
      const data = extraKeywords[group];

      if (Array.isArray(data)) {
        for (const item of data) {
          await saveKeyword(item);
        }
      } else {
        for (const key of Object.keys(data)) {
          for (const item of data[key]) {
            await saveKeyword(item);
          }
        }
      }
    }

    console.log("🎉 Keyword seeding complete!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
