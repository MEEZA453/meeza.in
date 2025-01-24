import React from 'react';
import { IoMdStar } from "react-icons/io";

function CardOfTheHighlightPosters({ details }) {
  const star = details.rating; // Number of stars to highlight

  return (
    <div className="h-[7vh] w-[20vw] bg-[#d9d9d9] flex-col justify-between px-1 py-2 rounded">
      <div className="flex-col justify-around">
        <div className="flex justify-between">
          <h3 className="text-wrap text-black tracking-tighter">{details.name.toUpperCase()}</h3>
          <h3 className="text-[1.4vw] text-black  tracking-tighter">${details.price}</h3>
        </div>

        <p>{details.desc}</p>
      </div>

      <div className="flex justify-between">
        <div className="flex">
          {[0, 1, 2, 3, 4].map((index) => (
            <IoMdStar
              key={index}
              color="black"
              size={20}
              className={index < star ? "opacity-60" : "opacity-20"}
            />
          ))}
        </div>

        <p className="hastags">#nature #poster</p>
      </div>
    </div>
  );
}

export default CardOfTheHighlightPosters;
