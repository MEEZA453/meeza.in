  import React, { useState, useRef, useEffect } from "react";
  import Navber from '../../components/navber/highlightnavber.jsx'
  import Lenis from "@studio-freight/lenis/types";
  import image1 from "../../assets/images/posters/glory.jpg";
  import image2 from "../../assets/images/posters/glory.jpg";
  import image3 from "../../assets/images/posters/glory.jpg";
  import image4 from "../../assets/images/posters/solace.png";
  import image5 from "../../assets/images/posters/wanted.jpg";
  import image6 from "../../assets/images/posters/nostalogia@2x.jpg";
  import image7 from '../../assets/images/posters/prism.jpg'
  import image8 from '../../assets/images/posters/pro.jpg'
  import image9 from '../../assets/images/posters/goku3.jpg'
  import image10 from '../../assets/images/posters/outdoor.jpg' 
  import image11 from '../../assets/images/posters/timeless.jpg'
  import image12 from '../../assets/images/posters/dreaming.jpg'
  import image13 from '../../assets/images/posters/abandance.jpg'

  import logo from '../../assets/images/logo/whiteapplogo.png'

  
  import gsap from "gsap";
  import ScrollTrigger from "gsap/ScrollTrigger";
import { redirect, useNavigate } from "react-router-dom";
  gsap.registerPlugin(ScrollTrigger)
  function Highlight() {
    const initialImages = [image1, image2, image3, image4, image5, image6 , image7 , image8  ];
     const initialImages2 = [image7 , image8 , image9 , image10 , image11 , image12 , image13 ]
    const [images, setImages] = useState([... initialImages ]);
    const [images2, setImages2] = useState([...initialImages2]);

    const columnArr = Array.from({ length: 12 }); // Create 7 columns
    const column1 = [image1, image2 , image3 , image4  , image7]
    const navigate = useNavigate()
    const observerRef = useRef(null);
    const triggerRefs = useRef([]); // Store multiple refs for all columns
    const firstSectionOfOdd = useRef([])
    const sacondSectionOfOdd  = useRef([])
    const firstSectionOfEven = useRef([])
    const sacondSectionOfEven  = useRef([])
    const firstColumnRef = useRef([])
    const sacondColumnRef = useRef([])
  
  let yPercentforOdd = 0 ;
  let yPercentforEven = 0 ;

  let directionforOdd = -1;
  let directionforEven = 1;



    const lenisRef = useRef(null);
  
    useEffect(() => {
      // Initialize Lenis
      const lenis = new Lenis({
        duration: 5, // Smoothness of scrolling
        smooth: true,
        lerp : 1
        
      });
      lenisRef.current = lenis;
  
      // Animation frame loop for Lenis
      const animate = (time) => {
        lenis.raf(time);
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
  
      console.log('Lenis initialized');

    }, []);
  

    useEffect(()=>{
  requestAnimationFrame(animation)
    },[sacondColumnRef , firstColumnRef])

    const animation = ()=>{
  const sectionEven = gsap.utils.toArray(firstColumnRef.current)
  sectionEven.forEach((el)=>{
    
    if(el) gsap.set(firstSectionOfOdd.current, {yPercent : yPercentforOdd})
    gsap.set(sacondSectionOfOdd.current, {yPercent : yPercentforOdd})

    if(yPercentforOdd <= -100){
      yPercentforOdd = 0
    } 
    yPercentforOdd += 0.001 * directionforOdd
  })


  const sectionOdd = gsap.utils.toArray(sacondColumnRef.current)

  sectionOdd.forEach((el)=>{
  gsap.set(firstSectionOfEven.current , {yPercent : yPercentforEven})
    gsap.set(sacondSectionOfEven.current, {yPercent : yPercentforEven})
 
    if(yPercentforEven >= 100){
      yPercentforEven = 0
    }
    yPercentforEven += 0.002 * directionforEven
  })


      // gsap.set(sacondSection.current , {yPercent : yPercent})
      requestAnimationFrame(animation)
    }
    
useEffect(()=>{
gsap.to('.imagesCont' , {
  y :'-40vh', 
  scrollTrigger : {
    trigger : '.imageCont' , 
    scrub : true , 
    start : 'top top' , 

  }
  
})

  gsap.to(firstSectionOfOdd.current , {
    y : '-30vw',
    scrollTrigger : {
      trigger :'.imagesCont'  , 
      start :'top top' , 
      end : 'bottom top' , 
      scrub : true
    },
    duration : 3 ,
   })
   gsap.to(sacondSectionOfOdd.current , {
    y :  '-30vw',
    scrollTrigger : {
      trigger : '.imagesCont'  , 
      start :'top top' , 
      end : 'bottom top' , 
      scrub : true
    },
    duration : 3 ,
   }) 
  
   gsap.to(firstSectionOfEven.current , {
    y : '70vw',
    scrollTrigger : {
      trigger :  '.imagesCont'  , 
      start :'top top' , 
      end : 'bottom top' , 
      scrub : true
    },
    duration : 3 ,
   })
   gsap.to(sacondSectionOfEven.current , {
    y : '70vw',
    scrollTrigger : {
      trigger : '.imagesCont'  , 
      start :'top top' , 
      end : 'bottom top' , 
      scrub : true
    },
    duration : 3 ,
   })
  
  
},[])
    const handleButtonClick =()=>{
 

    }
    return (


      <div ref={lenisRef} className=" h-screen w-screen overflow-hidden">


        
        <Navber/>
<div className="absolute z-[999] top-0">

        <div className='w-screen h-screen  flex items-center justify-center relative'>
            <div className='flex flex-col items-center justify-center'>

                <h3 className='lg:text-[17px] mt-2'>A crative enclyclopedia of Designs.</h3>
          
                </div>   
               
        </div>

</div>

  <div className = " h-screen  imagesCont w-screen lg:overflow-hidden rounded-3xl ">
        <div className  ="w-screen h-screen bg-black opacity-85 absolute z-50"></div>
    <div className="  lg:overflow-hidden">

    <div className="h-[100vw]  -translate-x-[20vw] lg:scale-125 lg:rotate-[30deg] rotate-90 scale-[3] w-[100vw]">




      <div  className="images-section max-sm:w-screen  flex gap-2">

      
        {columnArr.map((_, index) => (
          <div key={index} >
            <div ref={ (el)=>(  index  % 2 === 0 ? firstColumnRef.current[index] = el : sacondColumnRef.current[index] = el)  }
              className={`  column-${index} flex gap-2 ${
                index % 2 === 0 ? "flex-col-reverse first" : "flex-col second -translate-y-[65%] "
              }`}
              >
              <div ref={(el)=>( index % 2 === 0 ? firstSectionOfOdd.current[index] = el : firstSectionOfEven.current[index] = el)}>

              { index % 2 === 0 ? images.map((img, i) => (
                <div className="flex flex-col  gap-3" >
  <div className="flex w-[9vw] justify-center items-center">
  
                <img key={i} className="w-[7vw] mb-12" src={img} alt={`Poster ${i}`} />
  </div>
                </div>
              )):images2.map((img, i) => (
                <div className="flex flex-col  gap-3" >
  <div className="flex w-[9vw] justify-center items-center">
  
                <img key={i} className="w-[7vw] mb-12" src={img} alt={`Poster ${i}`} />
  </div>
                </div>
              ))}
              </div> <div ref = {(el)=>( index % 2 === 0 ? sacondSectionOfOdd.current[index] = el :  sacondSectionOfEven.current[index] = el)}>
              { index % 2  === 0 ? images.map((img, i) => (
                <div className="flex flex-col  gap-3" >
  <div className="flex w-[9vw] justify-center items-center">
  
                <img key={i} className="w-[7vw] mb-12" src={img} alt={`Poster ${i}`} />
  </div>
                </div>
              )):images2.map((img, i) => (
                <div className="flex flex-col  gap-3" >
  <div className="flex w-[9vw] justify-center items-center">
  
                <img key={i} className="w-[7vw] mb-12" src={img} alt={`Poster ${i}`} />
  </div>
                </div>
              ))}
              </div>
              {/* Load more trigger (moved to bottom) */}
            
            </div>
          </div>
        ))}
      </div>
        </div>
        
    </div>
    </div>
        </div>
    );
  }

  export default Highlight;
