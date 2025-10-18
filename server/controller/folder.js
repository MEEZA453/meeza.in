// controller/folder.js
import Folder from "../models/folder.js";
import Product from "../models/designs.js";

// ✅ Create Folder
export const createFolder = async (req, res) => {
  console.log('create a folder')
  try {
    const { name, elements } = req.body; // 🆕 elements array
    const owner = req.user.id;

    const folder = new Folder({
      name,
      owner,
      elements: Array.isArray(elements) ? elements : [], // ensure array
    });

    await folder.save();
    console.log('folder created successfully')
    res.status(201).json({ success: true, folder });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ✅ Get All Folders of a User
export const getMyFolders = async (req, res) => {
  console.log('getting my folders')
  try {
    const userId = req.user.id;
    const folders = await Folder.find({ owner: userId }).populate("products");
    res.status(200).json({ success: true, folders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getFolderById = async (req, res) => {
  const { id } = req.params;
  console.log(id)
  console.log(`Fetching folder with id: ${id}`);

  try {
    const folder = await Folder.findById(id)
      .populate({
        path: "products",
        model: "Product",
        populate: {
          path: "postedBy",
          select: "name profile handle", // expand product's creator
        },
      })
      .populate({
        path: "owner",
        select: "name handle profile",
      });

    if (!folder) {
      return res.status(404).json({ success: false, message: "Folder not found" });
    }

    res.status(200).json({ success: true, folder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all folders (public)
export const getAllFolders = async (req, res) => {
  console.log('getting all folders')
  try {
       const folders = await Folder.find()
 .populate({
        path: "products",
        model: "Product",
        populate: {
          path: "postedBy",
          select: "name profile handle", // expand product's creator
        },
      })
      .populate({
        path: "owner",
        select: "name handle profile",
      });
    res.status(200).json({ success: true, folders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ Add Product to Folder
export const addProductToFolder = async (req, res) => {
  console.log('adding product to folder')
  try {
    const { folderId, productId } = req.body;
    const userId = req.user.id;
console.log(folderId, productId)
    const folder = await Folder.findOne({ _id: folderId, owner: userId });
    if (!folder) return res.status(404).json({ message: "Folder not found" });
console.log(folder)
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Add product to folder
    if (!folder.products.includes(productId)) folder.products.push(productId);

    // Add folder to product
    if (!product.parent.includes(folderId)) product.parent.push(folderId);
console.log('product added ')
    await Promise.all([folder.save(), product.save()]);

    res.status(200).json({ success: true, folder });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message });
  }
};
export const copyProductToFolder = async (req, res) => {
  try {
    const { sourceFolderId, targetFolderId, productId } = req.body;
    const userId = req.user.id;

    const [sourceFolder, targetFolder, product] = await Promise.all([
      Folder.findOne({ _id: sourceFolderId, owner: userId }),
      Folder.findOne({ _id: targetFolderId, owner: userId }),
      Product.findById(productId),
    ]);

    if (!sourceFolder || !targetFolder || !product)
      return res.status(404).json({ message: "Folder or product not found" });

    if (!sourceFolder.products.includes(productId))
      return res.status(400).json({ message: "Product not in source folder" });

    if (!targetFolder.products.includes(productId)) {
      targetFolder.products.push(productId);
      await targetFolder.save();
    }

    // Add target folder to product’s parent list
    if (!product.parent.includes(targetFolderId)) {
      product.parent.push(targetFolderId);
      await product.save();
    }

    res.status(200).json({ success: true, message: "Product copied successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const moveProductToFolder = async (req, res) => {
  try {
    const { sourceFolderId, targetFolderId, productId } = req.body;
    const userId = req.user.id;

    const [sourceFolder, targetFolder, product] = await Promise.all([
      Folder.findOne({ _id: sourceFolderId, owner: userId }),
      Folder.findOne({ _id: targetFolderId, owner: userId }),
      Product.findById(productId),
    ]);

    if (!sourceFolder || !targetFolder || !product)
      return res.status(404).json({ message: "Folder or product not found" });

    // Remove from source folder
    sourceFolder.products = sourceFolder.products.filter(
      (id) => id.toString() !== productId
    );

    // Add to target folder
    if (!targetFolder.products.includes(productId))
      targetFolder.products.push(productId);

    await Promise.all([sourceFolder.save(), targetFolder.save()]);

    // Update product’s parent (replace old folderId with new one)
    product.parent = product.parent.filter(
      (id) => id.toString() !== sourceFolderId
    );
    if (!product.parent.includes(targetFolderId))
      product.parent.push(targetFolderId);

    await product.save();

    res.status(200).json({ success: true, message: "Product moved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Remove Product from Folder
export const removeProductFromFolder = async (req, res) => {
  try {
    const { folderId, productId } = req.body;
    const userId = req.user.id;

    const [folder, product] = await Promise.all([
      Folder.findOne({ _id: folderId, owner: userId }),
      Product.findById(productId),
    ]);

    if (!folder || !product)
      return res.status(404).json({ message: "Folder or product not found" });

    folder.products = folder.products.filter(
      (id) => id.toString() !== productId
    );
    product.parent = product.parent.filter(
      (id) => id.toString() !== folderId
    );

    await Promise.all([folder.save(), product.save()]);

    res.status(200).json({ success: true, message: "Product removed from folder" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Delete Folder
export const deleteFolder = async (req, res) => {
  console.log('deleting folder')
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
  console.log('editing folder')
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