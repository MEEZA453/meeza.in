import React from 'react'
import logo from '../../assets/images/logo/whiteapplogo.png'
import PasswordInput from '../../components/inputs/passwordInput.jsx'

function signUp() {

const createAnAccount = ()=>{
  console.log('created')
}

  return (
    <div className='h-[100vh] justify-center w-full flex  items-center'>
      <div className=' py-3   px-2 w-full absolute top-0  border-b border-[#464646]' ><h5  className='text-[.8vw]'>MZDEZINZ</h5></div>

      <div>
      
      <div className='w-96  rounded-[3px] border  border-[#464646] items-center px-5 py-4'>
        <form className='font-[inter-regular] '  ><h3 className='mb-7 '>Signup</h3>
        <div className="flex gap-2"><input type="text" placeholder="Firstname" className='w-full rounded font-[inter-regular]  bg-[#272727] text-[.8vw] pl-3 tracking-tighter  h-10 mb-2' />
        <input type="text" placeholder="Lastname" className='w-full rounded font-[inter-regular]  bg-[#272727] text-[.8vw] pl-3 tracking-tighter  h-10 mb-2' /></div>
        
      <input type="email" placeholder="Email" className='w-full rounded font-[inter-regular]  bg-[#272727] text-[.8vw] pl-3 tracking-tighter  h-10 mb-2' />
      <PasswordInput/>
        <button onClick = {createAnAccount}className='btn-primary w-full bg-white p-2 rounded my-1 mb-40 hover:bg-black-700  text-black duration-300 '>Sigup</button>
        </form>
        <a className='bg-transparent text-white underline  text-[.8vw] tracking-tighter' href="">I already have an account</a>
      </div>
      </div>
      <div className='dev logo flex absolute bottom-4 md:bottom-10 right-4 md:right-7'>
          <div className='flex max-sm:row-reverse flex-row-reverse gap-3 md:gap-5 items-center'>
            <img src={logo} className='h-8   md:h-10 ' alt="logo" />
            <p className='text-white  max-sm:text-[12px] md:text-[15px] leading-4'>
              made by  <br />MEEZA™
            </p>
          </div>
        </div>

    </div>
  )
}

export default signUp