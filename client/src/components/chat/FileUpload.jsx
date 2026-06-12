import React, { useRef } from 'react';

const FileUpload = ({ onFileSelect, isUploading, children }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
    fileInputRef.current.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
        accept="image/*,application/pdf,application/msword,text/plain"
      />
      <div onClick={handleClick} className="cursor-pointer">
        {children || (
          <button
            disabled={isUploading}
            className="px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition disabled:opacity-50 text-sm"
            title="Upload file"
          >
            {isUploading ? '⏳' : '📎'}
          </button>
        )}
      </div>
    </>
  );
};

export default FileUpload;