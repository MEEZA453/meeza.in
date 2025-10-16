// controller/folder.js
import Folder from "../models/folder.js";
import Product from "../models/designs.js";

// ✅ Create Folder
export const createFolder = async (req, res) => {
  try {
    const { name, elements } = req.body; // 🆕 elements array
    const owner = req.user.id;

    const folder = new Folder({
      name,
      owner,
      elements: Array.isArray(elements) ? elements : [], // ensure array
    });

    await folder.save();
    res.status(201).json({ success: true, folder });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ✅ Get All Folders of a User
export const getMyFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    const folders = await Folder.find({ owner: userId }).populate("products");
    res.status(200).json({ success: true, folders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all folders (public)
export const getAllFolders = async (req, res) => {
  try {
    const folders = await Folder.find().populate("products owner", "name handle profile"); // populate owner details if needed
    res.status(200).json({ success: true, folders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ Add Product to Folder
export const addProductToFolder = async (req, res) => {
  try {
    const { folderId, productId } = req.body;
    const userId = req.user.id;

    const folder = await Folder.findOne({ _id: folderId, owner: userId });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    if (!folder.products.includes(productId)) {
      folder.products.push(productId);
      await folder.save();
    }

    res.status(200).json({ success: true, folder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const copyProductToFolder = async (req, res) => {
  try {
    const { sourceFolderId, targetFolderId, productId } = req.body;
    const userId = req.user.id;

    // Ensure both folders belong to the user
    const [sourceFolder, targetFolder] = await Promise.all([
      Folder.findOne({ _id: sourceFolderId, owner: userId }),
      Folder.findOne({ _id: targetFolderId, owner: userId }),
    ]);

    if (!sourceFolder || !targetFolder)
      return res.status(404).json({ message: "Folder not found" });

    // Ensure product exists in source folder
    if (!sourceFolder.products.includes(productId))
      return res.status(400).json({ message: "Product not found in source folder" });

    // Add product to target folder if not already there
    if (!targetFolder.products.includes(productId)) {
      targetFolder.products.push(productId);
      await targetFolder.save();
    }

    res.status(200).json({ success: true, message: "Product copied successfully", targetFolder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Move Product to Another Folder (cut + paste)
export const moveProductToFolder = async (req, res) => {
  try {
    const { sourceFolderId, targetFolderId, productId } = req.body;
    const userId = req.user.id;

    // Ensure both folders belong to the user
    const [sourceFolder, targetFolder] = await Promise.all([
      Folder.findOne({ _id: sourceFolderId, owner: userId }),
      Folder.findOne({ _id: targetFolderId, owner: userId }),
    ]);

    if (!sourceFolder || !targetFolder)
      return res.status(404).json({ message: "Folder not found" });

    // Ensure product exists in source
    if (!sourceFolder.products.includes(productId))
      return res.status(400).json({ message: "Product not found in source folder" });

    // Remove product from source
    sourceFolder.products = sourceFolder.products.filter(
      (id) => id.toString() !== productId
    );
    await sourceFolder.save();

    // Add product to target (avoid duplicates)
    if (!targetFolder.products.includes(productId)) {
      targetFolder.products.push(productId);
      await targetFolder.save();
    }

    res.status(200).json({
      success: true,
      message: "Product moved successfully",
      from: sourceFolderId,
      to: targetFolderId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ Remove Product from Folder
export const removeProductFromFolder = async (req, res) => {
  try {
    const { folderId, productId } = req.body;
    const userId = req.user.id;

    const folder = await Folder.findOne({ _id: folderId, owner: userId });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    folder.products = folder.products.filter(
      (id) => id.toString() !== productId
    );
    await folder.save();

    res.status(200).json({ success: true, folder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Folder
export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const folder = await Folder.findOneAndDelete({ _id: id, owner: userId });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    res.status(200).json({ success: true, message: "Folder deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Rename Folder
export const renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName, newElements } = req.body; // 🆕 allow updating elements

    const folder = await Folder.findById(id);
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    if (newName) folder.name = newName;
    if (newElements) folder.elements = newElements;

    await folder.save();
    res.status(200).json({ success: true, folder });
  } catch (error) {
    console.error("Error renaming folder:", error);
    res.status(500).json({ message: "Server error" });
  }
};