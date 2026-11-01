'use strict';

const Notification = require('../models/Notification');

/**
 * Create a notification and emit it via Socket.IO
 */
const createNotification = async (data, io = null) => {
  const notification = await Notification.create(data);

  if (io) {
    const populated = await notification.populate('actor', 'name avatar');
    io.to(`user:${data.recipient}`).emit('notification:new', populated);

    // Update unread count
    const unreadCount = await Notification.countDocuments({
      recipient: data.recipient,
      isRead: false,
    });
    io.to(`user:${data.recipient}`).emit('notification:count', { count: unreadCount });
  }

  return notification;
};

module.exports = { createNotification };
