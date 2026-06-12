import React from 'react';

const Avatar = ({ name, src, size = 'md', status, onClick }) => {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const getInitials = () => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover cursor-pointer hover:opacity-80 transition`}
          onClick={onClick}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium cursor-pointer hover:opacity-80 transition`}
          onClick={onClick}
        >
          {getInitials()}
        </div>
      )}
      {status && (
        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${statusColors[status]} border-2 border-white`} />
      )}
    </div>
  );
};

export default Avatar;