import { v2 as cloudinary } from "cloudinary";
import Product from '../models/designs.js'
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

export const getDesign = async( req , res)=>{

    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) 
        console.log(page , limit)
        const skip = (page - 1) * limit;
        console.log('reached to the get design')
        const postedDesigns = await Product.find().skip(skip).limit(limit)
        res.json(postedDesigns)
    } catch (error) {
        console.log('controller err:', error)
    }
    
    };
    

export const deleteDesign = async( req , res)=>{
    
}



// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "uploads", // Cloudinary folder
        format: async (req, file) => "png", // Change format if needed
        public_id: (req, file) => Date.now() + "-" + file.originalname,
    },
});

const upload = multer({ storage });

export default upload;

// // Configure Multer for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/"); // Store files in 'uploads' folder
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname); // Unique filenames
//     }
// });

// const upload = multer({ storage }).array('image', 5); // Allow up to 5 images

export const postDesign = async (req, res) => {
    console.log("Reached postDesign route");

    upload.array("images", 10)(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ success: false, message: "Image upload failed" });
        }

        try {
            const {
                name,
                amount,
                headline,
                sections,
                hastags,
                expectedDeliveryDate,
                cashOnDelivery,
                returnOnDelivery
            } = req.body;

            // Parse JSON fields
            const parsedSections = sections ? JSON.parse(sections) : [];
            const parsedHastags = hastags ? JSON.parse(hastags) : [];

            // Get Cloudinary image URLs
            const imagePaths = req.files ? req.files.map(file => file.path) : [];

            // Create new product
            const product = new Product({
                name,
                amount,
                headline,
                image: imagePaths,  // Store Cloudinary URLs
                sections: parsedSections,
                hastags: parsedHastags,
                expectedDeliveryDate,
                cashOnDelivery,
                returnOnDelivery,
            });

            await product.save();
            console.log("Product added successfully:", product);
            res.status(201).json({ success: true, product });
        } catch (error) {
            console.error("Error:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });
};

// export const postDesign = async (req, res) => {
//     console.log('Reached postDesign route');

//     // Use Multer to handle file upload
//     upload(req, res, async (err) => {
//         if (err) {
//             console.error("Multer error:", err);
//             return res.status(400).json({ success: false, message: "Image upload failed" });
//         }

//         try {
//             const {
//                 name,
//                 amount,
//                 headline,
//                 sections,
//                 hastags,
//                 expectedDeliveryDate,
//                 cashOnDelivery,
//                 returnOnDelivery
//             } = req.body;
//             const parsedSections = sections ? JSON.parse(sections) : [];
// const parsedHastags = hastags ? JSON.parse(hastags) : [];


//             // Get image paths
//             const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : ['noths'];

//             // Create new product
//             const product = new Product({
//                 name,
//                 amount,
//                 headline,
//                 image: imagePaths,
//                 sections: parsedSections, // ✅ Use parsed array
//                 hastags: parsedHastags,   // ✅ Use parsed array
//                 expectedDeliveryDate,
//                 cashOnDelivery,
//                 returnOnDelivery,
//             });

//             await product.save();
//             console.log("Product added successfully:", product);
//             res.status(201).json({ success: true, product });
//         } catch (error) {
//             console.error("Error:", error.message);
//             res.status(500).json({ success: false, message: error.message });
//         }
//     });
// };
