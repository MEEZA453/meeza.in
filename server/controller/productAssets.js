// controller/productAsset.js
import Asset from "../models/asset.js";
import AssetFolder from "../models/folderOfAsset.js";
import Product from "../models/designs.js";

// Attach individual assets to a product
export const attachAssetsToProduct = async (req, res) => {
  try {
    const { productId, assetIds } = req.body;

    const assets = await Asset.find({ _id: { $in: assetIds }, owner: req.user.id });

    const snapshots = assets.map(a => ({
      assetId: a._id,
      snapshot: {
        name: a.name,
        extension: a.extension,
        size: a.size,
        mimeType: a.mimeType,
        folderPath: a.folders?.map(f => f.name).join("/") || "",
      }
    }));

    // Update Product
    const product = await Product.findByIdAndUpdate(
      productId,
      { $addToSet: { assets: { $each: snapshots } } },
      { new: true }
    );

    // Update Assets documents array
    await Asset.updateMany(
      { _id: { $in: assetIds } },
      { $addToSet: { documents: { productId, productName: product.name, productMediaPreview: product.media[0], snapshotAt: new Date() } } }
    );

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Detach individual assets
export const detachAssetsFromProduct = async (req, res) => {
  try {
    const { productId, assetIds } = req.body;

    // Remove snapshots from product
    const product = await Product.findByIdAndUpdate(
      productId,
      { $pull: { assets: { assetId: { $in: assetIds } } } },
      { new: true }
    );

    // Remove product reference from asset documents
    await Asset.updateMany(
      { _id: { $in: assetIds } },
      { $pull: { documents: { productId } } }
    );

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Attach all assets in folder
export const attachFolderToProduct = async (req, res) => {
  try {
    const { productId, folderId } = req.body;
    const assets = await Asset.find({ folders: folderId, owner: req.user.id });

    const snapshots = assets.map(a => ({
      assetId: a._id,
      snapshot: {
        name: a.name,
        extension: a.extension,
        size: a.size,
        mimeType: a.mimeType,
        folderPath: a.folders?.map(f => f.name).join("/") || "",
      }
    }));

    const product = await Product.findByIdAndUpdate(
      productId,
      { $addToSet: { assets: { $each: snapshots } } },
      { new: true }
    );

    await Asset.updateMany(
      { _id: { $in: assets.map(a => a._id) } },
      { $addToSet: { documents: { productId, productName: product.name, productMediaPreview: product.media[0], snapshotAt: new Date() } } }
    );

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Detach folder
export const detachFolderFromProduct = async (req, res) => {
  try {
    const { productId, folderId } = req.body;

    const assets = await Asset.find({ folders: folderId, owner: req.user.id });

    const product = await Product.findByIdAndUpdate(
      productId,
      { $pull: { assets: { assetId: { $in: assets.map(a => a._id) } } } },
      { new: true }
    );

    await Asset.updateMany(
      { _id: { $in: assets.map(a => a._id) } },
      { $pull: { documents: { productId } } }
    );

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get product assets
export const getProductAssets = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate("assets.assetId");
    res.json({ success: true, assets: product.assets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
