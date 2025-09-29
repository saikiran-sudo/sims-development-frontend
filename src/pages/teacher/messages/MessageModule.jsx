import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Send, Inbox, Trash, Filter, X, Search, ChevronDown, ChevronUp, Paperclip, Star as StarIcon, Undo2, MessageSquare } from 'lucide-react';
import Select from 'react-select';
import ComposeMessage from './ComposeMessage';
import { useMessages } from './MessageProvider'; 

// Helper function to format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Helper function to calculate days since deletion
const getDaysSinceDeletion = (deletedAt) => {
  if (!deletedAt) return null;
  const now = new Date();
  const deletedDate = new Date(deletedAt);
  const diffTime = Math.abs(now - deletedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
};

const TRASH_RETENTION_DAYS = 30; // Constant for 30 days

function MessageModule() {
  // Get messages and handlers from context
  const {
    messages,
    loading,
    error,
    handleSendMessage,
    handleSaveDraft,
    handleDeleteMessage,
    handleUndoDelete,
    handlePermanentDelete,
    handleMarkAsRead,
    handleToggleStar,
    setActiveTab,
    activeTab,
    fetchMessages,
    unreadMessageCount,
  } = useMessages();

  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: null,
    dateRange: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Filter options
  const statusOptions = [
    { value: 'read', label: 'Read' },
    { value: 'unread', label: 'Unread' },
    { value: 'sent', label: 'Sent' },
    { value: 'draft', label: 'Draft' }
  ];

  const dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  

  // Effect to fetch messages when activeTab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
    fetchMessages(activeTab);
  }, [activeTab, fetchMessages]);

  // Memoized filtered messages for performance
  const filteredMessages = useMemo(() => {
    console.log('Filtering messages for tab:', activeTab, 'Total messages:', messages.length);
    
    return messages.filter(message => {
      // Apply search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchFields = [
          message.subject.toLowerCase(),
          message.content.toLowerCase(),
          message.sender.toLowerCase(),
          ...(message.recipients ? message.recipients.map(r => r.toLowerCase()) : []),
        ];
        if (!searchFields.some(field => field.includes(query))) {
          return false;
        }
      }

      // Apply status filter
      if (filters.status) {
        if (filters.status.value === 'read' && !message.read) return false;
        if (filters.status.value === 'unread' && message.read) return false;
        if (filters.status.value === 'sent' && message.status !== 'sent') return false;
        if (filters.status.value === 'draft' && message.status !== 'draft') return false;
      }

      // Apply date range filter
      if (filters.dateRange) {
        const messageDate = new Date(message.date);
        const now = new Date();
        let startDate, endDate;

        switch (filters.dateRange.value) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.setDate(now.getDate() - now.getDay() + 7));
            endDate.setHours(0, 0, 0, 0);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
          default:
            break;
        }
        if (messageDate < startDate || messageDate >= endDate) return false;
      }

      return true;
    });
  }, [messages, activeTab, filters]);

  // Memoized counts for performance
  const unreadCount = useMemo(() => unreadMessageCount, [unreadMessageCount]);
  const draftsCount = useMemo(() => messages.filter(m => m.status === 'draft').length, [messages]);
  const starredCount = useMemo(() => messages.filter(m => m.starred && m.status !== 'trash').length, [messages]);
  const trashCount = useMemo(() => messages.filter(m =>
    m.status === 'trash' && getDaysSinceDeletion(m.deletedAt) <= TRASH_RETENTION_DAYS
  ).length, [messages, TRASH_RETENTION_DAYS]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      status: null,
      dateRange: null
    });
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setExpandedMessage(null);
  };

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <MessageSquare size={32} className="text-indigo-600" />
          Messages
        </h1>
      </div>

      <div className='flex justify-between mb-4'>
        {/* Search Bar */}
        <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full md:w-[400px]'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search messages..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleFilterChange('searchQuery', '')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className='flex gap-2'>
          {/* Mobile Search Button */}
          <button
            className='md:hidden flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm'
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search size={16} />
            Search
          </button>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              showFilters || Object.values(filters).some(f => f && (typeof f !== 'object' || (f && f.value)))
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100'
            }`}
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
            <span className="hidden md:inline">Filters</span>
          </button>

          {/* Compose Button */}
          <button
            onClick={() => setShowComposeModal(true)}
            className='bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-1'
          >
            <Send size={16} />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Input */}
      {showMobileSearch && (
        <div className='md:hidden flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full mb-4 animate-fade-in'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search messages..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleFilterChange('searchQuery', '')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div className='mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
              <Select
                options={statusOptions}
                value={filters.status}
                onChange={(selected) => handleFilterChange('status', selected)}
                placeholder="Select status..."
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Date Range</label>
              <Select
                options={dateOptions}
                value={filters.dateRange}
                onChange={(selected) => handleFilterChange('dateRange', selected)}
                placeholder="Select date range..."
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
          </div>
          <div className='flex justify-end mt-4'>
            <button
              onClick={clearFilters}
              className='text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors duration-200'
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-4 md:space-x-8 justify-around md:justify-start">
          <button
            onClick={() => handleTabChange('inbox')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === 'inbox' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
              <Inbox size={16} />
              <span className="hidden md:inline">Inbox</span>
              {unreadCount > 0 && (
                <span className="ml-0 md:ml-1 inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => handleTabChange('sent')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === 'sent' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
              <Send size={16} />
              <span className="hidden md:inline">Sent</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('drafts')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === 'drafts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
              Drafts
              <span className="hidden md:inline"></span>
              {draftsCount > 0 && (
                <span className="ml-0 md:ml-1 inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                  {draftsCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => handleTabChange('starred')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === 'starred' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
              <StarIcon size={16} />
              <span className="hidden md:inline">Starred</span>
              {starredCount > 0 && (
                <span className="ml-0 md:ml-1 inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {starredCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => handleTabChange('trash')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === 'trash' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
              <Trash size={16} />
              <span className="hidden md:inline">Trash</span>
              {trashCount > 0 && (
                <span className="ml-0 md:ml-1 inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {trashCount}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading messages...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Messages List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-xs">
        <div className="overflow-x-auto">
          {filteredMessages.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredMessages.map((message) => {
                const daysLeftInTrash = message.status === 'trash' && message.deletedAt
                  ? TRASH_RETENTION_DAYS - getDaysSinceDeletion(message.deletedAt)
                  : null;

                return (
                  <li
                    key={message.id}
                    className={`
                      ${!message.read && activeTab === 'inbox' ? 'bg-blue-50' : 'bg-white'}
                      hover:bg-gray-50 transition-colors duration-150
                      ${expandedMessage === message.id ? 'bg-gray-100' : ''}
                    `}
                  >
                    <div className="px-4 py-4 sm:px-6 cursor-pointer" onClick={() => {
                      if (expandedMessage === message.id) {
                        setExpandedMessage(null);
                      } else {
                        setExpandedMessage(message.id);
                        if (activeTab === 'inbox' && !message.read) handleMarkAsRead(message.id);
                      }
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-grow">
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                              <p className={`text-sm font-medium truncate ${!message.read && activeTab === 'inbox' ? 'text-blue-700' : 'text-gray-800'}`}>
                                {activeTab === 'inbox' || activeTab === 'trash' ? message.sender : `To: ${message.recipients.join(', ')}`}
                              </p>
                              <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                                {/* Star icon (not visible in trash tab) */}
                                {activeTab !== 'trash' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleStar(message.id);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                    title={message.starred ? "Unstar message" : "Star message"}
                                  >
                                    {message.starred ? (
                                      <StarIcon size={16} className="text-yellow-500 fill-current" />
                                    ) : (
                                      <StarIcon size={16} className="text-gray-400" />
                                    )}
                                  </button>
                                )}
                                {message.attachments.length > 0 && (
                                  <Paperclip size={14} className="flex-shrink-0 text-gray-400" title="Has attachments" />
                                )}
                                <p className="text-xs text-gray-500">
                                  {formatDate(message.date)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-1">
                              <p className={`text-sm truncate ${!message.read && activeTab === 'inbox' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {message.subject || '(No Subject)'}
                              </p>
                            </div>
                            {activeTab === 'trash' && daysLeftInTrash !== null && (
                              <p className="text-xs text-red-500 mt-1">
                                Deletes in {daysLeftInTrash} {daysLeftInTrash === 1 ? 'day' : 'days'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (expandedMessage === message.id) {
                                setExpandedMessage(null);
                              } else {
                                setExpandedMessage(message.id);
                                if (activeTab === 'inbox' && !message.read) handleMarkAsRead(message.id);
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                            title={expandedMessage === message.id ? "Collapse" : "Expand"}
                          >
                            {expandedMessage === message.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          {activeTab !== 'trash' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMessage(message.id);
                              }}
                              className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                              title="Delete"
                            >
                              <Trash size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                      {expandedMessage === message.id && (
                        <div className="mt-4 border-t border-gray-200 pt-4 animate-fade-in">
                          <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                            {message.content}
                          </div>
                          {message.attachments.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-xs font-semibold text-gray-600 mb-1">Attachments:</h4>
                              <div className="flex flex-wrap gap-2">
                                {message.attachments.map((file, index) => (
                                  <a
                                    key={index}
                                    href="#"
                                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Paperclip size={12} className="mr-1" /> {file}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-4 flex justify-end space-x-3">
                            {/* Actions for Trash tab */}
                            {activeTab === 'trash' && (
                              <>
                                {daysLeftInTrash > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleUndoDelete(message.id); }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors duration-200"
                                  >
                                    <Undo2 size={16} className='mr-1' /> Undo Delete
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePermanentDelete(message.id); }}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors duration-200"
                                >
                                  <Trash size={16} className='mr-1' /> Delete Permanently
                                </button>
                              </>
                            )}

                            {/* Actions for Drafts tab */}
                            {activeTab === 'drafts' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendMessage(message);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                              >
                                <Send size={16} className='mr-1' /> Send
                              </button>
                            )}
                            
                            {/* Actions for Inbox tab */}
                            {activeTab === 'inbox' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessage(message);
                                  setShowComposeModal(true);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                              >
                                Reply
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center bg-white">
              <div className='flex flex-col items-center justify-center text-gray-500'>
                <Inbox size={40} className='mb-3 text-gray-400' />
                <h3 className='text-lg font-semibold mb-1'>
                  {messages.length === 0 ?
                    'No messages found' :
                    'No messages match your current view or filters'}
                </h3>
                <p className='text-sm mt-1 text-gray-600'>
                  {messages.length === 0 ?
                    'Your message center is empty. Start by composing a new message!' :
                    'Try clearing your filters or selecting a different tab.'}
                </p>
                {messages.length === 0 && (
                  <button
                    onClick={() => setShowComposeModal(true)}
                    className='mt-6 inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                  >
                    <Send size={20} className='mr-2' />
                    Compose New Message
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showComposeModal && (
        <ComposeMessage
          onClose={() => setShowComposeModal(false)}
          onSend={handleSendMessage}
          onSaveDraft={handleSaveDraft}
          replyTo={selectedMessage}
        />
      )}
    </div>
  );
}

export default MessageModule;
