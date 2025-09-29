import React, { useState, useEffect } from 'react';
import { HelpCircle, Mail, Phone, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

const HelpModule = () => {
  // Custom hook for media query instead of react-responsive
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

  // FAQ categories and questions
  const faqCategories = [
    {
      id: 'general',
      title: 'General Administration',
      questions: [
        {
          id: 'gen-1',
          question: 'How do I reset my password?',
          answer: 'You can reset your password by clicking on "Forgot Password" on the login module. A reset link will be sent to your registered email address. If you don\'t receive the email, please check your spam folder or contact IT support.'
        },
        {
          id: 'gen-2',
          question: 'How do I update my profile information?',
          answer: 'Navigate to your Profile Settings. You can modify personal details, contact information, and security settings. Remember to save your changes.'
        }
      ]
    },
    {
      id: 'students',
      title: 'Student Management',
      questions: [
        {
          id: 'stu-1',
          question: 'How do I view my student roster?',
          answer: 'Go to "My Classes" section. Select a class to view the full list of enrolled students, along with their basic details.'
        },
        {
          id: 'stu-2',
          question: 'How can I submit grades for my class?',
          answer: 'Navigate to "Grades" > "Submit Grades". Select the specific assignment or exam, then enter grades for each student. You can save drafts and submit final grades by the deadline.'
        },
        {
          id: 'stu-3',
          question: 'Where can I find student attendance records?',
          answer: 'Access "Attendance" from your dashboard. Select the class and date range to view attendance history for your students. You can also export these records.'
        }
      ]
    },
    {
      id: 'assignments',
      title: 'Assignment & Coursework',
      questions: [
        {
          id: 'ass-1',
          question: 'How do I create and assign new homework?',
          answer: 'Go to "Assignments" > "Create New". Fill in assignment details, attach resources, set due dates, and select the classes or individual students. Click "Assign" to publish.'
        },
        {
          id: 'ass-2',
          question: 'How do I review and provide feedback on submitted assignments?',
          answer: 'In the "Assignments" section, click on a submitted assignment. You can view the student\'s work, add comments directly, attach feedback files, and assign a grade. Use the "Save Feedback" button.'
        }
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance Tracking',
      questions: [
        {
          id: 'att-1',
          question: 'How do I mark daily attendance for my class?',
          answer: 'Navigate to "Attendance" > "Mark Daily Attendance". Select your class and the current date. Mark students as present, absent, or late. The system automatically saves your entries.'
        },
        {
          id: 'att-2',
          question: 'What should I do if a student is absent with a valid reason?',
          answer: 'When marking attendance, you can select "Absent" and then provide a reason (e.g., "Sick", "Family Emergency"). This reason will be visible to administrators and parents.'
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication Tools',
      questions: [
        {
          id: 'com-1',
          question: 'How do I send messages to parents or students?',
          answer: 'Go to "Communication" > "Messages". You can compose a new message, select recipients (individual students/parents, a whole class, or specific groups), and send. You can also view message history.'
        },
        {
          id: 'com-2',
          question: 'How can I participate in class discussions?',
          answer: 'Access the "Class Discussions" forum for each of your classes. You can post new topics, reply to existing threads, and moderate discussions if you have the necessary permissions.'
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

  // Contact methods
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Teacher Help Center</h1>
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
