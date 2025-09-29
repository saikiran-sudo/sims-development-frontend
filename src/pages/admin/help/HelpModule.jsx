import React, { useState } from 'react';
import { HelpCircle, Mail, Phone, ChevronDown, ChevronUp, Search, X } from 'lucide-react'; // Removed MessageSquare
import { useMediaQuery } from 'react-responsive';

const HelpModule = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ categories and questions
  const faqCategories = [
    {
      id: 'general',
      title: 'General Administration',
      questions: [
        {
          id: 'gen-1',
          question: 'How do I reset my password?',
          answer: 'You can reset your password by clicking on "Forgot Password" on the login Module. A reset link will be sent to your registered email address. If you don\'t receive the email, please check your spam folder or contact IT support.'
        },
        {
          id: 'gen-2',
          question: 'How do I update school information?',
          answer: 'Navigate to Settings > School Profile. Only users with "Administrator" privileges can modify school information. Make your changes and click "Save".'
        }
      ]
    },
    {
      id: 'students',
      title: 'Student Management',
      questions: [
        {
          id: 'stu-1',
          question: 'How do I enroll a new student?',
          answer: 'Go to Students > Add New Student. Fill in all required fields marked with an asterisk (*). You can upload supporting documents in the "Documents" section. Click "Save" when done.'
        },
        {
          id: 'stu-2',
          question: 'How can I generate student reports?',
          answer: 'Navigate to Reports > Student Reports. Select the class/section, report type (academic/behavioral), and date range. Click "Generate" to create the report which you can then download or print.'
        }
      ]
    },
    {
      id: 'teachers',
      title: 'Teacher Management',
      questions: [
        {
          id: 'tea-1',
          question: 'How do I assign teachers to classes?',
          answer: 'Go to Teachers > Assign Classes. Select the teacher from the dropdown, then check the classes/subjects you want to assign. You can set them as class teacher for a specific class by selecting the checkbox.'
        }
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance Tracking',
      questions: [
        {
          id: 'att-1',
          question: 'How do I mark bulk attendance?',
          answer: 'Navigate to Attendance > Daily Attendance. Select the date and class/section. You can mark all students present with one click, then individually modify absent students. The system auto-saves every 2 minutes.'
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication Tools',
      questions: [
        {
          id: 'com-1',
          question: 'How do I send announcements to parents?',
          answer: 'Go to Communication > Announcements. Create a new announcement, select the target audience (all parents or specific classes), compose your message, and click "Send". You can schedule announcements for future delivery.'
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

  // Contact methods (Live Chat option removed as per your request)
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Help Center</h1>
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
                    <p className="font-semibold text-gray-800">Enterprise Edition</p>
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