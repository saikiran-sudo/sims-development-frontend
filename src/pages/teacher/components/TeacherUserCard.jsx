import React from 'react';
import { Users, Book, Percent } from 'lucide-react'; // Lucide icons for better visual consistency

function TeacherUserCard({ type, value }) {
  let icon;
  let bgColor;
  let textColor;

  switch (type) {
    case 'Total Classes':
      icon = <Book size={20} className="text-blue-500" />;
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-800';
      break;
    case 'Total Students':
      icon = <Users size={20} className="text-green-500" />;
      bgColor = 'bg-green-50';
      textColor = 'text-green-800';
      break;
    case 'Average Grade':
      icon = <Percent size={20} className="text-purple-500" />;
      bgColor = 'bg-purple-50';
      textColor = 'text-purple-800';
      break;
    default:
      icon = null;
      bgColor = 'bg-gray-50';
      textColor = 'text-gray-800';
  }

  return (
    <div className={`rounded-xl p-6 flex-1 min-w-[280px] max-w-full sm:max-w-[calc(50%-1rem)] lg:max-w-[calc(33.33%-1rem)] xl:max-w-[calc(25%-1rem)] shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`capitalize text-lg font-semibold ${textColor}`}>{type}</h2>
        <div className="p-2 rounded-full bg-white shadow-sm">
          {icon}
        </div>
      </div>
      <span className={`text-4xl font-extrabold ${textColor}`}>
        {value}{type === 'Average Grade' ? '%' : ''}
      </span>
    </div>
  );
}

export default TeacherUserCard;
