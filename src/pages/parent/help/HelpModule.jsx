import React, { useState, useEffect } from 'react';
import { HelpCircle, Mail, Phone, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

const HelpModule = () => {
  // Custom hook for media query
  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    return isMobile;
  };

  const isMobile = useIsMobile(); // Use the custom hook

  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ categories and questions for a Parent Panel
  const faqCategories = [
    {
      id: 'account',
      title: 'My Account & Login',
      questions: [
        {
          id: 'acc-1',
          question: 'How do I reset my password?',
          answer: 'You can reset your password by clicking on "Forgot Password" on the login page. A reset link will be sent to your registered email address. If you don\'t receive the email, please check your spam folder or contact school IT support.'
        },
        {
          id: 'acc-2',
          question: 'How do I update my contact information?',
          answer: 'Go to "My Profile" or "Account Settings". You can update your phone number, email address, and emergency contacts. Remember to click "Save Changes" after making any edits.'
        }
      ]
    },
    {
      id: 'child-progress',
      title: 'Child\'s Academic Progress',
      questions: [
        {
          id: 'cp-1',
          question: 'How can I view my child\'s grades?',
          answer: 'Navigate to "My Children" and select your child\'s profile. You will find a "Grades" or "Academic Progress" section where all their scores, report cards, and overall performance are available.'
        },
        {
          id: 'cp-2',
          question: 'Where can I see my child\'s attendance records?',
          answer: 'In your child\'s profile, look for the "Attendance" section. Here you can view daily, weekly, or monthly attendance records, including any absences or late marks.'
        },
        {
          id: 'cp-3',
          question: 'How do I view upcoming assignments and homework?',
          answer: 'On your child\'s dashboard or within their class pages, there is usually an "Assignments" or "Homework" section listing all upcoming and past assignments, along with due dates and teacher instructions.'
        }
      ]
    },
    {
      id: 'fees-payments',
      title: 'Fees & Payments',
      questions: [
        {
          id: 'fp-1',
          question: 'How do I pay school fees online?',
          answer: 'Go to the "Fees & Payments" section. You will see outstanding balances and options for online payment via credit/debit card or bank transfer. Follow the prompts to complete your transaction.'
        },
        {
          id: 'fp-2',
          question: 'Can I view my payment history?',
          answer: 'Yes, in the "Fees & Payments" section, there is usually a "Payment History" or "Receipts" tab where you can see all past transactions and download receipts.'
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication with School',
      questions: [
        {
          id: 'com-1',
          question: 'How do I send a message to my child\'s teacher?',
          answer: 'Go to "Messages" or "Communication". You can compose a new message, select your child\'s teacher as the recipient, and send your inquiry. You can also view message history.'
        },
        {
          id: 'com-2',
          question: 'Where can I find school announcements and notices?',
          answer: 'Important school-wide announcements, circulars, and event notices are typically displayed on your main dashboard or in a dedicated "Announcements" section. Please check it regularly.'
        },
        {
          id: 'com-3',
          question: 'How do I schedule a parent-teacher meeting?',
          answer: 'You can request a meeting through the teacher\'s profile or via the "Communication" section. Some systems may have a direct "Book Meeting" feature, or you may need to send a message to arrange a time.'
        }
      ]
    }
  ];

  // Filter FAQs based on search query
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  // Contact methods (remain general)
  const contactMethods = [
    {
      id: 'email',
      icon: <Mail size={isMobile ? 20 : 24} className="text-blue-600" />,
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      details: 'support@schooladmin.edu',
      action: 'mailto:support@schooladmin.edu'
    },
    {
      id: 'phone',
      icon: <Phone size={isMobile ? 20 : 24} className="text-blue-600" />,
      title: 'Phone Support',
      description: 'Call our support team during business hours',
      details: '+1 (555) 123-4567',
      action: 'tel:+15551234567'
    }
  ];

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <HelpCircle size={isMobile ? 28 : 32} className="text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Parent Help Center</h1>
          </div>

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search help articles..."
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Frequently Asked Questions</h2>

            {filteredCategories.length > 0 ? (
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                      className={`w-full flex justify-between items-center p-4 text-left font-semibold text-lg transition-all duration-300 ease-in-out ${
                        activeCategory === category.id ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{category.title}</span>
                      {activeCategory === category.id ? (
                        <ChevronUp size={22} className="text-blue-600" />
                      ) : (
                        <ChevronDown size={22} className="text-gray-500" />
                      )}
                    </button>

                    {activeCategory === category.id && (
                      <div className="border-t border-gray-200 divide-y divide-gray-200 bg-white shadow-inner">
                        {category.questions.map((faq) => (
                          <div key={faq.id} className="p-4 md:p-5">
                            <h3 className="font-medium text-gray-900 mb-2 text-base md:text-lg">{faq.question}</h3>
                            <p className="text-gray-700 text-sm md:text-base leading-relaxed">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg shadow-inner">
                <p className="text-gray-500 text-lg italic">
                  No results found for "{searchQuery}". Try different keywords or contact support for assistance.
                </p>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Contact Support</h2>
            <div className="space-y-4">
              {contactMethods.map((method) => (
                <a
                  key={method.id}
                  href={method.action}
                  className="block border border-gray-200 rounded-lg p-5 transition-all duration-200 ease-in-out hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                  target={method.action.startsWith('http') || method.action.startsWith('mailto') ? '_blank' : '_self'}
                  rel={method.action.startsWith('http') || method.action.startsWith('mailto') ? 'noopener noreferrer' : ''}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{method.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                      <p className="text-base font-semibold text-blue-700">{method.details}</p>
                      <span className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                        Contact via {method.title.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* System Information */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">System Information</h2>
              <div className="bg-blue-50 rounded-lg p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div>
                    <p className="text-gray-600">Version</p>
                    <p className="font-semibold text-gray-800">v2.4.1</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Updated</p>
                    <p className="font-semibold text-gray-800">June 15, 2023</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Browser Support</p>
                    <p className="font-semibold text-gray-800">Chrome, Firefox, Edge</p>
                  </div>
                  <div>
                    <p className="text-gray-600">License</p>
                    <p className="font-semibold text-gray-800">Parent Edition</p> {/* Changed from Student Edition */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default HelpModule;
