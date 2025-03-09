import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useDispatch, useSelector } from "react-redux";
import { updateCartItem } from "../../store/actions/cart.js"; 
import img from '../../assets/images/posters/freedom.webp';

function Cart({ isCartOpen, handleClose }) {
  const cartRef = useRef(null);
  const overlayRef = useRef(null);
  const dispatch = useDispatch();

  const cartDetails = useSelector((state) => state.cart);
  const state  = useSelector((state)=> state)
  console.log(state)
  console.log(cartDetails)
  const [cart, setCart] = useState([]);

  // Sync local state with Redux cart state
  useEffect(() => {
    setCart(cartDetails);
  }, [cartDetails , isCartOpen]);
console.log(cart)
  // GSAP animation for cart open/close
  useEffect(() => {
    if (isCartOpen) {
      gsap.to(cartRef.current, { x: 0, duration: 0.7, ease: "power3.out" });
      gsap.to(overlayRef.current, { opacity: 1, pointerEvents: "auto", duration: 0.3 });
    } else {
      gsap.to(cartRef.current, { x: "100%", duration: 0.7, ease: "power3.out" });
      gsap.to(overlayRef.current, { opacity: 1, pointerEvents: "none", duration: 0.3 });
    }
  }, [isCartOpen]);

  // Calculate total amount
  const getTotal = () => {
    return cart.reduce((acc, el) => acc + el.amount * el.quantity, 0);
  };

  // Increment item quantity
  const incQuantity = (index) => {
    const updatedCart = cart.map((el, i) =>
      i === index ? { ...el, quantity: el.quantity + 1 } : el
    );
    setCart(updatedCart);
    dispatch(updateCartItem(updatedCart[index])); // Update Redux store
  };

  // Decrement item quantity
  const decQuantity = (index) => {
    const updatedCart = cart.map((el, i) =>
      i === index && el.quantity > 1 ? { ...el, quantity: el.quantity - 1 } : el
    );
    setCart(updatedCart);
    dispatch(updateCartItem(updatedCart[index])); // Update Redux store
  };

  return (
    <div
      ref={overlayRef}
      className="fixed z-[999] inset-0  flex justify-end transition-opacity"
      onClick={handleClose}
      style={{ opacity: 0, pointerEvents: "none" }}
    >
      {/* Slide-in Cart Panel */}
      <div
        ref={cartRef}
        className=" bg-black bg-opacity-50 w-[350px] h-full shadow-lg p-6 relative"
        style={{ transform: "translateX(100%)" }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button onClick={handleClose} className="absolute top-3 right-3 text-2xl  font-bold">×</button>
        <h2 className="text-xl font-[inter-regular] mb-4 ">Cart</h2>

        {/* Cart Items */}
        {cart.length > 0 ? (
          cart.map((el, index) => (
            <div key={index} className="  border-b border-[#b1b1b1] py-2">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="text-lg">{el.name}</h5>
                  <p className="text-sm leading-4">{el.desc}</p>
                  <h3 className="text-lg">${el.amount}</h3>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => incQuantity(index)} className="h-6 w-6 bg-[#555555] bg-opacity-50 flex justify-center items-center">+</button>
                    <span className="h-6 w-6 flex justify-center items-center">{el.quantity}</span>
                    <button onClick={() => decQuantity(index)} className="h-6 w-6 bg-[#555555] bg-opacity-50 flex justify-center items-center">-</button>
                  </div>
                </div>
                <img src={el.img} alt={el.name} className="w-[15vw]" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-[#dadada]">do add something.</p>
        )}

        {/* Footer Section */}
        <div className="flex absolute bottom-2 w-full gap-[27vw] items-center">
          <h3 className="">${getTotal()}</h3>
          <button className="border w-[50%]  text-[#dadada] rounded-full">Place Order</button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
