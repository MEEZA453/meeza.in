import React, { useRef, useEffect, useState } from "react";
import HighlightNabver from "../../components/navber/highlightnavber.jsx";
import HighlightMenu from "../../components/highlightmenu.jsx";
import CardOftheHighlight from "../../components/cards/cardofthehighlightposters.jsx";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
  import posterStarlight from "../../assets/images/posters/starlightpsot.jpg";
  import starlight from "../../assets/images/posters/STARLIGHT.jpg";
  import abundance from "../../assets/images/posters/abandance.jpg";
  import faded from "../../assets/images/posters/glory.jpg";
import HyperText from "../../components/ui/hyper-text.jsx";
import video from '../../assets/videos/videoplayback.mp4'
import {useDispatch , useSelector} from 'react-redux'
import { getDesign } from "../../store/actions/design.js";

gsap.registerPlugin(ScrollTrigger);

function Highlight() {
  const dispatch = useDispatch()



  const currentSection = useRef(null); // Ref to track the current section
  const [renderedHighlight, setRenderedHighlight] = useState(null);
  const [page , setPage] = useState(1);
  const [loading , setLoading] = useState(true)
  const BASE_URL = 'http://localhost:8080'
  
  let  handleDependenCies = 0   


  useEffect(()=>{
    ( async ()=>{
      try {
        await dispatch(getDesign(page))
        setLoading(false)
      } catch (error) {
        console.log('error of dispatching', error)
      }
    })()
  },[loading , page])

  const designs = useSelector((state)=> state.design)
  console.log(designs)
  
  
  

  const highlightsDeta = [
    {
      name: "#@&%*#^ ",
      id: 1,
      desc: "this is a limited edition",
      price: 25,
      rating: 3,
      img1: starlight,
      img2: posterStarlight,
    },
    {
      name: "abundance",
      id: 2,
      desc: "surrelism is a surrelism",
      price: 23,
      rating: 2,
      img1: abundance,
      img2: faded,
    },
    {
      name: "THE WEEKND",
      id: 3,
      desc: "this is a limited edition",
      price: 25,
      rating: 5,
      img1: starlight,
      img2: posterStarlight,
    },
    {
      name: "BOUNDLESS",
      id: 4,
      desc: "surrelism is a surrelism",
      price: 23,
      rating: 2,
      img1: abundance,
      img2: faded,
    }, 
    {
      name: "STAR BOY",
      id: 5,
      desc: "surrelism is a surrelism",
      price: 23,
      rating: 2,
      img1: abundance,
      img2: faded,
    }
  ];


  useEffect(() => {
    if (renderedHighlight) {
      gsap.to(`.heading`, {
        translateY: -42    * (renderedHighlight.id - 1), // Adjust translateY based on active section
        duration: 1,
        ease: "power3.out",
      });
    }
  }, [renderedHighlight]);
  

    // Clean up the event listener when the component is unmounted
  useEffect(() => {
    highlightsDeta.forEach((deta) => {
      gsap.to(`.imgcontainer${deta.id}`, {
        duration: 2,
        scrollTrigger: {
          trigger: `.imgcontainer${deta.id}`,
          start: "top center", // Trigger when the section enters the viewport
          end: "bottom center", // Trigger when the section leaves the viewport
          onEnter: () => {  updateHighlight(deta)},
  
          
          

          onLeaveBack: () => {
            const prevIndex = highlightsDeta.findIndex(
              (item) => item.id === deta.id
            ) - 0;
            if (prevIndex >= 0) {
              updateHighlight(highlightsDeta[prevIndex]);
            }
          },
        },
      });
    });

    // Cleanup GSAP triggers
    return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }, [renderedHighlight]);

  const updateHighlight = (deta) => {
    // Only update if the current section changes
    if (currentSection.current !== deta.id) {
      currentSection.current = deta.id;
      setRenderedHighlight(deta);
    }
  };

  return (
    <div className="main">

     

      <div className="absolute w-full h-[1000vh]">
{/* <div className=" sticky top-0  z-0"><div className="w-[100vw] h-[100vh] absolute opacity-80  bg-black"></div><video autoPlay muted loop className="w-full h-fit "  src={video}></video></div> */}
        {designs.map((highlight) => (
          <div
            key={highlight.id}
            className={`imgcontainer${highlight.id} relative w-full h-[100vh]`}
          >
            <img
              className="w-[20vw]  absolute top-[5vh] right-[5vh]"
              src={BASE_URL+highlight.image[0]}
              alt=""
            />
            <img
              className="w-[17vw]  absolute bottom-[5vh] left-[5vw]"
              src={BASE_URL + highlight.image[0]}
              alt=""
            />
          </div>
        ))}
      </div>

      <div  data-scroll
        data-scroll-sticky
        data-scroll-target="[data-scroll-container]"
      className="sticky top-0">
        <div  className="w-[98vw] h-[100vh] items-center justify-center">
   

          <HighlightNabver />
          <HighlightMenu />

          <div className="  items-center overflow-hidden absolute h-[4.5vh] w-[18vw] top-[49vh] left-[44vw]">
            <div className="heading z-40">

         <HyperText
            rederedHighlight = {renderedHighlight}
              text={Highlight.name}
            />
        

   </div>

          </div>

         
          {/* <h1
            ref={titleRef}
            className="title absolute top-[49vh] left-[44vw] max-sm:left-[35vw]"
          >
            {renderedHighlight
              ? renderedHighlight.name.toUpperCase()
              : "@#!&*^%"}
          </h1> */}
          <div className="absolute z-50 bottom-16 right-10">
            {renderedHighlight && (
              <CardOftheHighlight details={renderedHighlight} />
            )}
          </div>
        </div>
      </div>

      <div className="w-[95vw] h-[700vh]"></div>
    </div>
  );
}

export default Highlight;
