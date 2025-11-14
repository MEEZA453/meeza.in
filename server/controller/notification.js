import Notification from "../models/notification.js";
import User from '../models/user.js'
// Get notifications
// export const getNotifications = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, category } = req.query;
//     console.log('fetching notification ',page, limit)
//     const skip = (page - 1) * limit;

//     const REQUEST_TYPES = [
//       "jury_request",
//       "jury_removal_request",
//       "asset_attach_request",
//       "normal_request_rejected",
//     ];

//     const filter = { recipient: req.user.id };

//     if (category === "requests") {
//       filter.type = { $in: REQUEST_TYPES };
//     } else if (category === "normal") {
//       filter.type = { $nin: REQUEST_TYPES };
//     }

//     const notifications = await Notification.find(filter)
//       .populate("sender", "handle profile")
//       .populate("post", "name images")
//        .populate("meta.voters", "handle profile") // ✅ populate voter info here
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Notification.countDocuments(filter);
//     const hasMore = skip + notifications.length < total;

//     res.json({ notifications, total, hasMore });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// controllers/notificationController.js
export const getNotifications = async (req, res) => {
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const REQUEST_TYPES = [
      "jury_request",
      "jury_removal_request",
      "asset_attach_request",
      "normal_request_rejected",
      "group_contribution_request",
    ];

    const { category } = req.query;
    console.log(category)
    const filter = { recipient: req.user.id, createdAt: { $gte: twoMonthsAgo } };

    if (category === "requests") {
      filter.type = { $in: REQUEST_TYPES };
    } else if (category === "normal") {
      filter.type = { $nin: REQUEST_TYPES };
    }

    // ✅ Delete old notifications automatically
    await Notification.deleteMany({
      recipient: req.user.id,
      createdAt: { $lt: twoMonthsAgo },
    });

    // ✅ Fetch current user's following list for quick lookup
    const currentUser = await User.findById(req.user.id, "following");

    const notifications = await Notification.find(filter)
      .populate("sender", "handle profile name")
      .populate("post", "name images")
      .populate("meta.voters", "handle profile")
      .sort({ createdAt: -1 })
      .lean(); // ⚡ faster + easier to modify plain objects

    // ✅ Add `isFollowing` for follow-type notifications
    const enriched = notifications.map((n) => {
      if (n.type === "follow" && n.sender?._id) {
        n.isFollowing = currentUser.following.some(
          (f) => f.toString() === n.sender._id.toString()
        );
      }
      return n;
    });

    res.json({ notifications: enriched });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ message: error.message });
  }
};


export const getUnreadNotifications = async (req, res) => {
  try {
    const unread = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });
    res.json({ count: unread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Mark all as read
export const markAllAsRead = async (req, res) => {

  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    console.log('marked notification all read')
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark single as read
export const markOneAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id }, // ✅ only allow owner to update
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user.id, // ✅ only recipient can delete
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
