import React, { useState, useEffect, useRef, useCallback } from 'react';
import CreatableSelect from 'react-select/creatable';
import { X, Paperclip, Send, Save } from 'lucide-react';
import { fetchUsers, fetchUserById, groupOptions } from './MessageData';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api/messages`; // Use the base URL for the API endpoint

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('authToken'));
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to debounce an API call
const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

function ComposeMessage({ onClose, onSend, onSaveDraft, replyTo }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    content: replyTo ? `\n\n---- Original Message ----\n${replyTo.content}` : '',
    recipients: replyTo
      ? [{ 
          value: replyTo.senderId || replyTo.sender, 
          label: replyTo.sender, // The sender already includes the ID format from MessageProvider
          user_id: replyTo.senderUserId || replyTo.senderId || replyTo.sender,
          type: replyTo.senderType || 'unknown'
        }]
      : [],
    attachments: [],
    group: null, // For group messaging
    admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || ''
  });

  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [individualRecipientOptions, setIndividualRecipientOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [messageType, setMessageType] = useState('individual'); // 'individual' or 'group'
  const [groupCounts, setGroupCounts] = useState({});
  const [isLoadingGroupCounts, setIsLoadingGroupCounts] = useState(false);

  // Fetch group counts
  const fetchGroupCounts = useCallback(async () => {
    setIsLoadingGroupCounts(true);
    try {
      const counts = {};
      for (const group of ['all_students', 'all_teachers', 'all_parents', 'all']) {
        const users = await fetchUsers('', group);
        counts[group] = users.length;
      }
      setGroupCounts(counts);
    } catch (error) {
      console.error('Error fetching group counts:', error);
    } finally {
      setIsLoadingGroupCounts(false);
    }
  }, []);

  // Load group counts on component mount
  useEffect(() => {
    fetchGroupCounts();
  }, [fetchGroupCounts]);

  // Debounced function for loading individual recipients
  const loadIndividualRecipients = useCallback(
    debounce(async (inputValue, callback) => {
      setIsLoadingOptions(true);
      try {
        const users = await fetchUsers(inputValue);
        const options = users.map(user => ({
          value: user.id,
          label: `${user.name} (${user.user_id}) - ${user.type}`,
          user_id: user.user_id,
          type: user.type
        }));
        callback(options);
      } catch (error) {
        console.error('Error loading recipients:', error);
        callback([]);
      } finally {
        setIsLoadingOptions(false);
      }
    }, 500),
    []
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.content.trim()) newErrors.content = 'Message content is required';
    
    if (messageType === 'individual' && formData.recipients.length === 0) {
      newErrors.recipients = 'At least one recipient is required';
    }
    if (messageType === 'group' && !formData.group) {
      newErrors.group = 'Please select a group';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRecipientsChange = async (selectedOptions, actionMeta) => {
    if (actionMeta.action === 'create-option') {
      const newInputValue = actionMeta.option.value;
      const foundUser = await fetchUserById(newInputValue);

      if (foundUser) {
        const newRecipient = {
          value: foundUser.id,
          label: `${foundUser.name} (${foundUser.user_id}) - ${foundUser.type}`,
          user_id: foundUser.user_id,
          type: foundUser.type
        };
        setFormData(prev => ({
          ...prev,
          recipients: [...selectedOptions.filter(opt => opt.value !== newInputValue), newRecipient]
        }));
      } else {
        console.error(`Invalid User ID: "${newInputValue}". Please enter a valid ID or select from suggestions.`);
        setFormData(prev => ({
          ...prev,
          recipients: selectedOptions.filter(opt => opt.value !== newInputValue)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, recipients: selectedOptions }));
    }
    setErrors(prev => ({ ...prev, recipients: '' }));
  };

  const handleGroupChange = (selectedOption) => {
    setFormData(prev => ({ 
      ...prev, 
      group: selectedOption ? selectedOption.value : null,
      recipients: [] // Clear individual recipients when group is selected
    }));
    setErrors(prev => ({ ...prev, group: '' }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft && !validateForm()) return;

    setIsSending(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('status', asDraft ? 'draft' : 'sent');
      formDataToSend.append('admin_id', formData.admin_id);
      if (messageType === 'group' && formData.group) {
        formDataToSend.append('group', formData.group);
        console.log(`Sending ${asDraft ? 'draft' : 'message'} to group: ${formData.group}`);
      } else if (messageType === 'individual' && formData.recipients.length > 0) {
        formData.recipients.forEach(recipient => {
          formDataToSend.append('recipients[]', recipient.value);
        });
        console.log(`Sending ${asDraft ? 'draft' : 'message'} to ${formData.recipients.length} individual recipients`);
      }

      // Handle attachments
      if (formData.attachments.length > 0) {
        formData.attachments.forEach(file => {
          formDataToSend.append('attachments', file);
        });
        console.log(`Including ${formData.attachments.length} attachments`);
      }

      const response = await axios.post(`${API_BASE_URL}`, formDataToSend, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Message sent successfully:', response.data);

      if (asDraft) {
        onSaveDraft && onSaveDraft(response.data);
      } else {
        onSend && onSend(response.data);
      }

      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      setErrors(prev => ({ 
        ...prev, 
        submit: errorMessage 
      }));
      
      // Show a more user-friendly error message
      if (error.response?.status === 400) {
        setErrors(prev => ({ 
          ...prev, 
          submit: 'Invalid recipient selection. Please check your recipients and try again.' 
        }));
      } else if (error.response?.status === 401) {
        setErrors(prev => ({ 
          ...prev, 
          submit: 'Authentication failed. Please log in again.' 
        }));
      } else if (error.response?.status === 500) {
        setErrors(prev => ({ 
          ...prev, 
          submit: 'Server error. Please try again later.' 
        }));
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">New Message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Message Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="individual"
                  checked={messageType === 'individual'}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="mr-2"
                />
                Individual Recipients
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="group"
                  checked={messageType === 'group'}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="mr-2"
                />
                Group Message
              </label>
            </div>
          </div>

          {/* Recipients Selection */}
          {messageType === 'individual' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
              <CreatableSelect
                isMulti
                options={individualRecipientOptions}
                value={formData.recipients}
                onChange={handleRecipientsChange}
                placeholder="Type to search users by name, email, or user ID (e.g., S001, T001, P001)..."
                className={`basic-select ${errors.recipients ? 'border-red-500' : ''}`}
                classNamePrefix="select"
                formatCreateLabel={(inputValue) => `Add user: "${inputValue}"`}
                loadOptions={loadIndividualRecipients}
                isValidNewOption={(inputValue, selectValue, selectOptions) => {
                  if (!inputValue) return false;
                  const exists = selectOptions.some(option => 
                    option.value.toLowerCase() === inputValue.toLowerCase()
                  );
                  return !exists;
                }}
                isLoading={isLoadingOptions}
              />
              {errors.recipients && <p className="mt-1 text-sm text-red-600">{errors.recipients}</p>}
              <p className="mt-1 text-xs text-gray-500">
                💡 You can search by name, email, or user ID. User IDs follow the format: S001 (Student), T001 (Teacher), P001 (Parent)
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Group *</label>
              <CreatableSelect
                isClearable
                isLoading={isLoadingGroupCounts}
                options={groupOptions.map(option => ({
                  ...option,
                  label: groupCounts[option.value] !== undefined 
                    ? `${option.label} (${groupCounts[option.value]} users)`
                    : option.label
                }))}
                value={groupOptions.find(option => option.value === formData.group)}
                onChange={handleGroupChange}
                placeholder={isLoadingGroupCounts ? "Loading groups..." : "Select a group..."}
                className={`basic-select ${errors.group ? 'border-red-500' : ''}`}
                classNamePrefix="select"
              />
              {errors.group && <p className="mt-1 text-sm text-red-600">{errors.group}</p>}
              <p className="mt-1 text-xs text-gray-500">
                💡 Group messages will be sent to all users in the selected category
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Message subject"
            />
            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={10}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Write your message here..."
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
            <div className="flex items-center">
              <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <Paperclip size={16} className="mr-2" />
                Add Files
                <input type="file" className="sr-only" onChange={handleFileChange} multiple />
              </label>
              <span className="ml-2 text-sm text-gray-500">Max 5MB per file</span>
            </div>

            {formData.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                      {file.name || file}
                    </span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {errors.submit}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save size={16} className="mr-2" />
              Save Draft
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
            >
              {isSending ? 'Sending...' : (
                <>
                  <Send size={16} className="mr-2" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComposeMessage;
