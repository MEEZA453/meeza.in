import React, { useEffect, useState } from "react";
import gsap from "gsap";
import Cart from "../cart/cart.jsx";
import {useNavigate} from 'react-router-dom'
import { useSelector } from "react-redux";

function ShopNavber(cartDetails) {
  console.log(cartDetails)

const navigate = useNavigate()
  const cartArr = [] ; 
  cartArr.push(cartDetails)
  const [lineAnimation, setLineAnimation] = useState({
    line1: false,
    line2: false,
    line3: false,
    line4: false,
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const cartLength = useSelector((state) => state.cart);
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
    { id: "line1", title: "Home" , navigate : ()=> {navigate('/')}   },
    { id: "line2", title: "shop" , navigate : ()=> {navigate('/products')} },
    { id: "line3", title: "Account" },
    { id: "line4", title: `[ ${cartLength.length} ]` },
  ];

  return (
    <div className="flex bg-black   bg-opacity-80   justify-between relative">
      {sections.map((section, index) => (
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
          <div
            onClick={() => {
              if (index === 3) setIsCartOpen(true);
            }}
            className="flex justify-between cursor-pointer"
          >
            <h5 onClick={section.navigate} className={`mb-3 capitalize ${index == 3 ? 'ml-[13vw]':null}  ${index == 2 ? 'ml-[5vw]':null}`}>{section.title}</h5>
          </div>
          {/* Static line */}
          <svg
            className="w-[24.5vw]"
            height="1"
            viewBox="0 0 470 1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="0" y1="0.5" x2="490" y2="0.5" strokeWidth={0.5} stroke="white" />
          </svg>
          {/* Animated line */}
          <svg
            className="w-[24.5vw]"
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
      {/* Cart with GSAP Animation */}
      <div className="z-[999]">

      <Cart isCartOpen={isCartOpen} handleClose={() => setIsCartOpen(false)} />
      </div>
    </div>
  );
}

export default ShopNavber;
