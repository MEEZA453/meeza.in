export function cleanWords(text = "") {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 2); // ignore "a", "is", "to"
}

export function extractFromArray(arr = []) {
  let list = [];
  for (const item of arr) {
    if (Array.isArray(item)) list.push(...extractFromArray(item));
    else if (typeof item === "string") list.push(...cleanWords(item));
  }
  return list;
}

export function extractKeywordsProduct(product) {
  let words = [];

  // Name
  words.push(...cleanWords(product.name));

  // Description
  if (product.description)
    words.push(...cleanWords(product.description));

  // Hashtags
  if (product.hashtags)
    words.push(...product.hashtags.map(h => h.toLowerCase()));

  // Sections (title + content)
  if (product.sections?.length > 0) {
    for (const sec of product.sections) {
      words.push(...cleanWords(sec.title));
      words.push(...extractFromArray(sec.content));
    }
  }

  return [...new Set(words)];
}

export function extractKeywordsPost(post) {
  let words = [];

  words.push(...cleanWords(post.name));

  if (post.description)
    words.push(...cleanWords(post.description));

  if (post.hashtags)
    words.push(...post.hashtags.map(h => h.toLowerCase()));

  if (post.category)
    words.push(...post.category.map(c => c.toLowerCase()));

  return [...new Set(words)];
}
import Keyword from "../models/keyword.js";

export async function saveKeywords(list = []) {
  for (const text of list) {
    await Keyword.findOneAndUpdate(
      { text },
      { $inc: { popularity: 1 } },  
      { upsert: true }
    );
  }
}
