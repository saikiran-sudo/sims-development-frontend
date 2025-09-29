import React from 'react';


function UserCard ({ type,icon,value }) {
  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <span className='text-sm'>{value}</span>
      <h2 className="capitalize text-sm font-medium text-gray-500"><span>{icon}</span>{type}</h2>
    </div>
  );
};

export default UserCard;
