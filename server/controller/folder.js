// controller/group.js
import Product from "../models/designs.js";
import Post from "../models/post.js";

import User from "../models/user.js";
import ContributionRequest from "../models/contributionRequest.js";
import Notification from "../models/notification.js";
import { cloudinary , getCloudinaryPublicId} from "../config/cloudinery.js";
import notification from "../models/notification.js";
import Folder from "../models/folder.js";
// helper to check if user is owner
// const isOwner = (group, userId) => group.owner.toString() === userId.toString();
// // helper to check if admin (owner included)
// const isAdminOrOwner = (group, userId) =>
//   isOwner(group, userId) || (group.admins || []).some(a => a.toString() === userId.toString());

// // Create group

export const createFolder = async (req, res) => {
  try {
    const { name, description, visibility } = req.body;
    const owner = req.user.id;
    console.log("Creating folder", name, description, visibility, owner);
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Folder name is required"
      });
    }

    let profileUrl = "";

    // upload folder cover image
    if (req.file?.path) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "folders"
      });
      profileUrl = result.secure_url;
    }

    const folder = new Folder({
      name,
      description,
      visibility,
      profile: profileUrl,
      owner
    });
    console.log("Saving new folder", folder);
    await folder.save();

    return res.status(201).json({
      success: true,
      folder
    });

  } catch (error) {
    console.error("createFolder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getFoldersByItemId = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { type } = req.query; // "post" or "product"

    if (!["post", "product"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'post' or 'product'"
      });
    }

    const matchField = type === "post" ? "posts" : "products";

    const folders = await Folder.find({
      [matchField]: itemId
    })
      .select("name profile visibility posts products createdAt");

    const formattedFolders = folders.map(folder => {
      const totalItems =
        folder.posts.length + folder.products.length;

      const itemCount =
        folder[matchField].filter(
          id => id.toString() === itemId
        ).length;

      return {
        _id: folder._id,
        name: folder.name,
        profile: folder.profile,
        visibility: folder.visibility,
        noOfItems: totalItems,
        savedCount: itemCount, // usually 1, but kept for symmetry
        createdAt: folder.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedFolders
    });

  } catch (error) {
    console.error("getFoldersByItemId error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const editFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, visibility } = req.body;

    console.log("editing folder", id, name, description, visibility);

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found"
      });
    }

    // ownership check
    if (folder.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    // ✅ If new folder image uploaded
    if (req.file?.path) {
      if (folder.profile) {
        const publicId = getCloudinaryPublicId(folder.profile);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "folders"
      });

      folder.profile = result.secure_url;
    }

    // update fields safely
    if (name !== undefined) folder.name = name;
    if (description !== undefined) folder.description = description;
    if (visibility !== undefined) folder.visibility = visibility;

    await folder.save();

    return res.status(200).json({
      success: true,
      folder
    });

  } catch (error) {
    console.error("editFolder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting a folder", id);

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found"
      });
    }

    // ownership check
    if (folder.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    // 🧹 Remove folder reference from posts
    await Post.updateMany(
      { savedIn: folder._id },
      { $pull: { savedIn: folder._id } }
    );

    // 🧹 Remove folder reference from products
    await Product.updateMany(
      { parent: folder._id },
      { $pull: { parent: folder._id } }
    );

    // 🧹 Delete folder image from Cloudinary
    if (folder.profile) {
      const publicId = getCloudinaryPublicId(folder.profile);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // ❌ Finally delete folder
    await folder.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Folder deleted"
    });

  } catch (error) {
    console.error("deleteFolder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getAllFolders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "10", 10);
    const page = parseInt(req.query.page || "1", 10);

    console.log("getting all public folders", page, limit);

    const filter = { visibility: "public" };

    const totalCount = await Folder.countDocuments(filter);

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        folders: [],
        page,
        limit,
        count: 0,
        hasMore: false
      });
    }

    const folders = await Folder.find(filter)
      .select("name profile owner posts products createdAt")
      .populate({
        path: "owner",
        select: "handle profile _id"
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const shaped = folders.map((f) => ({
      _id: f._id,
      name: f.name,
      profile: f.profile,
      owner: f.owner,
      totalItems:
        (f.posts?.length || 0) + (f.products?.length || 0),
      noOfPosts: (f.posts || []).length,
      noOfProducts: (f.products || []).length,
      createdAt: f.createdAt
    }));

    console.log("got all folders");

    return res.status(200).json({
      success: true,
      folders: shaped,
      page,
      limit,
      count: totalCount,
      hasMore: page * limit < totalCount
    });

  } catch (error) {
    console.error("getAllFolders:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMyFolders = async (req, res) => {
  try {
    const owner = req.user?.id;
    if (!owner) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }


    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const skip = (page - 1) * limit;
    console.log("getting my folders", owner, page, limit);
    const filter = { owner };

    const totalCount = await Folder.countDocuments(filter);

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        folders: [],
        page,
        limit,
        count: 0,
        hasMore: false
      });
    }

    // Fetch folders with minimal fields
    const folders = await Folder.find(filter)
      .select("name profile posts products createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // For each folder fetch up to 4 recent posts and 4 recent products (DB-side limits),
    // merge and pick top 4 by createdAt.
    const processed = await Promise.all(
      folders.map(async (f) => {
        // Limit the ids we pass to the DB so the $in list isn't huge
        // (if arrays can be huge consider storing addedAt on folder items)
        const postIds = (f.posts || []).slice(-200);      // keep sane length
        const productIds = (f.products || []).slice(-200);

        const [postsData, productsData] = await Promise.all([
          Post.find({ _id: { $in: postIds } })
            .select("images image cover thumbnail createdAt") // common fields for an image
            .sort({ createdAt: -1 })
            .limit(4)
            .lean(),
          Product.find({ _id: { $in: productIds } })
            .select("images image cover thumbnail createdAt")
            .sort({ createdAt: -1 })
            .limit(4)
            .lean()
        ]);

        // helper to pick an image url from document
        const pickImage = (doc) =>
          doc?.image ||
          (Array.isArray(doc?.images) && doc.images.length ? doc.images[0] : undefined) ||
          doc?.cover ||
          doc?.thumbnail ||
          "";

        const normalized = [
          ...postsData.map((d) => ({
            _id: d._id,
            type: "post",
            image: pickImage(d),
            createdAt: d.createdAt
          })),
          ...productsData.map((d) => ({
            _id: d._id,
            type: "product",
            image: pickImage(d),
            createdAt: d.createdAt
          }))
        ];

        // sort by createdAt desc and take top 4
        normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recentItems = normalized.slice(0, 4);

        return {
          _id: f._id,
          name: f.name,
          profile: f.profile,
          totalItems: (f.posts?.length || 0) + (f.products?.length || 0),
          noOfPosts: (f.posts || []).length,
          noOfProducts: (f.products || []).length,
          recentItems,
          createdAt: f.createdAt
        };
      })
    );
console.log('i got my folders ')
    return res.status(200).json({
      success: true,
      folders: processed,
      page,
      limit,
      count: totalCount,
      hasMore: page * limit < totalCount
    });
  } catch (error) {
    console.error("getMyFolders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};


export const getFolderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log("getting one folder", userId);

    const folder = await Folder.findById(id)
      .populate({ path: "owner", select: "handle profile _id" })
      .populate({ path: "posts" })
      .populate({ path: "products" })
      .lean();

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found"
      });
    }

    const isOwner =
      userId && folder.owner?._id?.toString() === userId.toString();

    // 🔒 Visibility check
    if (folder.visibility === "private" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "This folder is private"
      });
    }

    const result = {
      ...folder,
      totalItems:
        (folder.posts?.length || 0) + (folder.products?.length || 0),
      noOfPosts: (folder.posts || []).length,
      noOfProducts: (folder.products || []).length,
      isMyFolder: isOwner
    };

    return res.status(200).json({
      success: true,
      folder: result
    });

  } catch (error) {
    console.error("getFolderById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};


export const getItemsByFolderId = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // "product" | "post"
    const userId = req.user?.id;

    const limit = parseInt(req.query.limit || "10", 10);
    const page = parseInt(req.query.page || "1", 10);

    if (!["product", "post"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'product' or 'post'"
      });
    }

    console.log("getting items by folder id", id, type, page, limit);

    const folder = await Folder.findById(id)
      .select("owner visibility products posts")
      .lean();

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found"
      });
    }

    const isOwner =
      userId && folder.owner?.toString() === userId.toString();

    // 🔒 private folder protection
    if (folder.visibility === "private" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "This folder is private"
      });
    }

    const itemIds =
      type === "product" ? folder.products : folder.posts;

    const totalCount = itemIds.length;

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        items: [],
        page,
        limit,
        count: 0,
        hasMore: false
      });
    }

    // pagination slice
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(page * limit, totalCount);
    const paginatedIds = itemIds.slice(startIndex, endIndex);

    let items = [];

    if (type === "product") {
      items = await Product.find({ _id: { $in: paginatedIds } })
        .sort({ createdAt: -1 })
        .populate({
          path: "postedBy",
          select: "profile handle _id"
        })
        .lean();
    } else {
      items = await Post.find({ _id: { $in: paginatedIds } })
        .sort({ createdAt: -1 })
        .populate({
          path: "createdBy",
          select: "profile handle _id"
        })
        .lean();
    }

    return res.status(200).json({
      success: true,
      items,
      type,
      page,
      limit,
      count: totalCount,
      hasMore: endIndex < totalCount
    });

  } catch (error) {
    console.error("getItemsByFolderId error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getProductsByFolderId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const limit = parseInt(req.query.limit || "10", 10);
    const page = parseInt(req.query.page || "1", 10);

    console.log("getting products by folder id", id, page, limit);

    const folder = await Folder.findById(id)
      .select("owner visibility products")
      .lean();

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found"
      });
    }

    const isOwner =
      userId && folder.owner?.toString() === userId.toString();

    // 🔒 private folder protection
    if (folder.visibility === "private" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "This folder is private"
      });
    }

    const totalCount = folder.products.length;

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        products: [],
        page,
        limit,
        count: 0,
        hasMore: false
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(page * limit, totalCount);
    const productIds = folder.products.slice(startIndex, endIndex);

    const products = await Product.find({ _id: { $in: productIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: "postedBy",
        select: "profile handle _id"
      })
      .lean();

    return res.status(200).json({
      success: true,
      products,
      page,
      limit,
      count: totalCount,
      hasMore: endIndex < totalCount
    });

  } catch (error) {
    console.error("getProductsByFolderId error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getPostsByFolderId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const limit = parseInt(req.query.limit || "10", 10);
    const page = parseInt(req.query.page || "1", 10);

    console.log("getting posts by folder id", id, page, limit);

    const folder = await Folder.findById(id)
      .select("owner visibility posts")
      .lean();

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found"
      });
    }

    const isOwner =
      userId && folder.owner?.toString() === userId.toString();

    // 🔒 private folder protection
    if (folder.visibility === "private" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "This folder is private"
      });
    }

    const totalCount = folder.posts.length;

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        posts: [],
        page,
        limit,
        count: 0,
        hasMore: false
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(page * limit, totalCount);
    const postIds = folder.posts.slice(startIndex, endIndex);

    const posts = await Post.find({ _id: { $in: postIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: "createdBy",
        select: "profile handle _id"
      })
      .lean();

    return res.status(200).json({
      success: true,
      posts,
      page,
      limit,
      count: totalCount,
      hasMore: endIndex < totalCount
    });

  } catch (error) {
    console.error("getPostsByFolderId error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const removeMultipleProductsFromFolder = async (req, res) => {
  try {
    const { folderId, productIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "productIds must be a non-empty array"
      });
    }

    const folder = await Folder.findById(folderId);
    if (!folder)
      return res.status(404).json({ success: false, message: "Folder not found" });

    if (folder.owner.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });

    await Folder.findByIdAndUpdate(folderId, {
      $pull: { products: { $in: productIds } }
    });

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $pull: { parent: folderId } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("removeMultipleProductsFromFolder:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const removeProductFromFolder = async (req, res) => {
  try {
    const { folderId, productId } = req.body;
    const userId = req.user.id;

    const folder = await Folder.findById(folderId);
    if (!folder)
      return res.status(404).json({ success: false, message: "Folder not found" });

    if (folder.owner.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });

    await Folder.findByIdAndUpdate(folderId, {
      $pull: { products: productId }
    });

    await Product.findByIdAndUpdate(productId, {
      $pull: { parent: folderId }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("removeProductFromFolder:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeMultiplePostsFromFolder = async (req, res) => {
  try {
    const { folderId, postIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "postIds must be a non-empty array"
      });
    }

    const folder = await Folder.findById(folderId);
    if (!folder)
      return res.status(404).json({ success: false, message: "Folder not found" });

    if (folder.owner.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });

    await Folder.findByIdAndUpdate(folderId, {
      $pull: { posts: { $in: postIds } }
    });

    await Post.updateMany(
      { _id: { $in: postIds } },
      { $pull: { savedIn: folderId } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("removeMultiplePostsFromFolder:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removePostFromFolder = async (req, res) => {
  try {
    const { folderId, postId } = req.body;
    const userId = req.user.id;
    
    console.log('removing post from folder')
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found"
      });
    }

    if (folder.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    folder.posts = (folder.posts || []).filter(
      (id) => id.toString() !== postId.toString()
    );
console.log('removed')
    await folder.save();

    await Post.findByIdAndUpdate(postId, {
      $pull: { savedIn: folder._id }
    });

    return res.status(200).json({
      success: true,
      folder
    });

  } catch (error) {
    console.error("removePostFromFolder:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
const isFolderOwner = (folder, userId) =>
  folder.owner.toString() === userId.toString();
export const addProductToFolder = async (req, res) => {
  try {
    const { folderId, productId } = req.body;
    const userId = req.user.id;

    const folder = await Folder.findById(folderId);
    if (!folder)
      return res.status(404).json({ success: false, message: "Folder not found" });

    if (folder.owner.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });

    await Folder.findByIdAndUpdate(folderId, {
      $addToSet: { products: productId }
    });

    await Product.findByIdAndUpdate(productId, {
      $addToSet: { parent: folderId }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("addProductToFolder:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addMultipleProductsToFolder = async (req, res) => {
  try {
    const { folderId, productIds } = req.body;
    const userId = req.user.id;

    const folder = await Folder.findById(folderId);
    if (!folder)
      return res.status(404).json({ success: false, message: "Folder not found" });

    if (folder.owner.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });

    await Folder.findByIdAndUpdate(folderId, {
      $addToSet: { products: { $each: productIds } }
    });

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { parent: folderId } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("addMultipleProductsToFolder:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addPostToFolder = async (req, res) => {
  try {
    const { folderId, postId } = req.body;
    const userId = req.user.id;

    const folder = await Folder.findById(folderId);
    if (!folder)
      return res.status(404).json({ success: false, message: "Folder not found" });

    if (folder.owner.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });

    // ✅ prevent duplicates
    const alreadyInFolder = folder.posts.some(
      p => p.toString() === postId
    );

    if (!alreadyInFolder) {
      folder.posts.push(postId);
      await folder.save();

      // 🔥 ALSO UPDATE POST
      await Post.findByIdAndUpdate(postId, {
        $addToSet: { savedIn: folder._id }
      });
    }

    return res.status(200).json({
      success: true,
      alreadySaved: alreadyInFolder,
      folderId,
      postId
    });
  } catch (error) {
    console.error("addPostToFolder:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const addMultiplePostsToFolder = async (req, res) => {
  try {
    const { folderId, postIds } = req.body;
    const userId = req.user.id;

    const folder = await Folder.findById(folderId);
    if (!folder)
      return res.status(404).json({ success: false, message: "Folder not found" });

    if (folder.owner.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });

    await Folder.findByIdAndUpdate(folderId, {
      $addToSet: { posts: { $each: postIds } }
    });

    await Post.updateMany(
      { _id: { $in: postIds } },
      { $addToSet: { savedIn: folderId } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("addMultiplePostsToFolder:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
