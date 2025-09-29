import React from 'react';

function UserCard ({ type, count }) {
  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-3 sm:p-4 flex-1 min-w-[130px] sm:min-w-[150px] lg:min-w-[180px]">
      
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold my-2 sm:my-4">{count !== undefined ? count : '—'}</h1>
      
      <h2 className="capitalize text-xs sm:text-sm lg:text-base font-medium text-gray-500">{type}s</h2>
    </div>
  );
};

export default UserCard;