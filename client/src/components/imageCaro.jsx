import React from 'react'
import mockUp1 from '../assets/images/mockups/img1.webp'
import mockUp2 from '../assets/images/mockups/mockup2.jpg'
import mockUp3 from '../assets/images/mockups/mockup3.jpg'
import {useState , useEffect ,useRef} from 'react'
import gsap from 'gsap' 
import ScrollTrigger from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
function imageCaro() {

const imageRef  = useRef(null)


    // useEffect(()=>{
    //     setTimeout(()=>{
    //         requestAnimationFrame(animation)

    //     },7000)
    // },[])

    // const animation = ()=>{
    //     gsap.to(imageRef.current , {
    //         x : '-100vw' , 
    //         duration : 3 ,  
    //     })
    //     requestAnimationFrame(animation)
    // }

    const [images , setImages] = useState([
        {image : mockUp1 , isShown : true}  , 
        {image : mockUp2 , isShown : true}  , 

        {image : mockUp3 , isShown : true}  , 

    ])
  return (
    <div className=''>

        <div className='absolute top-0 w-screen e z-50 flex justify-center items-center h-screen bg-black opacity-50'></div>


<div className='overflow-hidden relative w-screen'>


        <div ref={imageRef} className='images flex  bg-zinc-50 w-[300vw] h-screen'>
<div className=' flex absolute gap-1 bottom-2 right-1/2'>
    <div className='rounded-full h-[5px] w-[5px] bg-black'></div>
    <div className='rounded-full h-[5px] w-[5px] bg-black'></div>
    <div className='rounded-full h-[5px] w-[5px] bg-black'></div>

    
</div>
{
    images.map((el , index)=>{
        return <div key={index}>

               <img  className = "w-[100vw] h-screen object-cover" src={el.image} alt="" />
        </div>
    })
}
     

        </div>
        </div>
    </div>
  )
}

export default imageCaro