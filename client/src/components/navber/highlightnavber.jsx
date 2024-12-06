import React, { useEffect, useState } from "react";
import gsap from "gsap";

function HighlightNavbar() {
  const [lineAnimation, setLineAnimation] = useState({
    line1: false,
    line2: false,
    line3: false,
    line4: false,
  });

  // Reusable GSAP Animation Function
  const animateLine = (lineClass, isActive) => {
    gsap.to(`.${lineClass}`, {
      attr: { x2: isActive ? 470 : 0 },
      duration: 1.8,
      ease: "power3.out",
    });
  };

  // UseEffect to handle animations when states change
  useEffect(() => {
    Object.keys(lineAnimation).forEach((key) => {
    
      animateLine(`${key}Animation`, lineAnimation[key]);
    });
  }, [lineAnimation]);

  // Dynamic data for sections
  const sections = [
    { id: "line1", title: "WORKS" },  
    { id: "line2", title: "SHOP" },
    { id: "line3", title: "ABOUT US" },
    { id: "line4", title: "CAREER" },
  ];  

  return (
    <div className="flex justify-between relative">
      {sections.map((section) => (
        <div
          key={section.id}
          onMouseEnter={() =>
            setLineAnimation((prev) => ({ ...prev, [section.id]: true }))
          }
          onMouseLeave={() =>
            setLineAnimation((prev) => ({ ...prev, [section.id]: false }))
          }
          className="w-1/4 pt-3 items-center"
        >
          <div className="flex justify-between ">
            <h5 className="mb-3">{section.title}</h5>
          </div>
          {/* Static line */}
          <svg
            className="w-[24vw]"
            height="1"
            viewBox="0 0 470 1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="0"
              y1="0.5"
              x2="470"
              y2="0.5"
              strokeWidth={0.5}
              stroke="white"
            />
          </svg>
          {/* Animated line */}
          <svg
            className="w-[24vw]"
            height="1"
            viewBox="0 0 470 1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              className={`${section.id}Animation`}
              x1="0"
              y1="0.5"
              x2="0"
              y2="0.5"
              strokeWidth={1}
              stroke="white"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

export default HighlightNavbar;
