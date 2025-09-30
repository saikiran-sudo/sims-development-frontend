// src/contexts/MessageProvider.jsx or src/pages/messages/MessageProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MessageContext = createContext(null);

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api/messages`; // Use the base URL for the API endpoint

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('authToken'));
  return token ? { Authorization: `Bearer ${token}` } : {};
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
      params.append('tab', tab);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      Object.entries(filterOverrides).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      
      const res = await axios.get(`${API_BASE_URL}?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      // Handle the response data
      const data = res.data;
      const messageArray = Array.isArray(data) ? data : (data.messages || []);
      
      
      // Transform the data to match the frontend expectations
      const transformedMessages = messageArray.map(msg => ({
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
        subject: msg.subject || '(No Subject)',
        content: msg.content || msg.message || '',
        status: msg.status,
        date: msg.date || msg.createdAt,
        read: msg.read,
        starred: msg.starred,
        deletedAt: msg.deletedAt,
        attachments: msg.attachments?.map(att => att.name || att.url) || []
      }));
      
      
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

  // Calculate unread count for inbox
  const unreadMessageCount = messages.filter(m =>
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
      
      await axios.post(`${API_BASE_URL}`, formData, {
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
      await axios.patch(`${API_BASE_URL}/${id}/delete`, {}, { headers: getAuthHeaders() });
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
      await axios.patch(`${API_BASE_URL}/${id}/undo`, {}, { headers: getAuthHeaders() });
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
      await axios.delete(`${API_BASE_URL}/${id}`, { headers: getAuthHeaders() });
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
      await axios.put(`${API_BASE_URL}/${id}/read`, {}, { headers: getAuthHeaders() });
      await fetchMessages();
    } catch (err) {
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