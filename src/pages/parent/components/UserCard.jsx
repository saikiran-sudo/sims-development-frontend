import React from 'react';

function UserCard ({ type,value }) {
  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[230px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          {value}
        </span>
      </div>
      <h1 className="text-2xl font-semibold my-4"></h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">{type}</h2>
    </div>
  );
};

export default UserCard;
