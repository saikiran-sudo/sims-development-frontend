import React from 'react';
import SIMSLogo from '../assets/sims-logo.png';

const Preloader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900/90 transition-opacity duration-700 ease-in-out backdrop-blur-sm">
      
      <div className="relative flex items-center justify-center animate-fade-in-up">
        {/* The main logo container */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Animated ripple effect */}
          <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 animate-ripple"></div>
          <div className="absolute inset-4 rounded-full bg-purple-500 opacity-10 animate-ripple delay-300"></div>
          
          {/* Central logo */}
          <div className="relative z-10 w-40 h-40 p-4 rounded-full bg-white flex items-center justify-center shadow-2xl">
            <img src={SIMSLogo} alt="SIMS Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      <p className="mt-8 text-2xl font-medium text-gray-300 animate-fade-in-up delay-400">
        Get Ready For Smart Education
      </p>
      
      {/* Global CSS for unique animations */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }
        .animate-ripple {
          animation: ripple 2s cubic-bezier(0, 0.2, 0.2, 1) infinite;
        }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
};

export default Preloader;