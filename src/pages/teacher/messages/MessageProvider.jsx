// src/contexts/MessageProvider.jsx or src/pages/messages/MessageProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MessageContext = createContext(null);

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api/messages`; // Use the base URL for the API endpoint

// Get auth token and headers
const token = JSON.parse(localStorage.getItem('authToken'));
const headers = token ? { Authorization: `Bearer ${token}` } : {};

// Helper to get auth headers
const getAuthHeaders = () => {
  try {
    const token = JSON.parse(localStorage.getItem('authToken'));
    console.log('Raw token from localStorage:', token);

    console.log('Parsed token:', token);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error('Error parsing token:', error);
    return {};
  }
};

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [filters, setFilters] = useState({ search: '', status: '', dateRange: '' });

  const TRASH_RETENTION_DAYS = 30;

  // Helper function to calculate days since deletion
  const getDaysSinceDeletion = (deletedAt) => {
    if (!deletedAt) return null;
    const now = new Date();
    const deletedDate = new Date(deletedAt);
    const diffTime = Math.abs(now - deletedDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  };

  // Fetch messages from backend
  const fetchMessages = useCallback(async (tab = activeTab, filterOverrides = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      // Add tab-specific parameters
      if (tab === 'sent') {
        params.append('tab', 'sent');
      } else if (tab === 'drafts') {
        params.append('tab', 'drafts');
      } else if (tab === 'trash') {
        params.append('tab', 'trash');
      } else if (tab === 'starred') {
        params.append('tab', 'starred');
      } else {
        // Default to inbox
        params.append('tab', 'inbox');
      }

      // Add search and filter parameters
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);

      // Add any filter overrides
      Object.entries(filterOverrides).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });

      console.log('Fetching messages for tab:', tab, 'with params:', params.toString());

      const res = await axios.get(`${API_BASE_URL}/msg-under-my-admin?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      console.log('API Response:', res.data);

      // Handle the response data
      const data = res.data;
      const messageArray = Array.isArray(data) ? data : (data.messages || []);

      // Transform the data to match the frontend expectations
      const transformedMessages = messageArray.map(msg => {
        console.log('Raw message from API:', msg);
        return {
          id: msg._id,
          sender: (() => {
            const name = msg.sender?.full_name || msg.sender?.email || 'Unknown';
            const userId = msg.sender?.user_id;
            return userId ? `${name} (${userId})` : name;
          })(),
          senderId: msg.sender?._id,
          senderUserId: msg.sender?.user_id,
          senderType: msg.sender?.role,
          recipients: msg.recipients?.map(r => {
            const name = r.full_name || r.email || 'Unknown';
            const userId = r.user_id;
            return userId ? `${name} (${userId})` : name;
          }) || [],
          recipientIds: msg.recipients?.map(r => r._id) || [],
          subject: msg.subject || msg.title || '(No Subject)',
          content: msg.content || msg.message || msg.body || '',
          status: msg.status,
          date: msg.date || msg.createdAt,
          read: msg.read,
          starred: msg.starred,
          deletedAt: msg.deletedAt,
          attachments: msg.attachments?.map(att => att.name || att.url) || []
        };
      });

      console.log('Transformed messages:', transformedMessages);
      setMessages(transformedMessages);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, [activeTab, filters]);

  // Calculate unread count for inbox - this should be calculated from inbox messages specifically
  const [inboxMessages, setInboxMessages] = useState([]);
  
  // Fetch inbox messages separately for unread count
  const fetchInboxMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('tab', 'inbox');
      
      const res = await axios.get(`${API_BASE_URL}/msg-under-my-admin?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      
      const data = res.data;
      const messageArray = Array.isArray(data) ? data : (data.messages || []);
      
      const transformedInboxMessages = messageArray.map(msg => ({
        id: msg._id,
        sender: (() => {
          const name = msg.sender?.full_name || msg.sender?.email || 'Unknown';
          const userId = msg.sender?.user_id;
          return userId ? `${name} (${userId})` : name;
        })(),
        senderId: msg.sender?._id,
        senderUserId: msg.sender?.user_id,
        senderType: msg.sender?.role,
        recipients: msg.recipients?.map(r => {
          const name = r.full_name || r.email || 'Unknown';
          const userId = r.user_id;
          return userId ? `${name} (${userId})` : name;
        }) || [],
        recipientIds: msg.recipients?.map(r => r._id) || [],
        subject: msg.subject || msg.title || '(No Subject)',
        content: msg.content || msg.message || msg.body || '',
        status: msg.status,
        date: msg.date || msg.createdAt,
        read: msg.read,
        starred: msg.starred,
        deletedAt: msg.deletedAt,
        attachments: msg.attachments?.map(att => att.name || att.url) || []
      }));
      
      setInboxMessages(transformedInboxMessages);
    } catch (err) {
      console.error('Error fetching inbox messages for count:', err);
    }
  }, []);

    // Fetch inbox messages for unread count
    useEffect(() => {
      fetchInboxMessages();
    }, [fetchInboxMessages]);

  // Calculate unread count from inbox messages specifically
  const unreadMessageCount = inboxMessages.filter(m =>
    !m.read &&
    m.status === 'sent'
  ).length;

  // Send or save message (sent or draft)
  const handleSendMessage = async (messageData) => {
    setLoading(true);
    setError(null);
  };

  const handleSaveDraft = async (messageData) => {
    setLoading(true);
    setError(null);
    try {
      // Create FormData for draft
      const formData = new FormData();
      formData.append('subject', messageData.subject);
      formData.append('content', messageData.content);
      formData.append('status', 'draft');

      if (messageData.group) {
        formData.append('group', messageData.group);
      } else if (messageData.recipients && messageData.recipients.length > 0) {
        messageData.recipients.forEach(recipient => {
          formData.append('recipients[]', recipient);
        });
      }

      if (messageData.attachments && messageData.attachments.length > 0) {
        messageData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      await axios.post(`${API_BASE_URL}/under-my-admin`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchMessages();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Move to trash
  const handleDeleteMessage = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(`${API_BASE_URL}/${id}/delete-under-my-admin`, {}, { headers: getAuthHeaders() });
      await fetchMessages();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Undo delete
  const handleUndoDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(`${API_BASE_URL}/${id}/undo-under-my-admin`, {}, { headers: getAuthHeaders() });
      await fetchMessages();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Permanent delete
  const handlePermanentDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/${id}/permanent-delete-under-my-admin`, { headers: getAuthHeaders() });
      await fetchMessages();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const handleMarkAsRead = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      console.log('Sending request to mark as read:', id);
      console.log('Headers:', headers);
      console.log('Token from localStorage:', localStorage.getItem('authToken'));

      // Try the regular read endpoint first (works for all roles including teachers)

      
      await axios.put(`${API_BASE_URL}/${id}/read-under-my-admin`, {}, { headers });

      await fetchMessages();
      // Also refresh inbox messages to update unread count
      await fetchInboxMessages();
    } catch (err) {
      console.error('Error marking as read:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle star
  const handleToggleStar = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(`${API_BASE_URL}/${id}/star`, {}, { headers: getAuthHeaders() });
      await fetchMessages();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    messages,
    loading,
    error,
    unreadMessageCount,
    handleSendMessage,
    handleSaveDraft,
    handleDeleteMessage,
    handleUndoDelete,
    handlePermanentDelete,
    handleMarkAsRead,
    handleToggleStar,
    getDaysSinceDeletion,
    TRASH_RETENTION_DAYS,
    setActiveTab,
    setFilters,
    activeTab,
    filters,
    fetchMessages,
    fetchInboxMessages,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};