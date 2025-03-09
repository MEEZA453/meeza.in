import React, { useEffect, useState , useRef } from "react";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import songoku from '../assets/images/posters/songoku.webp'
import starlight from '../assets/images/posters/STARLIGHT.webp'
import pro from '../assets/images/posters/pro.webp'
import abandance from '../assets/images/posters/abundance.webp'
import blackhole from '../assets/images/posters/black hole.webp'
import dreaming from '../assets/images/posters/dreaming.webp'
import obito from '../assets/images/posters/obito.jpg'
import glory from '../assets/images/posters/glory.webp'
import freedom from '../assets/images/posters/freedom.webp'
import founder from '../assets/images/posters/founder.webp'
import nostalogia from '../assets/images/posters/nostalogia2x.jpg'
import outdoor from '../assets/images/posters/outdoor.jpg'
import suspended from '../assets/images/posters/suspended.webp'
import solace from '../assets/images/posters/solac.jpeg'
import prism from '../assets/images/posters/prism.webp'
import mirror from '../assets/images/posters/mirror.webp'
import wanted from '../assets/images/posters/wanted.webp'












import Modal from 'react-modal'






gsap.registerPlugin(ScrollTrigger);

function SelectedWorks({isBlur , setIsBlur}) {

 
  const [selectedWorks , setSelectedWorks ] = useState([
   
    
    {
      name: "Starlight",
      image: starlight,
      year: 2024,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Suspended",
      image: suspended,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Prism",
      image: prism,
      year: 2024,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Mustang glory",
      image: glory,
      year: 2023,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Unreveled",
      image: obito,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Solace",
      image: solace,
      year: 2024,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Outdoor",
      image: outdoor,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Nostalogia",
      image: nostalogia,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Profile_234b",
      image: pro,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Mirror",
      image: mirror,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    }, 
    {
      name: "Blackhole",
      image: blackhole,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    },     {
      name: "The founder titan",
      image: founder,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    },     {
      name: "Dreaming",
      image: dreaming,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    },     {
      name: "Freedom",
      image: freedom,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    },     {
      name: "Abundance",
      image: abandance,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    },     {
      name: "Wanted",
      image: wanted,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    },     {
      name: "Songoku",
      image: songoku,
      year: 2025,
      Designer : '@madebymeeza',
      isOpen: false, isImageOpen : false,
      technologyUsed: "MERN",
    },  
  ]);

  const selectedWorksRef = useRef(selectedWorks)
  const triggerRef = useRef([])
  const [currentImageIndex , setCurrentImageIndex ] = useState(null)

  useEffect(() => {
    selectedWorks.forEach((_, index) => {
      const trigger = ScrollTrigger.create({
        trigger: `.animation-${index}`,
        start: "top 40%",
        end: "top 35%",
        onEnter: () => {
          setSelectedWorks((prev) =>
            prev.map((work, i) =>
              i === index ? { ...work, isOpen: true } : { ...work, isOpen: false }
            )
          );
        },
        onEnterBack: () => {
          setSelectedWorks((prev) =>
            prev.map((work, i) =>
              i === index ? { ...work, isOpen: true } : { ...work, isOpen: false }
            )
          );
        },
        onLeaveBack: () => {
          setSelectedWorks((prev) =>
            prev.map((work) => ({ ...work, isOpen: false }))
          );
        },
      });
      triggerRef.current.push(trigger);
    });

    return () => {
      triggerRef.current.forEach((trigger) => trigger.kill());
    };
  }, []);

  const onClickAnimation = (index , work) => {
    setSelectedWorks((prevWork) =>
      prevWork.map((el, i) => ({
        ...el,
        isOpen: i === index ? !el.isOpen : false, // Toggle open state
      }))
    );
  };

  // const onImageClick = (index) => {
  //   console.log('clicked on image' ,index)
  //   setCurrentImageIndex(index);
  // };

  const closeModal = () => {
    console.log('clicked to close')
    setCurrentImageIndex(null);
  };

  return (
    <div className="bg-black selected-works">
      <div className="">

      
      <div className="w-full  lg:text-[10px] flex justify-between border-b-[1px] border-[#6c6c6c]  pb-2 mb-1 px-1">
        <div className="flex  gap-6 lg:gap-56">
          <h5>no:</h5>
          <h5>Designer:</h5>

        </div>
        <div className="flex gap-6 lg:gap-56">
          <h5>Title:</h5>
        <h5>Year:</h5>
        </div>
      </div>

      {selectedWorks.map((work, index) => (
  <div
    onClick={() => onClickAnimation(index , work)}
    key={index}
    className={` py-1 animation-${index} relative w-full flex justify-between  ${
      work.isOpen ? "bg-[#e0e0e0] text-[#00000022]" : ""
    } px-1`}
  >
    {work.isOpen && (
      <div className="absolute left-[45vw]  top-[3vh] lgtop-[10vh] z-50">
        <img
          onClick={() => {}}
          loading="lazy"
          src={work.image}
          className="w-[40vw] lg:w-[15vw] cursor-pointer"
          alt={work.name}
        />
      </div>
    )}
    <div className ="flex gap-6 lg:gap-56">
    <h5 className={` w-[20px] ${work.isOpen ? " text-[#00000022]" : ""}
} `}>{index < 9 ? "0" : null}{index + 1}</h5>
 <h5 className={` ${work.isOpen ? " text-[#00000022]" : ""}
} `}>{work.Designer}</h5>

    </div>
    <div className="flex gap-6 lg:gap-56">
      <h5>{work.name}</h5>
      <h5>{work.year}</h5>
    </div>
  </div>
))}


    
      <Modal className="bg-white" isOpen={currentImageIndex !== null} onRequestClose={closeModal}>
        {currentImageIndex !== null && (
          <Imageviewer
            images={selectedWorks.map((work) => work.image)}
            currentIndex={currentImageIndex}
            onClose={closeModal}
          />
        )}
      </Modal>

      </div>
 <div className="h-[20vh]"></div>

    </div>
  );
}

export default SelectedWorks;