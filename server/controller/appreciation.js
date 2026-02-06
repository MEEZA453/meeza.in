import Appreciation from "../models/appreciation.js";
import User from '../models/user.js'
import Post from '../models/post.js'
import Product from "../models/designs.js";
import mongoose from "mongoose";
import {attachIsAppreciated} from '../utils/attactIsAppreciated.js'
 const DRIP = { APPRECIATION: 20 };
export const appreciate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId, targetType } = req.body;
console.log('appreciating post', targetId, targetType)
    const Model = mongoose.model(targetType);
    const doc = await Model.findById(targetId).select("createdBy postedBy drip appreciateCount");
    console.log ('founded', doc)
    if (!doc) return res.status(404).json({ success: false, message: "Target not found" });

    // create appreciation (unique index prevents duplicates)
    await Appreciation.create({
      user: userId,
      target: targetId,
      targetType,
      owner: { _id: doc.createdBy || doc.postedBy },
    });

    // atomic-ish update and return updated doc
    const updated = await Model.findByIdAndUpdate(
      targetId,
      { $inc: { drip: DRIP.APPRECIATION, appreciationCount: 1 } },
      { new: true }
    ).select("appreciateCount");
    console.log('updated appreciation', updated)
    await User.findByIdAndUpdate(doc.createdBy || doc.postedBy, { $inc: { drip: DRIP.APPRECIATION } });
    console.log('appreciated')
    return res.json({
      success: true,
      appreciationCount: updated ? updated.appreciationCount : undefined,
      isAppreciated: true,
    });
  } catch (err) {
    // already appreciated — return current count + isAppreciated true
    if (err.code === 11000) {
      try {
        const Model = mongoose.model(req.body.targetType);
        const existing = await Model.findById(req.body.targetId).select("appreciateCount").lean();
        console.log(existing)
        return res.json({
          success: true,
          appreciationCount: existing?.appreciationCount ?? 0,
          isAppreciated: true,
        });
      } catch (e) {
        return res.json({ success: true });
      }
    }
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const removeAppreciation = async (req, res) => {
  try {
    const { targetId } = req.body;
    const userId = req.user.id;
console.log('removing the appreciation', targetId,)
    const record = await Appreciation.findOneAndDelete({
      user: userId,
      target: targetId,
    });

    if (!record) return res.json({ success: true }); // nothing to remove

    const Model = mongoose.model(record.targetType);

    const updated = await Model.findByIdAndUpdate(
      targetId,
      { $inc: { drip: -DRIP.APPRECIATION, appreciationCount: -1 } },
      { new: true }
    ).select("appreciateCount");

    await User.findByIdAndUpdate(record.owner._id, { $inc: { drip: -DRIP.APPRECIATION } });

    // ensure not negative (optional safety)
    if (updated && updated.appreciationCount < 0) {
      await Model.findByIdAndUpdate(targetId, { $set: { appreciationCount: 0 } });
    }
console.log('removed appreciation')
    return res.json({
      success: true,
      appreciationCount: updated ? Math.max(0, updated.appreciationCount) : undefined,
      isAppreciated: false,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const getAppreciationsByHandle = async (req, res) => {
  try {
    console.log("getAppreciationsByHandle called");

    const { handle } = req.params;
    const requesterUserId = req.user?.id || null;

    const limit = Math.max(1, parseInt(req.query.limit || "10"));
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const skip = (page - 1) * limit;

    // 1️⃣ Get user
    const user = await User.findOne({ handle }).select("_id").lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2️⃣ Get appreciation IDs ONLY (ordered, lightweight)
    const appreciationDocs = await Appreciation.find({ user: user._id })
      .sort({ createdAt: -1 }) // newest first
      .select("target targetType")
      .lean();

    const total = appreciationDocs.length;

    // empty
    if (total === 0) {
      return res.json({
        success: true,
        items: [],
        count: 0,
        page,
        limit,
        hasMore: false,
        isUser: requesterUserId === String(user._id),
      });
    }

    // 3️⃣ Paginate on array (same as favourites)
    const paginated = appreciationDocs.slice(skip, skip + limit);

    if (paginated.length === 0) {
      return res.json({
        success: true,
        items: [],
        count: total,
        page,
        limit,
        hasMore: false,
        isUser: requesterUserId === String(user._id),
      });
    }

    // 4️⃣ Separate targets by type
    const postIds = paginated
      .filter(a => a.targetType === "Post")
      .map(a => a.target);

    const productIds = paginated
      .filter(a => a.targetType === "Product")
      .map(a => a.target);

    const [posts, products] = await Promise.all([
      postIds.length
        ? Post.find({ _id: { $in: postIds } })
            .populate("createdBy", "name profile handle")
            .lean()
        : [],
      productIds.length
        ? Product.find({ _id: { $in: productIds } })
            .populate("postedBy", "name profile handle")
            .lean()
        : [],
    ]);

    const postMap = new Map(posts.map(p => [String(p._id), p]));
    const productMap = new Map(products.map(p => [String(p._id), p]));

    // 5️⃣ Preserve appreciation order
    const ordered = paginated
      .map(a =>
        a.targetType === "Post"
          ? postMap.get(String(a.target))
          : productMap.get(String(a.target))
      )
      .filter(Boolean); // remove deleted targets

    // 6️⃣ Cleanup: remove broken appreciation records
    if (ordered.length !== paginated.length) {
      const existingIds = new Set([
        ...posts.map(p => String(p._id)),
        ...products.map(p => String(p._id)),
      ]);

      await Appreciation.deleteMany({
        user: user._id,
        target: { $nin: [...existingIds] },
      });
    }

    return res.json({
      success: true,
      items: ordered,
      count: total,
      page,
      limit,
      hasMore: skip + limit < total,
      isUser: requesterUserId === String(user._id),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getAppreciatedPostsByHandle = async (req, res) => {
  try {
    const { handle } = req.params;
    const requesterUserId = req.user?.id || null;
console.log('getting appreciated posts')
    const limit = Math.max(1, parseInt(req.query.limit || "10"));
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const skip = (page - 1) * limit;

    const user = await User.findOne({ handle }).select("_id").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const appreciationDocs = await Appreciation.find({ user: user._id, targetType: "Post" })
      .sort({ createdAt: -1 })
      .select("target")
      .lean();

    const total = appreciationDocs.length;
    if (total === 0) {
      return res.json({
        success: true,
        items: [],
        count: 0,
        page,
        limit,
        hasMore: false,
        isUser: requesterUserId === String(user._id),
      });
    }

    const paginated = appreciationDocs.slice(skip, skip + limit);
    if (paginated.length === 0) {
      return res.json({
        success: true,
        items: [],
        count: total,
        page,
        limit,
        hasMore: false,
        isUser: requesterUserId === String(user._id),
      });
    }

    const postIds = paginated.map(a => a.target);
    const posts = await Post.find({ _id: { $in: postIds } })
      .populate("createdBy", "name profile handle")
      .lean();

    /* 🔥 ADD START: isAppreciated logic */
const postsWithFlag = await attachIsAppreciated(
  posts,
  req.user?.id || null,
  "Post"
);
/* 🔥 ADD END */

    const postMap = new Map(postsWithFlag.map(p => [String(p._id), p]));
    const ordered = postIds.map(id => postMap.get(String(id))).filter(Boolean);

    // cleanup broken records if any
    if (ordered.length !== paginated.length) {
      const existingIds = new Set(posts.map(p => String(p._id)));
      await Appreciation.deleteMany({
        user: user._id,
        targetType: "Post",
        target: { $nin: [...existingIds] },
      });
    }
console.log('got', total, 'appreaciation posts')
    return res.json({
      success: true,
      items: ordered,
      count: total,
      page,
      limit,
      hasMore: skip + limit < total,
      isUser: requesterUserId === String(user._id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getAppreciatedProductsByHandle = async (req, res) => {
  try {
    const { handle } = req.params;
    const requesterUserId = req.user?.id || null;
console.log('getting appreciated product')
    const limit = Math.max(1, parseInt(req.query.limit || "10"));
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const skip = (page - 1) * limit;

    const user = await User.findOne({ handle }).select("_id").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const appreciationDocs = await Appreciation.find({ user: user._id, targetType: "Product" })
      .sort({ createdAt: -1 })
      .select("target")
      .lean();

    const total = appreciationDocs.length;
    if (total === 0) {
      return res.json({
        success: true,
        items: [],
        count: 0,
        page,
        limit,
        hasMore: false,
        isUser: requesterUserId === String(user._id),
      });
    }

    const paginated = appreciationDocs.slice(skip, skip + limit);
    if (paginated.length === 0) {
      return res.json({
        success: true,
        items: [],
        count: total,
        page,
        limit,
        hasMore: false,
        isUser: requesterUserId === String(user._id),
      });
    }

    const productIds = paginated.map(a => a.target);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate("postedBy", "name profile handle")
      .lean();

    /* 🔥 ADD START: isAppreciated logic */
const productsWithFlag = await attachIsAppreciated(
  products,
  req.user?.id || null,
  "Product"
);


    const productMap = new Map(productsWithFlag.map(p => [String(p._id), p]));
    const ordered = productIds.map(id => productMap.get(String(id))).filter(Boolean);

    // cleanup broken records
    if (ordered.length !== paginated.length) {
      const existingIds = new Set(products.map(p => String(p._id)));
      await Appreciation.deleteMany({
        user: user._id,
        targetType: "Product",
        target: { $nin: [...existingIds] },
      });
    }
console.log('got' ,total, 'appreciated prducsts')
    return res.json({
      success: true,
      items: ordered,
      count: total,
      page,
      limit,
      hasMore: skip + limit < total,
      isUser: requesterUserId === String(user._id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// export const getAppreciatedPostsByHandle = async (req, res) => {
//   try {
//     const { handle } = req.params;
//     const requesterUserId = req.user?.id || null;

//     const limit = Math.max(1, parseInt(req.query.limit || "10"));
//     const page = Math.max(1, parseInt(req.query.page || "1"));
//     const skip = (page - 1) * limit;

//     const user = await User.findOne({ handle }).select("_id").lean();
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });

//     const appreciationDocs = await Appreciation.find({ user: user._id, targetType: "Post" })
//       .sort({ createdAt: -1 })
//       .select("target")
//       .lean();

//     const total = appreciationDocs.length;
//     if (total === 0) {
//       return res.json({
//         success: true,
//         items: [],
//         count: 0,
//         page,
//         limit,
//         hasMore: false,
//         isUser: requesterUserId === String(user._id),
//       });
//     }

//     const paginated = appreciationDocs.slice(skip, skip + limit);
//     if (paginated.length === 0) {
//       return res.json({
//         success: true,
//         items: [],
//         count: total,
//         page,
//         limit,
//         hasMore: false,
//         isUser: requesterUserId === String(user._id),
//       });
//     }

//     const postIds = paginated.map(a => a.target);
//     const posts = await Post.find({ _id: { $in: postIds } })
//       .populate("createdBy", "name profile handle")
//       .lean();

//     const postMap = new Map(posts.map(p => [String(p._id), p]));
//     const ordered = postIds.map(id => postMap.get(String(id))).filter(Boolean);

//     // cleanup broken records if any
//     if (ordered.length !== paginated.length) {
//       const existingIds = new Set(posts.map(p => String(p._id)));
//       await Appreciation.deleteMany({
//         user: user._id,
//         targetType: "Post",
//         target: { $nin: [...existingIds] },
//       });
//     }

//     return res.json({
//       success: true,
//       items: ordered,
//       count: total,
//       page,
//       limit,
//       hasMore: skip + limit < total,
//       isUser: requesterUserId === String(user._id),
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// Returns only products appreciated by the handle (paginated)
// export const getAppreciatedProductsByHandle = async (req, res) => {
//   try {
//     const { handle } = req.params;
//     const requesterUserId = req.user?.id || null;

//     const limit = Math.max(1, parseInt(req.query.limit || "10"));
//     const page = Math.max(1, parseInt(req.query.page || "1"));
//     const skip = (page - 1) * limit;

//     const user = await User.findOne({ handle }).select("_id").lean();
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });

//     const appreciationDocs = await Appreciation.find({ user: user._id, targetType: "Product" })
//       .sort({ createdAt: -1 })
//       .select("target")
//       .lean();

//     const total = appreciationDocs.length;
//     if (total === 0) {
//       return res.json({
//         success: true,
//         items: [],
//         count: 0,
//         page,
//         limit,
//         hasMore: false,
//         isUser: requesterUserId === String(user._id),
//       });
//     }

//     const paginated = appreciationDocs.slice(skip, skip + limit);
//     if (paginated.length === 0) {
//       return res.json({
//         success: true,
//         items: [],
//         count: total,
//         page,
//         limit,
//         hasMore: false,
//         isUser: requesterUserId === String(user._id),
//       });
//     }

//     const productIds = paginated.map(a => a.target);
//     const products = await Product.find({ _id: { $in: productIds } })
//       .populate("postedBy", "name profile handle")
//       .lean();

//     const productMap = new Map(products.map(p => [String(p._id), p]));
//     const ordered = productIds.map(id => productMap.get(String(id))).filter(Boolean);

//     // cleanup broken records
//     if (ordered.length !== paginated.length) {
//       const existingIds = new Set(products.map(p => String(p._id)));
//       await Appreciation.deleteMany({
//         user: user._id,
//         targetType: "Product",
//         target: { $nin: [...existingIds] },
//       });
//     }

//     return res.json({
//       success: true,
//       items: ordered,
//       count: total,
//       page,
//       limit,
//       hasMore: skip + limit < total,
//       isUser: requesterUserId === String(user._id),
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// Bonus: get users who appreciated a specific post (useful for modal/tooltip)
export const getPostAppreciations = async (req, res) => {
  try {
    const { postId } = req.params;
    const limit = Math.max(1, parseInt(req.query.limit || "20"));
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const skip = (page - 1) * limit;

    const docs = await Appreciation.find({ target: postId, targetType: "Post" })
      .sort({ createdAt: -1 })
      .populate("user", "name handle profile")
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Appreciation.countDocuments({ target: postId, targetType: "Post" });

    return res.json({
      success: true,
      items: docs.map(d => d.user),
      count: total,
      page,
      limit,
      hasMore: skip + limit < total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};