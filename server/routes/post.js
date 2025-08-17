import express from "express";
 import { upload } from "../config/cloudinery.js";
import {
  createPost,
  getPosts,
  getPostById,
  votePost,
  getVotesForPost,
  deletePost,
  getPostsByHandle,
  searchPosts,
  getDefaultPosts
} from "../controller/post.js";
import {verifyToken} from '../middleweres/auth.js'

const router = express.Router();

router.get("/search/posts", searchPosts);
router.get("/defaultSearch", getDefaultPosts);
router.post("/createPost", verifyToken, upload.array("images", 5), createPost);          // Create post
router.get("/", getPosts);                      // Get all posts
router.get("/:id", getPostById);   
router.get('/postByHandle/:handle' , getPostsByHandle)              // Get post by ID
router.post("/:id/vote", verifyToken, votePost);     // Vote on post
router.get("/:id/votes", getVotesForPost);       // Get votes for a post
router.delete("/deletePost/:id", verifyToken, deletePost);


export default router;
