export function getCloudinaryPublicId(imageUrl) {
  try {
    const parts = imageUrl.split('/');
    const fileName = parts[parts.length - 1]; // "timestamp-name.png"
    const publicId = fileName.substring(0, fileName.lastIndexOf('.'));
    const folder = parts.slice(parts.indexOf('uploads')).slice(0, -1).join('/');
    return `${folder}/${publicId}`;
  } catch (err) {
    console.error("Failed to extract public_id:", err);
    return null;
  }
}


