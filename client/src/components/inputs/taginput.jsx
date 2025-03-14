import React, { useState } from 'react';
import { RxCross2 } from "react-icons/rx";

function TagInput({hastags , setHastags}) {
  const [inputTag, setInputTag] = useState('');

  // Add hashtags
  const addHasTags = () => {
    if (inputTag.trim() !== '' && !hastags.includes(inputTag.trim())) {
      setHastags([...hastags, inputTag.trim()]);
    }
    setInputTag('');
  };

  // Delete hashtag by index
  const deleteTag = (tagIndex) => {
    setHastags(hastags.filter((_, index) => index !== tagIndex));
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Hashtags"
          onChange={(e) => setInputTag(e.target.value)}
          value={inputTag}
          className="bg-transparent py-[3px] rounded border border-[#424242]"
        />
        <button type = 'button'
          className="bg-white text-[4.5vw] w-[6.5vw] h-[6.5vw] ml-2 px-1 rounded text-black"
          onClick={addHasTags}
        >
        +
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {hastags.map((hashtag, index) => (
          <div
            key={index}
            className="bg-white opacity-50 flex items-center text-black rounded px-2"
          >
            <label className="mr-1">#{hashtag}</label>
            <RxCross2
              onClick={() => deleteTag(index)}
              color="black"
              className="cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TagInput;
