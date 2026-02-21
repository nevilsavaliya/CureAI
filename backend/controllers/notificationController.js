const Notification = require('../models/Notification');
const { parsePaginationParams, buildPaginationMeta } = require('../core/controllers/paginationUtils');

// Get all notifications for user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, isRead } = req.query;

    // Parse pagination parameters
    const { page, limit, skip } = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 50
    });

    // Build query
    const query = { userId };

    // Add optional filters
    if (type) {
      query.type = type;
    }
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Fetch notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      Notification.find(query)
        .populate('caseId', 'status symptoms createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Notification.countDocuments(query)
    ]);

    // Build pagination metadata
    const pagination = buildPaginationMeta(page, limit, totalCount);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notifications'
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch unread count'
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch notification
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify user owns this notification
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to update this notification'
      });
    }

    // Mark as read if not already read
    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    });
  }
};
