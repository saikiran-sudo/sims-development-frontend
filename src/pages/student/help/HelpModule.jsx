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

  // FAQ categories and questions for a Student Panel
  const faqCategories = [
    {
      id: 'account',
      title: 'My Account & Login',
      questions: [
        {
          id: 'acc-1',
          question: 'How do I reset my password?',
          answer: 'You can reset your password by clicking on "Forgot Password" on the login page. A reset link will be sent to your registered school email address. If you don\'t receive the email, please check your spam folder or contact school IT support.'
        },
        {
          id: 'acc-2',
          question: 'How do I update my personal information?',
          answer: 'Go to your "Profile Settings". You can update your contact details, emergency contacts, and other personal information. Remember to click "Save Changes" after making any edits.'
        }
      ]
    },
    {
      id: 'courses-grades',
      title: 'Courses & Grades',
      questions: [
        {
          id: 'cg-1',
          question: 'How can I view my grades for a course?',
          answer: 'Navigate to "My Courses" and select the specific course. You will find a "Grades" tab or section where all your scores and overall progress are listed.'
        },
        {
          id: 'cg-2',
          question: 'Where can I find course materials and lecture notes?',
          answer: 'Within each course page, there should be a section like "Course Content" or "Materials" where teachers upload lecture slides, readings, and other resources.'
        },
        {
          id: 'cg-3',
          question: 'How do I drop or add a course?',
          answer: 'Course enrollment changes are typically handled through the Registrar\'s office. Please contact your academic advisor or the school administration for guidance on adding or dropping courses.'
        }
      ]
    },
    {
      id: 'assignments',
      title: 'Assignments & Submissions',
      questions: [
        {
          id: 'assign-1',
          question: 'How do I submit an assignment online?',
          answer: 'Go to the specific assignment within your course. There should be an "Upload Submission" or "Submit Assignment" button. Follow the instructions to attach your file(s) and confirm submission.'
        },
        {
          id: 'assign-2',
          question: 'Can I resubmit an assignment after the deadline?',
          answer: 'Policies on late submissions and resubmissions vary by teacher and course. Please check the assignment instructions or contact your teacher directly to inquire about resubmission options.'
        },
        {
          id: 'assign-3',
          question: 'How do I view feedback on my submitted assignments?',
          answer: 'After your teacher grades and provides feedback, you can usually find it on the same assignment page where you submitted your work. Look for comments, rubrics, or attached feedback files.'
        }
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance Records',
      questions: [
        {
          id: 'att-1',
          question: 'How do I check my attendance record?',
          answer: 'You can view your daily and overall attendance history in the "Attendance" section of your student portal. It shows your presence, absence, and late marks.'
        },
        {
          id: 'att-2',
          question: 'What if there\'s an error in my attendance record?',
          answer: 'If you believe there\'s a mistake in your attendance, please contact your teacher or the school administration as soon as possible with details and any supporting documentation (e.g., doctor\'s note).'
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication & Announcements',
      questions: [
        {
          id: 'com-1',
          question: 'How do I send a message to my teacher?',
          answer: 'Most teachers can be contacted directly through the "Messages" or "Communication" section within the platform. Select "Compose New Message" and choose your teacher as the recipient.'
        },
        {
          id: 'com-2',
          question: 'Where can I find school announcements?',
          answer: 'Important school-wide and class-specific announcements are typically displayed on your dashboard or in a dedicated "Announcements" section. Make sure to check it regularly for updates.'
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Help Center</h1>
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
                    <p className="font-semibold text-gray-800">Student Edition</p> {/* Changed from Enterprise */}
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
