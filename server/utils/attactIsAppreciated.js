// controllers/_helpers.js (or at top of appreciation controller file)
import Appreciation from "../models/appreciation.js";

/**
 * Attach isAppreciated boolean to each doc in `items`.
 * - items: array of docs (with _id)
 * - userId: ObjectId string of requester, or null
 * - targetType: "Post" | "Product"
 */
export async function attachIsAppreciated(items = [], userId = null, targetType) {
  if (!userId || !items || items.length === 0) return items.map(i => ({ ...i, isAppreciated: false }));

  const ids = items.map((it) => it._id ? String(it._id) : String(it));
  const appreciated = await Appreciation.find({
    user: userId,
    target: { $in: ids },
    targetType,
  }).select("target").lean();

  const set = new Set(appreciated.map((a) => String(a.target)));

  return items.map((it) => {
    const copy = { ...it };
    copy.isAppreciated = set.has(String(it._id));
    return copy;
  });
}
