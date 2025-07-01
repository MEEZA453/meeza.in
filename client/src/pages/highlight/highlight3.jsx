import React from 'react'
import ImageCaro from '../../components/imageCaro.jsx'
import songoku from '../../assets/images/posters/songoku.webp'
import songoku2 from '../../assets/images/posters/goku2.webp'
import songoku3 from '../../assets/images/posters/goku3.jpg'
import sec11 from '../../assets/images/posters/raven.webp'
import sec12 from '../../assets/images/posters/raven.webp'

import sec01 from '../../assets/images/posters/sec01.webp'
import sec02 from '../../assets/images/posters/sec02.webp'
import sec03 from '../../assets/images/posters/highlight2.webp'



import love from '../../assets/images/posters/valentine.webp'
import SelectedWorks from '../../components/selectedWorks.jsx'
import Highlight from '../../pages/highlight/highlight.jsx'
import logo from '../../assets/images/logo/whiteapplogo.png'
import gsap from 'gsap'
import { useEffect , useRef } from 'react'
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom'
import ShopNavber from '../../components/navber/shopnavber.jsx'
gsap.registerPlugin(ScrollTrigger)


function highlight3() {
const textRef = useRef(null)
useEffect(()=>{
    textAnimation()
    animation1()
    animation2()
},[])
const navigate = useNavigate()
const animation1 = ()=>{

    const tl = gsap.timeline({scrollTrigger : {
        trigger : '.image-section-1' , 
        start : 'top 80%' ,
        end : "top top" , 
        scrub : true ,
    }})
    tl.to('.image3' , {
        x : 0 , 
        rotate : 0,
        duration : 2
        
    }) .to('.image1' , {
        x : 0 , 
        rotate : 0,
        duration : 2
        
    })
}
    const animation2 = ()=>{

        const tl = gsap.timeline({scrollTrigger : {
            trigger : '.image-section-2' , 
            start : 'top 80%' ,
            end : "top top" , 
            scrub : true ,
        }})
        tl.to('.image4' , {
            x : 0 , 
            rotate : 0,
            duration : 2
            
        }) , tl.to('.image5' , {
            x : 0 , 
            rotate : 0,
            duration : 2
            
        })
    
    
   
  
}
const textAnimation =()=>{
    gsap.to(textRef.current , {
        y : 0 , 
        scrollTrigger : {
            trigger : textRef.current , 
            start : 'top 43% ' ,
            end : 'top top' ,
            scrub : true
        }
    })
}


  return (
    <div className='w-screen '>


        <div className="sticky top-0">
        {/* <Highlight/> */}
        
        <ImageCaro/>
        
        </div>
        <div>

        </div>
       
            <div className='bg-black relative  z-[9999] whole-container'>
                  <div className='flex flex-col items-center justify-center'>


                <h3 ref ={textRef} className=' -translate-y-[60vh] lg:text-[17px] mt-8'>A creative enclyclopedia of Designs.</h3>
          
                </div>   
               

    <div className='w-full mt-24 flex justify-center '> </div>
    <div className='image-section-1  w-full  mt-20 justify-center items-center'>
        <div className="imagesContainer -translate-x-[2vw]  lg:translate-x-[20vw] flex gap-2 lg:gap-5">
            <div className  = 'image1 rotate-[4deg] translate-x-[30vw]'>
                <p className='mb-1'>v1</p>
                <img className=' w-[30vw] lg:w-[20vw]' src={sec01} alt="" />
            </div>

            <div className  = 'image2'>
                <p className='mb-1'>v1</p>
                <img className=' w-[30vw] lg:w-[20vw]'  src={sec02} alt="" />
            </div>

            <div className  = 'image3 -translate-x-[35vw] -rotate-[4deg] w-[30vw] lg:w-[20vw]'>
                <p className='mb-1'>v1</p>  
                <img  className=' ' src={sec03} alt="" />
            </div>

        </div>  

<div className="flex lg:translate-x-[15vw] mt-8 gap-[65vw]"><h5>2024</h5><h5>SONGOKU </h5></div>
{/* <h3 className='w-[90%] lg:w-[35vw] leading-5 lg:leading-7 mt-20 lg:translate-x-[15vw]'> “ This  is a poster which i have made for highlight hero section and it has the version of color white , blue and yellow  the texture of this poster is good. “</h3> */}
        </div>


        <div className='image-section-2 w-full overflow-x-hidden mt-20 justify-center items-center'>
        <div className="imagesContainer   translate-x-[20vw] flex gap-5">
            <div className  = 'image4 translate-x-[15vw] -rotate-[3deg]'>
                <p className='mb-1'>v1</p>
                <img className= ' w-[30vw] lg:w-[20vw]'  src={sec11} alt="" />
            </div>

            <div className  = 'image5 rotate-[5deg]  -translate-x-[20vw]'>
                <p className='mb-1'>v1</p>  
                <img  className='w-[30vw] lg:w-[20vw]' src={sec12} alt="" />
            </div>

        </div>  

<div className="flex translate-x-[5vw] lg:translate-x-[15vw] pb-3 mt-8 gap-[56vw]   lg:gap-[70vw]"><h5>2024</h5><h5> Timeless Edition  </h5></div>

        </div>
<div className='mt-24'>

</div>
        <SelectedWorks/>

        <div className='w-screen  h-[50vh] lg:h-screen  flex items-center justify-center relative'>
        
            <div className='flex flex-col items-center justify-center'>
                <h1 className=' tracking-normal max-sm:text-[10vw] max-sm:leading-8'>meeza .in</h1>
                <h3 className='lg:text-[17px] text-[15px] mt-1 lg:mt-2'>A crative enclyclopedia of Designs</h3>
                <button onClick={()=>navigate('/products')} className="bg-white text-black font-[inter-regular] tracking-tighter text-[14px]  px-3 mt-2 lg:mt-5 rounded-[3px]">Explore Now✨</button>
                </div>   
                <div className='w-full absolute bottom-2 items-end flex justify-between'>

                    <div><img  className = "lg:w-8 w-7"src={logo} alt="" /></div>   
                <div className='flex flex-col lg:flex-row  gap-8 lg:gap-12 items-end pr-4 max-sm:mb-2 lg:mr-12'>
                    <h5>Be</h5><h5>IG</h5><h5>GITHUB</h5></div>   

                </div>
        </div>
            </div>
    </div>
   
  )
}

export default highlight3