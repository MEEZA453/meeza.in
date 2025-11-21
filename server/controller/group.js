// controller/group.js
import Group from "../models/group.js";
import Product from "../models/designs.js";
import User from "../models/user.js";
import ContributionRequest from "../models/contributionRequest.js";
import Notification from "../models/notification.js";
import { cloudinary , getCloudinaryPublicId} from "../config/cloudinery.js";
import notification from "../models/notification.js";
// helper to check if user is owner
const isOwner = (group, userId) => group.owner.toString() === userId.toString();
// helper to check if admin (owner included)
const isAdminOrOwner = (group, userId) =>
  isOwner(group, userId) || (group.admins || []).some(a => a.toString() === userId.toString());

// Create group
export const createGroup = async (req, res) => {
  try {
    console.log('creating a group')
    const { name, about, visibility ,bio, website, instagram } = req.body;
    const owner = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    let profileUrl = null;

    // ✅ Upload to Cloudinary if image provided
    if (req.file && req.file.path) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "groups",
      });
      profileUrl = result.secure_url;
    }

    const group = new Group({
      name,
      about,
      bio,
      instagram,
      website,
      profile: profileUrl,
      visibility,
      owner,
    });
console.log(group)
    await group.save();

    return res.status(201).json({ success: true, group });
  } catch (error) {
    console.error("createGroup error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const getGroupsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const groups = await Group.find({ products: productId })
      .select("name profile products contributors createdAt")
      .populate("contributors", "name profileImage");

    const formattedGroups = groups.map(group => {
      const totalItems = group.products.length;

      const productContributions = group.products.filter(
        p => p.toString() === productId
      ).length;

      return {
        _id: group._id,
        name: group.name,
        profile: group.profile, // 🔥 NOW SENDING IT
        noOfItems: totalItems,
        noOfContributions: productContributions,
      };
    });

    res.status(200).json({ success: true, data: formattedGroups });
  } catch (err) {
    console.error("Error fetching groups by product:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Edit group (only owner can edit core details)
export const editGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, about, visibility, bio, instagram, website } = req.body;
console.log('editing the grupu', id , name , about, visibility, bio, instagram, website)
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isOwner(group, req.user.id)) return res.status(403).json({ success: false, message: "Forbidden" });

    // ✅ If a new profile image is uploaded
    if (req.file && req.file.path) {
      if (group.profile) {
        const publicId = getCloudinaryPublicId(group.profile);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "groups" });
      group.profile = result.secure_url;
    }

    // Update other fields
    group.name = name || group.name;
    group.about = about || group.about;
    group.visibility = visibility || group.visibility;
    group.bio = bio || group.bio;
    group.instagram = instagram || group.instagram
    group.website = website || group.website
    await group.save();
    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("editGroup:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const updateGroupSubscription = async (req, res) => {

  try {
    const { groupId, action } = req.body; 
    console.log('trying to subscribe with:', groupId, action)
    // action can be: "subscribe", "unsubscribe", "toggleNotification"
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const existing = user.subscribedGroups.find(
      (s) => s.group.toString() === groupId
    );

    // ---- SUBSCRIBE ----
    if (action === "subscribe") {
      if (existing)
        return res.status(200).json({ success: true, message: "Already subscribed." });

      user.subscribedGroups.push({
        group: groupId,
        notificationsEnabled: false,
      });
      group.subscribers.push(userId);
      await user.save();
      await group.save();
      console.log('subscribed')
            const recipients = [
        group.owner,
        ...(Array.isArray(group.admins) ? group.admins : []),
      ];

      const notificationDocs = recipients.map((r) => ({
        recipient: r,
        sender: userId,
        type: "subscribe", // ⭐ NEW TYPE YOU ASKED FOR
        message: `${user.handle || "Someone"} subscribed to your group ${group.name}`,
        meta: {
          groupId: group._id,
          groupName: group.name,
          groupProfile: group.profile || null,
          contributorHandle: user.handle || null,
          contributorProfile: user.profile || null,
          extra: {
            subscriberId: userId,
          }
        }
      }));

      await Notification.insertMany(notificationDocs);
      return res.status(200).json({
        success: true,
        message: "Subscribed to group.",
        subscribed: true,
        notificationsEnabled: false,
      });
    }

    // ---- UNSUBSCRIBE ----
    if (action === "unsubscribe") {
      user.subscribedGroups = user.subscribedGroups.filter(
        (s) => s.group.toString() !== groupId
      );
      group.subscribers = group.subscribers.filter(
        (id) => id.toString() !== userId
      );
      await user.save();
      await group.save();

      return res.status(200).json({
        success: true,
        message: "Unsubscribed from group.",
        subscribed: false,
      });
    }
console.log('unsubscribed')
    // ---- TOGGLE NOTIFICATION ----
    if (action === "toggleNotification") {
      if (!existing)
        return res.status(400).json({
          success: false,
          message: "Subscribe first to enable notifications.",
        });

      existing.notificationsEnabled = !existing.notificationsEnabled;
      await user.save();
console.log('notification toggled')
      return res.status(200).json({
        success: true,
        message: `Notifications ${
          existing.notificationsEnabled ? "enabled" : "disabled"
        } for this group.`,
        notificationsEnabled: existing.notificationsEnabled,
      });
    }
console.log('done')
    return res.status(400).json({ success: false, message: "Invalid action." });
  } catch (error) {
    console.error("updateGroupSubscription error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete group (owner only)
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting a group', id);

    const group = await Group.findById(id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (!isOwner(group, req.user.id))
      return res
        .status(403)
        .json({ success: false, message: "Forbidden" });

    // Delete all related contribution requests
    await ContributionRequest.deleteMany({ group: group._id });

    // ✅ Correct deletion
    await group.deleteOne();

    return res.status(200).json({ success: true, message: "Group deleted" });
  } catch (error) {
    console.error("deleteGroup:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

// Get all groups (lightweight fields)
export const getAllGroups = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "10", 10);
    const page = parseInt(req.query.page || "1", 10);

    console.log("getting all groups", page, limit);

    const totalCount = await Group.countDocuments({});
    if (totalCount === 0)
      return res.status(200).json({
        success: true,
        groups: [],
        page,
        limit,
        count: 0,
      });

    const groups = await Group.find({})
      .select("name profile createdAt owner products contributors subscribers")
      .populate({ path: "owner", select: "handle profile _id" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // map to required shape
    const shaped = groups.map((g) => ({
      _id: g._id,
      name: g.name,
      profile: g.profile,
      owner: g.owner,
      noOfContributors: (g.contributors || []).length,
      noOfProducts: (g.products || []).length,
      totalSubscribers: (g.subscribers || []).length,
      createdAt: g.createdAt,
    }));
console.log('got all groups')
    return res.status(200).json({
      success: true,
      groups: shaped,
      page,
      limit,
      count: totalCount,
      hasMore: page * limit < totalCount,
    });
  } catch (error) {
    console.error("getAllGroups:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const searchGroups = async (req, res) => {

  try {
    const { query } = req.query;
    const userId = req.user?.id;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const groups = await Group.find({
      name: { $regex: query, $options: "i" },
    })
      .select("name profile owner contributors products subscribers createdAt")
      .populate({ path: "owner", select: "handle profile _id" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // ✅ Same shape as getAllGroups
    const shaped = groups.map((g) => ({
      _id: g._id,
      name: g.name,
      profile: g.profile,
      owner: g.owner,
      noOfContributors: (g.contributors || []).length,
      noOfProducts: (g.products || []).length,
      totalSubscribers: (g.subscribers || []).length,
      createdAt: g.createdAt,
      isMyGroup: userId ? g.owner?._id.toString() === userId.toString() : false,
    }));

    return res.status(200).json({
      success: true,
      groups: shaped, // ✅ same key as getAllGroups
      page,
      limit,
      count: shaped.length,
      hasMore: shaped.length === limit, // ✅ consistent pagination indicator
    });
  } catch (error) {
    console.error("❌ Error in searchGroups:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// Get group by id (all group details but not listing products)
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    console.log('getting one group ', userId);

    const group = await Group.findById(id)
      .populate({ path: "owner", select: "handle profile _id" })
      .populate({ path: "admins", select: "handle profile _id" })
      .lean();

    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    // ✅ default flags
    let isSubscribed = false;
    let notificationsEnabled = false;
    let isMyGroup = false;

    // ✅ add computed counts
    const result = {
      ...group,
      noOfProducts: (group.products || []).length,
      noOfContributors: (group.contributors || []).length,
      totalSubscribers: (group.subscribers || []).length, // ✅ Added here
    };

    // ✅ Check if logged in
    if (userId) {
      // 1️⃣ Check ownership
      if (group.owner?._id?.toString() === userId.toString()) {
        isMyGroup = true;
      }

      // 2️⃣ Check if subscribed (exists in group.subscribers)
      if (group.subscribers?.some((u) => u.toString() === userId.toString())) {
        isSubscribed = true;
      }

      // 3️⃣ Fetch user to check notification status
      const user = await User.findById(userId)
        .select("subscribedGroups")
        .lean();

      if (user?.subscribedGroups?.length) {
        const sub = user.subscribedGroups.find(
          (g) => g.group.toString() === id.toString()
        );
        if (sub) {
          isSubscribed = true;
          notificationsEnabled = sub.notificationsEnabled;
        }
      }
    }

    return res.status(200).json({
      success: true,
      group: {
        ...result,
        isSubscribed,
        notificationsEnabled,
        isMyGroup,
      },
    });
  } catch (error) {
    console.error("getGroupById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};



// Get products by group id (full product docs with minimal owner info) - paginated
export const getProductsByGroupId = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit || "10", 10);
    const page = parseInt(req.query.page || "1", 10);

    console.log("getting product by group id", page, limit);

    const group = await Group.findById(id).select("products");
    if (!group)
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });

    const totalCount = group.products.length;
    if (totalCount === 0)
      return res.status(200).json({
        success: true,
        products: [],
        page,
        limit,
        count: 0,
      });

    // Calculate pagination bounds
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(page * limit, totalCount);

    // Slice only the relevant product IDs from the group
    const productIds = group.products.slice(startIndex, endIndex);

    // Fetch only those products
    const products = await Product.find({ _id: { $in: productIds } })
      .sort({ createdAt: -1 }) // keeps newest first
      .populate({ path: "postedBy", select: "profile handle _id" })
      .lean();

    return res.status(200).json({
      success: true,
      products,
      page,
      limit,
      count: totalCount,
      hasMore: endIndex < totalCount,
    });
  } catch (error) {
    console.error("getProductsByGroupId:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};


// Get contributors by group id (handle, profile, _id)
// Get contributors by group id (paginated)
export const getContributorsByGroupId = async (req, res) => {
  console.log("getting contributors");
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit || "10", 10);
    const page = parseInt(req.query.page || "1", 10);

    console.log("getting contributors by group id", page, limit);

    const group = await Group.findById(id).select("contributors products owner admins");
    if (!group)
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });

    const totalCount = group.contributors.length;
    if (totalCount === 0)
      return res.status(200).json({
        success: true,
        contributors: [],
        page,
        limit,
        count: 0,
      });

    // Pagination bounds
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(page * limit, totalCount);

    // Slice contributor IDs for current page
    const contributorIds = group.contributors.slice(startIndex, endIndex);

    // Fetch contributors’ basic info
    let contributors = await User.find({ _id: { $in: contributorIds } })
      .select("handle profile _id passion")
      .lean();

    // ⭐ Remove undefined contributors safely
    contributors = contributors.filter(c => c && c._id);

    // Count how many products each contributor has in this group
    const productCounts = await Product.aggregate([
      { $match: { _id: { $in: group.products } } },
      { $group: { _id: "$postedBy", count: { $sum: 1 } } },
    ]);

    // Convert to lookup map
    const countMap = {};
    productCounts.forEach((p) => {
      if (p._id) countMap[p._id.toString()] = p.count;
    });

    // Attach contributionCount + role safely
    const enrichedContributors = contributors.map((c) => {
      const userIdStr = c._id.toString();
      let role = "contributor";

      if (group.owner && group.owner.toString() === userIdStr) {
        role = "owner";
      } else if (
        Array.isArray(group.admins) &&
        group.admins.some(a => a && a.toString() === userIdStr)
      ) {
        role = "admin";
      }

      return {
        ...c,
        role,
        contributionCount: countMap[userIdStr] || 0,
      };
    });



    return res.status(200).json({
      success: true,
      contributors: enrichedContributors,
      page,
      limit,
      count: totalCount,
      hasMore: endIndex < totalCount,
    });
  } catch (error) {
    console.error("getContributorsByGroupId:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const canUserAddDirectly = (group, userId) => {
  const isOwner = group.owner.toString() === userId.toString();
  const isAdmin = group.admins?.some(a => a.toString() === userId.toString());

  switch (group.directAddPermission) {
    case "owner_only":
      return isOwner;

    case "admins_and_owner":
      return isOwner || isAdmin;

    case "everyone":
      return true;

    default:
      return isOwner || isAdmin; // fallback
  }
};
// Send contribution request (normal user -> create ContributionRequest, notify owner/admins)
export const sendContributionRequest = async (req, res) => {
  console.log('sending contribution request');
  try {
    const { groupId, productIds, message } = req.body; // <-- productIds array
    const requester = req.user.id;
 
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: "productIds array required" });
    }

    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    const results = [];  // store each product’s result

    // helper to compare ids safely
    const eqId = (a, b) => (a && b) ? a.toString() === b.toString() : false;

    for (const productIdRaw of productIds) {
      const productId = productIdRaw; // keep original type, but use toString comparisons below

      // --------- ALREADY IN GROUP CHECK ----------
      const alreadyInGroup = (group.products || []).some(p => eqId(p, productId));
      if (alreadyInGroup) {
        console.log('already in group free you ass')
        results.push({ productId, status: "already_in_group" });
        continue;
      }

      // --------- DIRECT ADD (same logic as before) ----------
      if (canUserAddDirectly(group, requester)) {
        // Add product & contributor
        if (!(group.products || []).some(p => eqId(p, productId))) group.products.push(productId);
        if (!(group.contributors || []).some(c => eqId(c, requester))) group.contributors.push(requester);
        await group.save();

        await Notification.create({
          recipient: requester,
          sender: req.user.id,
          type: "group_contribution_approved",
          message: `Your product was added to group ${group.name}`,
          meta: { assetId: productId, extra: { groupId: group._id } },
        });

        results.push({ productId, status: "direct_added" });
        continue; // next product
      }

      // --------- PENDING REQUEST CHECK ----------
 

      // fetch product once (used for image) — if product doesn't exist, mark and skip
      const product = await Product.findById(productId).lean();
      if (!product) {
        results.push({ productId, status: "product_not_found" });
        continue;
      }

      // If existing pending request found -> still notify admins/owner again
     const existing = await ContributionRequest.findOne({
  group: groupId,
  product: productId,
  requester,
  status: "pending",
});

// If pending request exists → DO NOT send again
if (existing) {
  console.log('request already pending for product', productId);
  results.push({
    productId,
    status: "already_pending",
    requestId: existing._id
  });
  continue;
}
      // --------- CREATE NEW CONTRIBUTION REQUEST ----------
      const reqDoc = new ContributionRequest({
        group: groupId,
        product: productId,
        requester,
        message
      });
      await reqDoc.save();
 

      // ---------- NOTIFY OWNER + ADMINS ----------
      const recipients = [group.owner, ...(group.admins || [])];

      const notifications = recipients.map(r => ({
    
        recipient: r,
        sender: requester,
        type: "group_contribution_request",
        message: `${req.user.handle || req.user.id} wants to contribute a product to ${group.name}`,
        meta: {
          assetId: productId,
          postId: null,
          assetImage: Array.isArray(product.image) ? product.image[0] : product.image || product.preview || null,
          groupId: group._id,
          groupName: group.name,
          groupProfile: group.profile || null,
          contributorHandle: req.user.handle || null,
          contributorProfile: req.user.profile || null,
          extra: { requestId: reqDoc._id }
        }
      }));

      if (notifications.length) await Notification.insertMany(notifications);

      results.push({ productId, status: "request_created", request: reqDoc });
    } // end for

    console.log('sent contribution request');
    return res.status(200).json({
      success: true,
      results,   // array of results for each product
    });

  } catch (error) {
    console.error("sendContributionRequest:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



// Accept contribution (admin or owner)
export const acceptContribution = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
console.log('accepting contribution', requestId, userId)
    const reqDoc = await ContributionRequest.findById(requestId).populate("group product requester");
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });
    const group = await Group.findById(reqDoc.group._id);
    if (!isAdminOrOwner(group, userId)) return res.status(403).json({ success: false, message: "Forbidden" });

    // Add product to group if not present
    if (!group.products.includes(reqDoc.product._id)) group.products.push(reqDoc.product._id);
    if (!group.contributors.includes(reqDoc.requester._id)) group.contributors.push(reqDoc.requester._id);
    await group.save();

    // Update request
    reqDoc.status = "accepted";
    reqDoc.handledBy = userId;
    reqDoc.handledAt = new Date();
    await reqDoc.save();
console.log('contribution accepted')

 await Notification.create({
  recipient: reqDoc.requester._id,
  sender: userId,
  type: "group_contribution_approved",
  message: `Your contribution to ${group.name} was accepted.`,
  meta: { 
    assetId: reqDoc.product._id,
    assetImage: reqDoc.product?.image?.[0] || reqDoc.product?.preview || null,

    groupId: group._id,
    groupName: group.name,
    groupProfile: group.profile || null,

    extra: { 
      requestId: reqDoc._id 
    }
  }
});
const subscribers = await User.find({
  "subscribedGroups.group": group._id,
  "subscribedGroups.notificationsEnabled": true,
}).select("_id");

const contributorId = reqDoc.requester._id.toString();
const ownerId = group.owner.toString();

const recipients = subscribers
  .map(u => u._id.toString())
  .filter(id => id !== contributorId && id !== ownerId);

if (recipients.length > 0) {
  const product = reqDoc.product;

  const productImage =
    Array.isArray(product.image) && product.image.length > 0
      ? product.image[0]
      : product.preview || null;

  const contributorUser = await User.findById(contributorId)
    .select("handle profile")
    .lean();

  const notifications = recipients.map(r => ({
    recipient: r,
    sender: contributorId, // the one whose post was accepted
    type: "group_post",
    message: `New product added in ${group.name}`,
    meta: {
      groupId: group._id,
      groupName: group.name,
      groupProfile: group.profile || null,
      assetId: product._id,
      assetImage: productImage,
      contributorHandle: contributorUser?.handle || "",
      contributorProfile: contributorUser?.profile || "",
      isMultiple: false, // since accept is always single
      addedByRequest: true,
    },
  }));

  await Notification.insertMany(notifications);
  console.log(`📢 Notified ${recipients.length} subscribers after request acceptance`);
}

    return res.status(200).json({ success: true, message: "Contribution accepted" });
  } catch (error) {
    console.error("acceptContribution:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reject contribution (admin or owner)
export const rejectContribution = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
console.log('rejecting contribution', requestId, userId)
    const reqDoc = await ContributionRequest.findById(requestId).populate("group product requester");
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });
    const group = await Group.findById(reqDoc.group._id);
    if (!isAdminOrOwner(group, userId)) return res.status(403).json({ success: false, message: "Forbidden" });

    reqDoc.status = "rejected";
    reqDoc.handledBy = userId;
    reqDoc.handledAt = new Date();
    await reqDoc.save();
console.log('contribution rejected')
    // Notify requester
  await Notification.create({
  recipient: reqDoc.requester._id,
  sender: userId,
  type: "group_contribution_rejected",
  message: `Your contribution to ${group.name} was rejected.`,
  meta: { 
    assetId: reqDoc.product._id,
assetImage: reqDoc.product?.image?.[0] || reqDoc.product?.preview || null,

    groupId: group._id,
    groupName: group.name,
    groupProfile: group.profile || null,

    extra: { 
      requestId: reqDoc._id 
    }
  }
});
console.log(reqDoc.product?.image?.[0])
    return res.status(200).json({ success: true, message: "Contribution rejected" });
  } catch (error) {
    console.error("rejectContribution:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Make a user an admin (owner only)
export const makeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIdToMakeAdmin } = req.body;
    console.log('making admin', groupId, userIdToMakeAdmin)
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isOwner(group, req.user.id)) return res.status(403).json({ success: false, message: "Forbidden" });

    if (!group.admins.includes(userIdToMakeAdmin)) group.admins.push(userIdToMakeAdmin);
    await group.save();
console.log('made admin')
    // optional notification
 await Notification.create({
      recipient: userIdToMakeAdmin,
      sender: req.user.id,
      type: "become_admin",        // ⭐ NEW TYPE
      message: `You were made an admin of ${group.name}`,
      meta: {
        groupId: group._id,
        groupName: group.name,
        groupProfile: group.profile || null
      }
    });

    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("makeAdmin:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove admin (owner only)
export const removeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIdToRemove } = req.body;
    console.log('removing admin', groupId, userIdToRemove)
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isOwner(group, req.user.id)) return res.status(403).json({ success: false, message: "Forbidden" });

    group.admins = (group.admins || []).filter(a => a.toString() !== userIdToRemove.toString());
    await group.save();
 await Notification.create({
      recipient: userIdToRemove,
      sender: req.user.id,
      type: "remove_admin",       // ⭐ NEW TYPE
      message: `You were removed as admin from ${group.name}`,
      meta: {
        groupId: group._id,
        groupName: group.name,
        groupProfile: group.profile || null
      }
    });
    console.log('removed admin')
    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("removeAdmin:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const removeMultipleProductsFromGroup = async (req, res) => {
  try {
    const { groupId, productIds } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Only owner/admin can delete multiple
    const isInvokingOwner = isOwner(group, userId);
    const isInvokingAdmin = (group.admins || []).some(a => a.toString() === userId.toString());
    if (!isInvokingOwner && !isInvokingAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // ✅ Remove multiple products safely
    group.products = (group.products || [])
      .filter(p => p && !productIds.includes(p.toString()));

    await group.save();

    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("removeMultipleProductsFromGroup:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove product from group (owner or admin). If product removal by owner/admin should be allowed even if not contributor.
export const removeProductFromGroup = async (req, res) => {
  try {
    const { groupId, productId } = req.body;
    console.log('removing',groupId, productId)
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    // find who is allowed: owner or admin OR the product owner (normal user remove only own product)
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const productOwnerId = product.postedBy?.toString();
    const isInvokingOwner = isOwner(group, userId);
    const isInvokingAdmin = (group.admins || []).some(a => a.toString() === userId.toString());

    if (!isInvokingOwner && !isInvokingAdmin && productOwnerId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    group.products = (group.products || []).filter(p => p.toString() !== productId.toString());
    // optionally remove from contributors if user has no more products in group
    await group.save();
console.log('removed')
    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("removeProductFromGroup:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




// Add product directly to group (owner/admin or contributor via acceptance)
export const addProductToGroupDirect = async (req, res) => {
  console.log("adding product directly");

  try {
    const { groupId, productId } = req.body;
    const userId = req.user.id;

    // ✅ Validate
    if (!groupId || !productId) {
      return res.status(400).json({
        success: false,
        message: "groupId and productId are required",
      });
    }

    // ✅ Allow both single and multiple product IDs
    const productIds = Array.isArray(productId) ? productId : [productId];
    const isMultiple = productIds.length > 1;
    console.log(productIds, "isMultiple is", isMultiple);

    // ✅ Fetch and validate group
    const group = await Group.findById(groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    // ✅ Permission check
    if (!isAdminOrOwner(group, userId))
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: not group owner/admin" });

    const addedProducts = [];

    for (const pid of productIds) {
      if (group.products.includes(pid)) continue;

      group.products.push(pid);
      if (!group.contributors.includes(userId)) {
        group.contributors.push(userId);
      }

      const product = await Product.findById(pid);
      if (!product) continue;

      const groupAlreadyInProduct = product.groups?.some(
        (g) => g._id.toString() === group._id.toString()
      );

      if (!groupAlreadyInProduct) {
        product.groups.push({
          _id: group._id,
          name: group.name,
          profile: group.profile,
          noOfContributors: group.contributors.length,
          noOfProducts: group.products.length,
          createdAt: group.createdAt,
        });
        await product.save();
        addedProducts.push(product);
      }
    }

    await group.save();

    // ✅ Notify subscribers with notifications enabled + group owner if notifications ON
    if (addedProducts.length > 0) {
      // Fetch subscribers with notifications ON
      const subscribersWithNotifOn = await User.find({
        "subscribedGroups.group": groupId,
        "subscribedGroups.notificationsEnabled": true,
      }).select("_id");

      let recipientIds = subscribersWithNotifOn.map((u) => u._id.toString());

      // ✅ Also include group owner if their notifications are ON
      const ownerUser = await User.findById(group.owner).select(
        "subscribedGroups"
      );
      const ownerHasNotifOn = ownerUser?.subscribedGroups?.some(
        (g) =>
          g.group.toString() === groupId.toString() && g.notificationsEnabled
      );

      if (ownerHasNotifOn && !recipientIds.includes(group.owner.toString())) {
        recipientIds.push(group.owner.toString());
      }

      // Exclude the sender from being notified
      const recipients = recipientIds.filter((id) => id !== userId.toString());

      if (recipients.length > 0) {
        const latestProduct = addedProducts[addedProducts.length - 1];
        const contributor = await User.findById(userId).select("handle profile");

        const notifications = recipients.map((recipientId) => ({
          recipient: recipientId,
          sender: userId,
          type: "group_post",
          message: isMultiple
            ? `Multiple products added in ${group.name}!`
            : `New product added in ${group.name}!`,
          meta: {
            groupId: group._id,
            groupName: group.name,
            groupProfile: group.profile,
            contributorHandle: contributor.handle,
            contributorProfile: contributor.profile,
            contributorAddedImages: [latestProduct.image?.[0]].filter(Boolean),
            isMultiple,
          },
        }));

        await Notification.insertMany(notifications);
        console.log(`📢 Notified ${recipients.length} users`);
      }
    }

    console.log("✅ Products added successfully:", productIds);
    return res.status(200).json({
      success: true,
      message:
        addedProducts.length > 0
          ? "Products successfully added to group and synced."
          : "All selected products already exist in this group.",
      group,
      addedProducts,
    });
  } catch (error) {
    console.error("❌ addProductToGroupDirect error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};


export const addMultipleProductsToGroup = async (req, res) => {
  console.log('adding multiple');
  try {
    const { groupId, productIds } = req.body;
    const userId = req.user.id;

    if (!groupId || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "groupId and array of productIds are required",
      });
    }

    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    // ✅ Check whether user has permission to add directly
    const canDirectAdd = canUserAddDirectly(group, userId);

    if (!canDirectAdd) {
      console.log("🔒 Direct add blocked → request required");

      return res.status(200).json({
        success: false,
        message: "Request required",
        requiresRequest: true,
        productIds, // frontend will send these in sendContributionRequest()
      });
    }

    // ---------- DIRECT ADD BELOW (unchanged logic) ----------
    const addedProducts = [];

    for (const productId of productIds) {
      if (group.products.includes(productId)) continue;
      group.products.push(productId);

      if (!group.contributors.includes(userId)) {
        group.contributors.push(userId);
      }

      const product = await Product.findById(productId);
      if (!product) continue;

      const groupAlreadyInProduct = product.groups?.some(
        (g) => g._id.toString() === group._id.toString()
      );

      if (!groupAlreadyInProduct) {
        product.groups.push({
          _id: group._id,
          name: group.name,
          profile: group.profile,
          noOfContributors: group.contributors.length,
          noOfProducts: group.products.length,
          createdAt: group.createdAt,
        });
        await product.save();
      }

      addedProducts.push(product._id);
    }

    await group.save();

    // ---------- Notifications (unchanged) ----------
    const subscribersWithNotifOn = await User.find({
      "subscribedGroups.group": groupId,
      "subscribedGroups.notificationsEnabled": true,
    }).select("_id");

    const recipients = subscribersWithNotifOn
      .map((u) => u._id.toString())
      .filter((id) => id !== userId.toString());

    if (recipients.length > 0 && addedProducts.length > 0) {
      const notifications = [];
      const contributor = await User.findById(userId).select("handle profile");

      const latestProduct = await Product.findById(
        addedProducts[addedProducts.length - 1]
      )
        .select("image name postedBy createdAt")
        .populate("postedBy", "handle profile")
        .lean();

      const productImage =
        Array.isArray(latestProduct?.image) && latestProduct.image.length > 0
          ? latestProduct.image[0]
          : "";

      const isMultiple = productIds.length > 1;

      recipients.forEach((recipientId) => {
        notifications.push({
          recipient: recipientId,
          sender: userId,
          type: "group_post",
          message: `New product added in ${group.name}`,
          meta: {
            groupId: group._id,
            groupName: group.name,
            groupProfile: group.profile,
            assetId: latestProduct._id,
            assetImage: productImage,
            contributorHandle: contributor?.handle || "",
            contributorProfile: contributor?.profile || "",
            isMultiple,
          },
        });
      });

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`📢 Notified ${recipients.length} users`);
      }
    }

    console.log("✅ Multiple items added successfully");

    return res.status(200).json({
      success: true,
      message: `Added ${addedProducts.length} products to group`,
      group,
      addedProducts,
      requiresRequest: false, // ✅ Always false when direct add succeeded
    });
  } catch (error) {
    console.error("❌ addMultipleProductsToGroup error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};




export const getSubscribedGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate("subscribedGroups.group", "name profile about")
      .select("subscribedGroups");

    res.status(200).json({
      success: true,
      groups: user.subscribedGroups,
    });
  } catch (error) {
    console.error("getSubscribedGroups error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// List pending contribution requests for a group (admin/owner)
export const listContributionRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isAdminOrOwner(group, userId)) return res.status(403).json({ success: false, message: "Forbidden" });

    const requests = await ContributionRequest.find({ group: groupId, status: "pending" })
      .populate({ path: "requester", select: "handle profile _id" })
      .populate({ path: "product" })
      .lean();

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("listContributionRequests:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
