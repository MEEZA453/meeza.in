export const getPresigned = async (req, res) => {
  try {
    const { fileName, contentType, folder } = req.body;
console.log('getting presigned with :', fileName, contentType, folder)
    if (!fileName || !contentType) {
      return res.status(400).json({ message: "fileName and contentType required" });
    }

    // Only allow safe folders (important for security)
    const allowedFolders = ["posts", "products", "assets", "profile", "folderProfile"];
    const uploadFolder = allowedFolders.includes(folder)
      ? folder
      : "posts";
console.log('uploadfolder:', uploadFolder)
    const result = await generatePresignedUpload({
      fileName,
      contentType,
      folder: uploadFolder,
      expiresInSeconds: 60 * 10,
    });
console.log('result : ', result)
    return res.json(result);
  } catch (err) {
    console.error("getPresigned error:", err);
    return res.status(500).json({ message: "Failed to generate presigned URL" });
  }
};