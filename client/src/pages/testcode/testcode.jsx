import React from 'react'
import {useState} from 'react'


function testcode() {
  const [images, setImages] = useState([]); // State to store selected images

  const handleImageChange = (event) => {
    // Convert FileList to Array
    const files = Array.from(event.target.files);

    // Update the state with selected files
    setImages(files);
    console.log(files)
  };

  const handleUpload = () => {
    console.log("Uploading images:", images);
    // You can handle the upload logic here (e.g., send images to a server)
  };

  return (
    <div>
      <h2>Upload Multiple Images</h2>
      <input
        type="file"
        multiple
        accept="image/*" // Accept only images
        onChange={handleImageChange}
      />
      <div>
        <h3>Selected Images:</h3>
        {images.length === 0 ? (
          <p>No images selected</p>
        ) : (
          images.map((image, index) => (
            <div key={index}>
              <p>{image.name}</p>
              <img
                src={URL.createObjectURL(image)}
                alt={`preview-${index}`}
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
            </div>
          ))
        )}
      </div>
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default testcode