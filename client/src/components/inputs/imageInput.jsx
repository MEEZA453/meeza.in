import React, { useState } from "react";

function ImageInput({ selectedImage, setSelectedImage }) {
  const handleChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to array
    setSelectedImage(files); // Store File objects, not just names
  };

  return (
    <div>
      <div className="w-[10vw] h-[5vw] border px-1 border-[#424242] mb-2 rounded">
        <label htmlFor="myfile" className="px-1 opacity-75">Select a file</label>
        <input
          id="myfile"
          name="image[]" // Name matches backend field
          accept="image/*"
          multiple
          type="file"
          onChange={handleChange}
          className="w-32"
        />
        <div className="flex">
          {selectedImage?.map((file, index) => (
            <img
              key={index}
              className="size-32 bg-cover"
              src={URL.createObjectURL(file)} // Preview image
              alt={`selectedImage-${index}`}
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageInput;
