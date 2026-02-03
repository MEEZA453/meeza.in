import Appreciation from "../models/appreciation";
import User from '../models/user'
import Post from '../models/post'
import Product from "../models/designs";
export const appreciate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId, targetType } = req.body;

    const Model = mongoose.model(targetType);
    const doc = await Model.findById(targetId).select("createdBy postedBy drip");

    if (!doc) return res.status(404).json({ success: false });

    await Appreciation.create({
      user: userId,
      target: targetId,
      targetType,
      owner: {
        _id: doc.createdBy || doc.postedBy,
      },
    });

    // 🔥 DRIP (atomic)
    await Promise.all([
      Model.findByIdAndUpdate(targetId, { $inc: { drip: DRIP.APPRECIATION } }),
      User.findByIdAndUpdate(doc.createdBy || doc.postedBy, {
        $inc: { drip: DRIP.APPRECIATION },
      }),
    ]);

    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000)
      return res.json({ success: true }); // already appreciated
    res.status(500).json({ success: false, message: err.message });
  }
};
export const removeAppreciation = async (req, res) => {
  const { targetId } = req.body;
  const userId = req.user.id;

  const record = await Appreciation.findOneAndDelete({
    user: userId,
    target: targetId,
  });

  if (!record) return res.json({ success: true });

  const Model = mongoose.model(record.targetType);

  await Promise.all([
    Model.findByIdAndUpdate(targetId, { $inc: { drip: -DRIP.APPRECIATION } }),
    User.findByIdAndUpdate(record.owner._id, {
      $inc: { drip: -DRIP.APPRECIATION },
    }),
  ]);

  res.json({ success: true });
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
