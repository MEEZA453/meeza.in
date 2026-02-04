import User from "../models/user.js";
import Product from "../models/designs.js";
import Post from "../models/post.js";
import { attachIsAppreciated } from "../utils/attactIsAppreciated.js";

// -----------------------------------------
// ADD TO HIGHLIGHT
// -----------------------------------------
export const addToHighlight = async (req, res) => {
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    const post = await Post.findById(designId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user already highlighted
    const already = post.highlightedBy.some(
      h => h.user.toString() === userId
    );

    if (!already) {
      post.highlightedBy.push({
        user: userId,
        highlightedAt: new Date()
      });
      post.isHighlighted = true;
    }

    await post.save();

    return res.status(200).json({ success: true, message: "Post highlighted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------------------
// REMOVE HIGHLIGHT
// -----------------------------------------
export const removeFromHighlight = async (req, res) => {
  try {
    const userId = req.user.id;
    const { designId } = req.body;

    const post = await Post.findById(designId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.highlightedBy = post.highlightedBy.filter(
      h => h.user.toString() !== userId
    );

    post.isHighlighted = post.highlightedBy.length > 0;

    await post.save();

    return res.status(200).json({ success: true, message: "Highlight removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------------------
// GET ALL HIGHLIGHTS (SORT BY RECENTLY HIGHLIGHTED)
// -----------------------------------------
export const getAllHighlights = async (req, res) => {
  try {
    const { category } = req.query;
    console.log('getting  hightlights')
console.log(req.user.id)
    const categoryFilter = category
      ? { category: { $in: category.split(",") } }
      : {};

    // get all highlighted posts
    const posts = await Post.find({
      isHighlighted: true,
      ...categoryFilter
    })
      // sort by latest highlightedAt
      .sort({ lastHighlightedAt: -1 }) // you should store this field in schema
      .populate("createdBy", "name profile handle passion")
      .select("-__v")
      .lean();

const postsWithFlag = await attachIsAppreciated(
  posts,
  req.user?.id || null,
  "Post"
);


    return res.json({
      success: true,
      highlights: postsWithFlag
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// export const getAllHighlights = async (req, res) => {
//   try {
//     const { category } = req.query;

//     const categoryFilter = category
//       ? { category: { $in: category.split(",") } }
//       : {};

//     const highlights = await Post.aggregate([
//       // Match highlighted posts
//       {
//         $match: {
//           isHighlighted: true,
//           ...categoryFilter
//         }
//       },

//       // Add lastHighlightedAt (for sorting)
//       {
//         $addFields: {
//           lastHighlightedAt: { $max: "$highlightedBy.highlightedAt" }
//         }
//       },

//       // Sort by latest highlight
//       { $sort: { lastHighlightedAt: -1 } },

//       // ---- populate createdBy ----
//       {
//         $lookup: {
//           from: "users",
//           localField: "createdBy",
//           foreignField: "_id",
//           as: "createdBy",
//           pipeline: [
//             { $project: { name: 1, profile: 1, handle: 1, passion: 1 } }
//           ]
//         }
//       },
//       { $unwind: "$createdBy" },

//       // ---- take only last 2 recent votes ----
//       {
//         $addFields: {
//           recentVotes: {
//             $slice: [
//               {
//                 $sortArray: {
//                   input: "$votes",
//                   sortBy: { _id: -1 }   // newest first
//                 }
//               },
//               4
//             ]
//           }
//         }
//       },

//       // ---- populate users of recentVotes ----
//       {
//         $lookup: {
//           from: "users",
//           localField: "recentVotes.user",
//           foreignField: "_id",
//           as: "voteUsers",
//           pipeline: [
//             { $project: { name: 1, profile: 1, handle: 1, passion: 1 } }
//           ]
//         }
//       },

//       // ---- merge populated users back into votes ----
//       {
//         $addFields: {
//           votes: {
//             $map: {
//               input: "$recentVotes",
//               as: "v",
//               in: {
//                 creativity: "$$v.creativity",
//                 aesthetics: "$$v.aesthetics",
//                 composition: "$$v.composition",
//                 emotion: "$$v.emotion",
//                 totalVote: "$$v.totalVote",
//                 user: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$voteUsers",
//                         as: "u",
//                         cond: { $eq: ["$$u._id", "$$v.user"] }
//                       }
//                     },
//                     0
//                   ]
//                 }
//               }
//             }
//           }
//         }
//       },

//       // remove temp fields
//       { $unset: ["recentVotes", "voteUsers"] }
//     ]);

//     return res.status(200).json({
//       success: true,
//       highlights
//     });

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: err.message });
//   }
// };


