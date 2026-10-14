import express from "express";
import upload from "../utils/multer.js";
import { uploadMedia } from "../utils/cloudinary.js";
import { removeLocalFile } from "../utils/file.js";
import { isAuthenticated, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

// SECURITY FIX: this route used to be public, so anyone could upload files to your Cloudinary account.
router
  .route("/upload-video")
  .post(
    isAuthenticated,
    restrictTo("instructor", "admin"),
    upload.single("file"),
    async (req, res) => {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file provided" });
      }
      try {
        const result = await uploadMedia(req.file.path);
        if (!result) throw new Error("Cloudinary upload failed");
        res.status(200).json({
          success: true,
          message: "File uploaded successfully.",
          data: result,
        });
      } catch (error) {
        console.log(error);
        res
          .status(500)
          .json({ success: false, message: "Error uploading file" });
      } finally {
        await removeLocalFile(req.file.path);
      }
    },
  );

export default router;
