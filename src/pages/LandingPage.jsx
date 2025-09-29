import React, { useEffect, useState } from 'react';
import { BookOpen, Users, BarChart2, Briefcase, GraduationCap, ClipboardCheck, ChevronRight,
   X, Code, Cloud, Smartphone, Database, ExternalLink, Phone, Mail, MapPin } from 'lucide-react';
import Background from '../assets/landing.jpg';
import BDTS from '../assets/bdts.png';
import SIMSLogo from '../assets/sims-logo.png';
import Playstore from '../assets/playstore-badge.jpg';
import Appstore from '../assets/appstore-badge.jpg';
import AuthContainer from './AuthContainer';
import Preloader from './Preloader';

const LandingPage = () => {
  const [isNavbarSolid, setIsNavbarSolid] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const backgroundImage = new Image();
    backgroundImage.src = Background;
    backgroundImage.onload = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    };

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsNavbarSolid(true);
      } else {
        setIsNavbarSolid(false);
      }

      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = (e) => {
    e.preventDefault();
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <>
      {isLoading && <Preloader />}

      <div className={`min-h-screen bg-gray-50 font-sans antialiased text-gray-800 relative ${isLoading ? 'hidden' : ''}`}>
        {/* Floating Navbar */}
        <nav className={`fixed top-0 left-0 right-0 z-50 p-4 sm:p-6 md:p-8 flex justify-between items-center transition-all duration-300 ${isNavbarSolid ? 'backdrop-blur-md bg-white/80 shadow-lg' : 'bg-transparent'}`}>
          <div className="flex items-center space-x-2">
            <img src={SIMSLogo} alt="SIMS Logo" className="h-10 w-auto animate-fade-in-down" />
          </div>

        </nav>

        {/* Hero Section */}
        <header
          className="relative h-screen flex items-center justify-center text-center px-4 overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${Background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="relative z-20 flex flex-col items-center max-w-4xl mx-auto">
              <img src={SIMSLogo} alt="SIMS Logo" className="h-36 w-auto animate-fade-in-down" />

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent animate-fade-in-up delay-100">
              Smart Institute Management System
            </h1>

            <p className="text-xl sm:text-2xl text-gray-200 mb-10 max-w-2xl animate-fade-in-up delay-200">
              The <strong>all-in-one platform</strong> that simplifies administration, enhances learning, and connects your institute community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
              <button
                onClick={handleLoginClick}
                className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold text-base sm:text-lg shadow-xl hover:shadow-indigo-400/50 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center group w-full sm:w-auto"
              >
                Get Started <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#features"
                className="px-6 py-3 sm:px-8 sm:py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-base sm:text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center w-full sm:w-auto"
              >
                Explore Features
              </a>
            </div>

            <div className="flex justify-center items-stretch gap-2 sm:gap-3 md:gap-4 mt-6 animate-fade-in-up delay-400">
              <div className="flex-1 max-w-[180px] backdrop-blur-sm bg-white/10 p-3 sm:p-4 rounded-xl border border-white/20 transform hover:scale-105 transition-transform duration-200 flex flex-col items-center justify-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">500+</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-200 text-center">Institutes</p>
              </div>

              <div className="flex-1 max-w-[180px] backdrop-blur-sm bg-white/10 p-3 sm:p-4 rounded-xl border border-white/20 transform hover:scale-105 transition-transform duration-200 flex flex-col items-center justify-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">1M+</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-200 text-center">Students</p>
              </div>

              <div className="flex-1 max-w-[180px] backdrop-blur-sm bg-white/10 p-3 sm:p-4 rounded-xl border border-white/20 transform hover:scale-105 transition-transform duration-200 flex flex-col items-center justify-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">24/7</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-200 text-center">Support</p>
              </div>
            </div>
          </div>
        </header>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 bg-white">
          <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full font-medium mb-4 animate-fade-in">
                Powerful Features
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 animate-fade-in delay-100">
                Everything You Need in One Platform
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in delay-200">
                Designed to <strong>streamline operations</strong> and <strong>enhance the educational experience</strong> for everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <div className="group relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-8">
                  <div className="w-16 h-16 bg-indigo-500 rounded-xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300">
                    <BookOpen size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Student Management</h3>
                  <p className="text-gray-700">
                    Comprehensive tools to manage student profiles, academic records, and behavioral tracking.
                  </p>
                  <div className="mt-6">
                    <a href="#" className="inline-flex items-center text-indigo-600 font-medium group-hover:text-indigo-800 transition-colors">
                      Learn more <ChevronRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="group relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up delay-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-8">
                  <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300">
                    <Users size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Staff Portal</h3>
                  <p className="text-gray-700">
                    Empower your faculty with grading tools, class management, and professional development tracking.
                  </p>
                  <div className="mt-6">
                    <a href="#" className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                      Learn more <ChevronRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="group relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up delay-200">
                <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-8">
                  <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300">
                    <BarChart2 size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Performance Analytics</h3>
                  <p className="text-gray-700">
                    Real-time dashboards and predictive analytics to monitor and improve student outcomes.
                  </p>
                  <div className="mt-6">
                    <a href="#" className="inline-flex items-center text-red-600 font-medium group-hover:text-red-800 transition-colors">
                      Learn more <ChevronRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature Card 4 */}
              <div className="group relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up delay-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-teal-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-8">
                  <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300">
                    <Briefcase size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Admissions System</h3>
                  <p className="text-gray-700">
                    Streamlined digital admissions with automated workflows and parent communication tools.
                  </p>
                  <div className="mt-6">
                    <a href="#" className="inline-flex items-center text-green-600 font-medium group-hover:text-green-800 transition-colors">
                      Learn more <ChevronRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature Card 5 */}
              <div className="group relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up delay-400">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-8">
                  <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300">
                    <ClipboardCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Attendance & Scheduling</h3>
                  <p className="text-gray-700">
                    Smart timetables and automated attendance with biometric and mobile check-in options.
                  </p>
                  <div className="mt-6">
                    <a href="#" className="inline-flex items-center text-orange-600 font-medium group-hover:text-orange-800 transition-colors">
                      Learn more <ChevronRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature Card 6 */}
              <div className="group relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up delay-500">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-violet-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-8">
                  <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300">
                    <BookOpen size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Parent Engagement</h3>
                  <p className="text-gray-700">
                    Secure portals with real-time updates, messaging, and payment systems for school fees.
                  </p>
                  <div className="mt-6">
                    <a href="#" className="inline-flex items-center text-purple-600 font-medium group-hover:text-purple-800 transition-colors">
                      Learn more <ChevronRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full font-medium mb-4 animate-fade-in">
                Trusted By Schools Worldwide
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 animate-fade-in delay-100">
                What Our Customers Say
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in delay-200">
                Hear directly from the educators and administrators who love SIMS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transform hover:scale-105 transition-transform duration-300 animate-fade-in-up">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "SIMS transformed how we operate. **Attendance tracking** that used to take hours now happens automatically, and our parents love the real-time updates."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4 text-indigo-600 font-bold text-lg border border-indigo-200">
                    SM
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Sarah Mitchell</h4>
                    <p className="text-gray-600 text-sm">Principal, Greenfield Academy</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transform hover:scale-105 transition-transform duration-300 animate-fade-in-up delay-100">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "The **analytics dashboard** gives us insights we never had before. We've improved our graduation rates by 15% since implementing SIMS."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 text-blue-600 font-bold text-lg border border-blue-200">
                    DJ
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">David Johnson</h4>
                    <p className="text-gray-600 text-sm">Superintendent, Metro School District</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transform hover:scale-105 transition-transform duration-300 animate-fade-in-up delay-200">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "As a teacher, I save at least **2 hours per week** on administrative tasks. The gradebook interface is intuitive and the parent communication tools are fantastic."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 text-purple-600 font-bold text-lg border border-purple-200">
                    ER
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Emily Rodriguez</h4>
                    <p className="text-gray-600 text-sm">Teacher, Hillside High School</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-6 bg-white">
          <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full font-medium mb-4 animate-fade-in">
                Simple Pricing
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 animate-fade-in delay-100">
                Flexible Plans For Every Institute
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in delay-200">
                Affordable packages with enterprise-grade features for institutions of all sizes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Monthly Plan */}
              <div className="relative bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1 group animate-fade-in-up">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Standard Plan</h3>
                <p className="text-gray-600 mb-6">Ideal for growing institutes seeking comprehensive features.</p>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-gray-900">₹X0,000</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Up to **1,000 students**</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Advanced analytics & reporting</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Dedicated email & chat support</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Custom branding options</span>
                  </li>
                </ul>
                <button className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-300">
                  Choose Monthly
                </button>
              </div>

              {/* Yearly Plan - Highlighted */}
              <div className="relative bg-white rounded-2xl p-8 border-2 border-indigo-500 shadow-xl transform scale-105 z-10 animate-fade-in-up delay-100">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                  Best Value
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Plan</h3>
                <p className="text-gray-600 mb-6">Save more with our annual commitment, ideal for established institutions.</p>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-gray-900">₹X,000</span>
                  <span className="text-gray-600">/month</span>
                  <p className="text-sm text-gray-500 mt-1">Billed annually (₹XX,000)</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Up to **5,000 students**</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>All **Standard Plan** features</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>**24/7 Phone & priority** support</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
                <button className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors duration-300 shadow-lg">
                  Choose Yearly
                </button>
              </div>
            </div>
          </div>
        </section>

        
        {/* Mobile App Section */}
        <section className="py-20 px-6 bg-indigo-50">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
              <div className="text-center md:text-left">
                <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full font-medium mb-4 animate-fade-in">
                  Always Connected
                </span>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 animate-fade-in delay-100">
                  Your Institute, In Your Pocket
                </h2>
                <p className="text-xl text-gray-600 mb-8 animate-fade-in delay-200">
                  With our dedicated mobile app, you can access all the powerful features of SIMS,
                  from assignments and grades to notifications and events, right from your smartphone or tablet.
                </p>
              </div>
            </div>
            {/* Centered Playstore and Appstore links below the main content */}
            <div className="flex justify-center gap-4 mt-8 animate-fade-in-up delay-500">
              <a href="#" target="_blank" rel="noopener noreferrer">
                <img src={Playstore} alt="Get it on Google Play" className="h-14 transition-transform duration-200 hover:scale-105" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <img src={Appstore} alt="Download on the App Store" className="h-14 transition-transform duration-200 hover:scale-105" />
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-extrabold mb-6 animate-fade-in">Ready to Transform Your Institute?</h2>
            <p className="text-xl opacity-90 mb-10 max-w-3xl mx-auto animate-fade-in delay-100">
              Join thousands of educators who are revolutionizing education with our platform. Start your **free 30-day trial** today - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-200">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-10 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>

        {/* Demo Request Modal */}
        {isDemoModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-zoom-in">
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Request a Demo</h3>
              <form className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label htmlFor="institute" className="block text-gray-700 text-sm font-medium mb-2">
                    Institute / Organization
                  </label>
                  <input
                    type="text"
                    id="institute"
                    className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="e.g., Springdale Institute"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-gray-700 text-sm font-medium mb-2">
                    Your Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="Tell us about your needs..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-base sm:text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Submit Request
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Login/Forgot Password Modal */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative animate-zoom-in">
              <button
                onClick={closeLoginModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={24} />
              </button>
              <AuthContainer onClose={closeLoginModal} />
            </div>
          </div>
        )}

        {/* BDTS Promotion Section */}
        <section className="py-16 px-6 bg-gray-800 text-white">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div className="flex items-center mb-6">
                  <img src={BDTS} alt="BDTS Logo" className="h-12 w-auto mr-4" />
                  <h2 className="text-2xl font-bold">Basel Dynamic Tech Solutions</h2>
                </div>
                <p className="text-lg text-gray-300 mb-6">
                  The innovative force behind SIMS, delivering cutting-edge technology solutions for education.
                </p>
                <a 
                  href="https://baseldtsolutions.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors duration-300"
                >
                  Visit BDTS Website <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
              <div className="md:w-1/2 grid grid-cols-2 gap-6">
                {[
                  { icon: <Code size={24} className="text-indigo-400" />, text: "Custom Development" },
                  { icon: <Cloud size={24} className="text-blue-400" />, text: "Cloud Solutions" },
                  { icon: <Smartphone size={24} className="text-green-400" />, text: "Mobile Apps" },
                  { icon: <Database size={24} className="text-purple-400" />, text: "Data Analytics" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="mr-3">
                      {item.icon}
                    </div>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 px-6 bg-white">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Get In Touch</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Have questions? Our team is here to help you find the right solution.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-gray-50 p-8 rounded-xl text-center">
                <div className="flex justify-center mb-4">
                  <Phone size={48} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-4">Speak directly with our support team</p>
                <a href="tel:+18005551234" className="text-indigo-600 font-medium hover:underline">+1 (800) 555-1234</a>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-xl text-center">
                <div className="flex justify-center mb-4">
                  <Mail size={48} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Email Us</h3>
                <p className="text-gray-600 mb-4">Get answers to your questions</p>
                <a href="mailto:support@sims.edu" className="text-indigo-600 font-medium hover:underline">support@sims.edu</a>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-xl text-center">
                <div className="flex justify-center mb-4">
                  <MapPin size={48} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                <p className="text-gray-600 mb-4">Our headquarters</p>
                <address className="not-italic text-indigo-600 font-medium">
                  123 Education Blvd, Suite 100<br />
                  San Francisco, CA 94107
                </address>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16 px-6">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <img src={SIMSLogo} alt="SIMS Logo" className="h-10 w-auto animate-fade-in-down" />
                </div>
                <p className="text-gray-400 mb-6">
                  The complete institute management solution for modern educational institutions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Updates</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Roadmap</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6">Resources</h3>
                <ul className="space-y-3">
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">Guides</a></li>
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">Webinars</a></li>
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">API Docs</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6">Company</h3>
                <ul className="space-y-3">
                  <li><a href="aboutus" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">Partners</a></li>
                  <li><a href="" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} SIMS. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="/privacypolicy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>

            <div className="flex justify-center items-center mt-8 mb-4">
              <span className="text-gray-400 mr-2">Designed and Developed By</span>
              <img 
                src={BDTS} 
                alt="BDTS" 
                className="h-6 w-auto" 
              />
              <span className="text-gray-400 ml-2">BDTS</span>
            </div>
          </div>
        </footer>

        {/* Floating Scroll-to-Top Button */}
        {showScrollButton && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-xl hover:shadow-2xl transition-all duration-300 group flex items-center justify-center"
            style={{ animation: 'float 3s ease-in-out infinite' }}
            aria-label="Scroll to top"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 group-hover:from-indigo-700 group-hover:to-purple-700 transition-colors"></div>
              
              <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/50 transition-all duration-300 animate-ping opacity-0 group-hover:opacity-100"></div>
              
              <svg 
                className="relative z-10 w-6 h-6 text-white transform group-hover:-translate-y-1 transition-transform"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
              </svg>
              
              <span className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Back to top
              </span>
            </div>
          </button>
        )}

        {/* Add the float animation to your global styles */}
        <style>
          {`
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default LandingPage;