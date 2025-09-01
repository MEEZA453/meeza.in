import Notification from "../models/notification.js";

// Get notifications
export const getNotifications = async (req, res) => {
  console.log('tried to get notification  ')
  console.log(req.user)
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "handle profile")
      .populate("post", "name images")
      .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  console.log('try to mark the notification')
  console.log(req.user._id)
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
