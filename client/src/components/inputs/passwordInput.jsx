import React, { useState } from 'react';
import { LuEyeOff } from "react-icons/lu";
import { FiEye } from "react-icons/fi";

function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative ">
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder="Password"
        className="w-full rounded bg-[#272727] text-[.8vw] pl-3 tracking-tighter h-10 mb-1 text-white"
      />
      <button
        onClick={togglePasswordVisibility}
        type="button"
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? <FiEye/> : <LuEyeOff/>}
      </button>
    </div>
  );
}

export default PasswordInput;