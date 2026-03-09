import express from 'express';
import {verifyToken} from '../middleweres/auth.js'
import { getPresigned } from '../controller/upload.js';

const router = express.Router();
router.post("/get-presigned", verifyToken, getPresigned); // returns signedUrl,key,publicUrl
 
export default router;