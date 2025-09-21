import { useState, useEffect } from 'react';
import { forumAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

export const useForumNotifications = () => {
  const { unreadCount: socketUnreadCount, updateUnreadCount } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await forumAPI.getUnreadCount();
      const count = response.data.count;
      setUnreadCount(count);
      updateUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
      updateUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Listen for real-time notifications
    const handleNewNotification = () => {
      fetchUnreadCount();
    };

    window.addEventListener('newForumNotification', handleNewNotification);
    
    return () => {
      window.removeEventListener('newForumNotification', handleNewNotification);
    };
  }, []);

  // Sync with socket context
  useEffect(() => {
    setUnreadCount(socketUnreadCount);
  }, [socketUnreadCount]);

  return {
    unreadCount,
    refreshUnreadCount: fetchUnreadCount
  };
};