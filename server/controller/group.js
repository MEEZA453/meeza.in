// controller/group.js
import Group from "../models/group.js";
import Product from "../models/designs.js";
import User from "../models/user.js";
import ContributionRequest from "../models/contributionRequest.js";
import Notification from "../models/notification.js";
import { cloudinary , getCloudinaryPublicId} from "../config/cloudinery.js";
// helper to check if user is owner
const isOwner = (group, userId) => group.owner.toString() === userId.toString();
// helper to check if admin (owner included)
const isAdminOrOwner = (group, userId) =>
  isOwner(group, userId) || (group.admins || []).some(a => a.toString() === userId.toString());

// Create group
export const createGroup = async (req, res) => {
  try {
    console.log('creating a group')
    const { name, about, visibility } = req.body;
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

    // Find all groups that contain this product
    const groups = await Group.find({ "products": productId })
      .select("name logo profileImage products contributors createdAt")
      .populate("contributors", "name profileImage");

    // Map and format response
    const formattedGroups = groups.map(group => {
      // total number of items in this group
      const totalItems = group.products.length;

      // number of contributions by same user/product
      const productContributions = group.products.filter(
        p => p.toString() === productId
      ).length;

      return {
        id: group._id,
        name: group.name,
        logo: group.logo || group.profileImage,
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
    const { name, about, visibility } = req.body;
console.log('editing the grupu', id , name , about, visibility)
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

    await group.save();
    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("editGroup:", error);
    return res.status(500).json({ success: false, message: error.message });
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
    const groups = await Group.find({})
      .select("name profile createdAt owner products contributors")
      .populate({ path: "owner", select: "handle profile _id" })
      .lean();

    // map to required shape: name, profile, _id, noOfContributors, noOfProducts
    const shaped = groups.map(g => ({
      _id: g._id,
      name: g.name,
      profile: g.profile,
      owner: g.owner,
      noOfContributors: (g.contributors || []).length,
      noOfProducts: (g.products || []).length,
      createdAt: g.createdAt,
    }));

    return res.status(200).json({ success: true, groups: shaped });
  } catch (error) {
    console.error("getAllGroups:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get group by id (all group details but not listing products)
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id)
      .populate({ path: "owner", select: "handle profile _id" })
      .populate({ path: "admins", select: "handle profile _id" })
      .lean();
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // include counts but do not include the full product docs
    const result = {
      ...group,
      noOfProducts: (group.products || []).length,
      noOfContributors: (group.contributors || []).length,
    };

    return res.status(200).json({ success: true, group: result });
  } catch (error) {
    console.error("getGroupById:", error);
    return res.status(500).json({ success: false, message: error.message });
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
export const getContributorsByGroupId = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id).populate({ path: "contributors", select: "handle profile _id" });
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    return res.status(200).json({ success: true, contributors: group.contributors });
  } catch (error) {
    console.error("getContributorsByGroupId:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Send contribution request (normal user -> create ContributionRequest, notify owner/admins)
export const sendContributionRequest = async (req, res) => {
  try {
    const { groupId, productId, message } = req.body;
    const requester = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // If requester is owner or admin, allow direct add without request (optional behavior)
    if (isAdminOrOwner(group, requester)) {
      // add directly
      if (!group.products.includes(productId)) group.products.push(productId);
      if (!group.contributors.includes(requester)) group.contributors.push(requester);
      await group.save();

      // notification to requester: contribution added
      await Notification.create({
        recipient: requester,
        sender: req.user.id,
        type: "asset_attach_approved",
        message: `Your product was added to group ${group.name}`,
        meta: { assetId: productId, extra: { groupId: group._id } },
      });

      return res.status(200).json({ success: true, message: "Added to group (you are admin/owner)" });
    }

    // check existing pending request
    const existing = await ContributionRequest.findOne({
      group: groupId,
      product: productId,
      requester,
      status: "pending",
    });
    if (existing) return res.status(400).json({ success: false, message: "Request already pending" });

    const reqDoc = new ContributionRequest({ group: groupId, product: productId, requester, message });
    await reqDoc.save();

    // Notify owner and admins
    const recipients = [group.owner, ...(group.admins || [])];
    const recipientObjs = recipients.map(r => ({ recipient: r, sender: requester }));

    const notifications = recipientObjs.map(obj => ({
      recipient: obj.recipient,
      sender: requester,
      type: "asset_attach_request",
      message: `${req.user.handle || req.user.id} wants to contribute a product to ${group.name}`,
      meta: { assetId: productId, postId: null, extra: { groupId: group._id, requestId: reqDoc._id } },
    }));
    await Notification.insertMany(notifications);

    return res.status(201).json({ success: true, request: reqDoc });
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

    // Notify requester
    await Notification.create({
      recipient: reqDoc.requester._id,
      sender: userId,
      type: "asset_attach_approved",
      message: `Your contribution to ${group.name} was accepted.`,
      meta: { assetId: reqDoc.product._id, extra: { groupId: group._id, requestId: reqDoc._id } },
    });

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

    const reqDoc = await ContributionRequest.findById(requestId).populate("group product requester");
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });
    const group = await Group.findById(reqDoc.group._id);
    if (!isAdminOrOwner(group, userId)) return res.status(403).json({ success: false, message: "Forbidden" });

    reqDoc.status = "rejected";
    reqDoc.handledBy = userId;
    reqDoc.handledAt = new Date();
    await reqDoc.save();

    // Notify requester
    await Notification.create({
      recipient: reqDoc.requester._id,
      sender: userId,
      type: "asset_attach_rejected",
      message: `Your contribution to ${group.name} was rejected.`,
      meta: { assetId: reqDoc.product._id, extra: { groupId: group._id, requestId: reqDoc._id } },
    });

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
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isOwner(group, req.user.id)) return res.status(403).json({ success: false, message: "Forbidden" });

    if (!group.admins.includes(userIdToMakeAdmin)) group.admins.push(userIdToMakeAdmin);
    await group.save();

    // optional notification
    await Notification.create({
      recipient: userIdToMakeAdmin,
      sender: req.user.id,
      type: "achievement_awarded",
      message: `You were made an admin of group ${group.name}`,
      meta: { extra: { groupId: group._id } },
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
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isOwner(group, req.user.id)) return res.status(403).json({ success: false, message: "Forbidden" });

    group.admins = (group.admins || []).filter(a => a.toString() !== userIdToRemove.toString());
    await group.save();
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

    // ✅ Check for duplicates before adding product
    if (group.products.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "This product is already added to this group.",
      });
    }

    // ✅ Add product & contributor
    group.products.push(productId);
    if (!group.contributors.includes(userId)) {
      group.contributors.push(userId);
    }
    await group.save();

    // ✅ Sync group info inside the product
    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

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
      console.log(`✅ Group "${group.name}" added inside product ${product._id}`);
    } else {
      console.log(
        `⚠️ Group "${group.name}" already exists in product ${product._id}, skipping`
      );
    }

    console.log("✅ Product added successfully:", productId);
    return res.status(200).json({
      success: true,
      message: "Product successfully added to group and synced.",
      group,
      product,
    });
  } catch (error) {
    console.error("❌ addProductToGroupDirect error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

export const addMultipleProductsToGroup = async (req, res) => {
  console.log('adding multiple')
  try {
    const { groupId, productIds } = req.body;
    const userId = req.user.id;

    if (!groupId || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "groupId and array of productIds are required",
      });
    }

    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    if (!isAdminOrOwner(group, userId))
      return res.status(403).json({ success: false, message: "Forbidden" });

    // Keep track of added products
    const addedProducts = [];

    for (const productId of productIds) {
      // Skip duplicates in group
      if (group.products.includes(productId)) continue;

      group.products.push(productId);
      if (!group.contributors.includes(userId)) {
        group.contributors.push(userId);
      }

      const product = await Product.findById(productId);
      if (!product) continue;

      // Skip duplicate group in product
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
console.log('multiple items added')
    return res.status(200).json({
      success: true,
      message: `Added ${addedProducts.length} products to group`,
      group,
      addedProducts,
    });
  } catch (error) {
    console.error("❌ addMultipleProductsToGroup error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
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
