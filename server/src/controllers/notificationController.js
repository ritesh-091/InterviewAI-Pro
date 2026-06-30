const Notification = require('../models/Notification');

// 1. Get User Notifications
const getNotifications = async (req, res, next) => {
  try {
    const list = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

// 2. Mark Notification as Read
const markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notif.isRead = true;
    await notif.save();
    res.status(200).json(notif);
  } catch (error) {
    next(error);
  }
};

// 3. Mark All Notifications as Read
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
