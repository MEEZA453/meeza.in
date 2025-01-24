import React, { useState } from 'react';

function ImageInput() {
  const [selectedImage, setSelectedImage] = useState([]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to array
    setSelectedImage(files); // Store the files in state
    console.log(files); // Logs the array of selected files
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
          onChange={handleChange} // Only handle change, no value binding
          name=""
          placeholder="Choose File"
          className="w-32"
        />
        <div className = 'flex'>
          {selectedImage.map((image, index) => (
            <img
              key={index}
              className="size-32 bg-cover"
              src={URL.createObjectURL(image)} // Create a blob URL to preview
              alt={`selectedImage-${index}`}
              style={{ width: '100px', height: '100px', objectFit: 'cover' }} // Optional styling
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageInput;
