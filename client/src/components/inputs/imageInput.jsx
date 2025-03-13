import React, { useState } from "react";

function ImageInput({ selectedImage, setSelectedImage }) {
  const handleChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to array
    setSelectedImage(files); // Store File objects, not just names
  };

  return (
    <div>
      <div className="lg:w-[10vw] p-3   w-[70%] lg:h-[5vw]  gap-2 border px-1 border-[#424242] mb-2 rounded">
      
        <input
          id="myfile"
          name="image[]" // Name matches backend field
          accept="image/*"
          multiple
          type="file"
          onChange={handleChange}
          className="w-full lg:w-32"
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
