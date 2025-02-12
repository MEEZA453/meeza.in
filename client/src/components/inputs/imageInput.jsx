import React, { useState } from 'react';

function ImageInput({ selectedImage, setSelectedImage }) {
  const handleChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to an array
    const fileNames = files.map((file) => file.name); // Extract only names
    setSelectedImage(fileNames);
    console.log(fileNames);
  };

  return (
    <div>
      <div className="w-[10vw] h-[5vw] border px-1 border-[#424242] mb-2 rounded">
        <label htmlFor="myfile" className="px-1 opacity-75">
          Select a file
        </label>
        <input
          accept="image/*"
          multiple
          type="file"
          onChange={handleChange}
          className="w-32"
        />
        <div className="flex">
          {Array.from(document.querySelector('input[type="file"]')?.files || []).map((file, index) => (
            <img
              key={index}
              className="size-32 bg-cover"
              src={URL.createObjectURL(file)} // Create a blob URL for preview
              alt={`selectedImage-${index}`}
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageInput;
