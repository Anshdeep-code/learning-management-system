import fs from "fs/promises";

/** Multer saves uploads to ./uploads first; delete that temp copy once it is on Cloudinary. */
export const removeLocalFile = async (path) => {
  if (!path) return;
  try {
    await fs.unlink(path);
  } catch {
    // file already gone - nothing to do
  }
};

/** https://res.cloudinary.com/<cloud>/image/upload/v123/abc123.jpg  ->  "abc123" */
export const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
};
