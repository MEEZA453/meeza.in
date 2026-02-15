// controllers/folderController.js
import AssetFolder from "../models/folderOfAsset.js";
import Asset from "../models/asset.js";

export const createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    console.log('creating folder with:', name, parentFolder)
    if (!name) return res.status(400).json({ message: "name required" });
    const folder = new AssetFolder({ owner: req.user.id, name, parentFolder: parentFolder || null });
    await folder.save();
    console.log('folder created')
    res.status(201).json({ folder });
  } catch (err) {
    console.error("createFolder err:", err);
    res.status(500).json({ message: "Failed to create folder" });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;
    console.log('renamding', folderId, name)
    const folder = await AssetFolder.findById(folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (String(folder.owner) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });
    folder.name = name;
    console.log('folder updated successfully')
    await folder.save();
    res.json({ folder });
  } catch (err) {
    console.error("renameFolder err:", err);
    res.status(500).json({ message: "Failed to rename" });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const folder = await AssetFolder.findById(folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (String(folder.owner) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

    // Option A: move assets to root (null) OR Option B: forbid delete if contains assets.
    const assetsCount = await Asset.countDocuments({ folder: folder._id });
    if (assetsCount > 0) {
      return res.status(400).json({ message: "Folder not empty. Move or delete assets first." });
    }

    await folder.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("deleteFolder err:", err);
    res.status(500).json({ message: "Failed to delete folder" });
  }
};
