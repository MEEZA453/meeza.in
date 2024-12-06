import Highlight from './pages/highlight/highlight.jsx'
import Lenis from 'lenis' 
import {useEffect  } from 'react' 
import LocomotiveScroll from 'locomotive-scroll';
import Product from './pages/product/product.jsx'
import posterStarlight from "./assets/images/posters/starlightpsot.jpg";
import starlight from "./assets/images/posters/STARLIGHT.jpg";
import abundance from "./assets/images/posters/abandance.jpg";
import faded from "./assets/images/posters/glory.jpg";

function App() {

  // useEffect(() => {
  //   const scroll = new LocomotiveScroll({
  //     el: document.querySelector('[data-scroll-container]'),
  //     smooth: true,
  //     multiplier: 1, // Adjust for responsiveness
  //     damping: 0.1,     
  //     lerp : 0.1 
  //   });
  //   return () => scroll.destroy();
  // }, []);


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
  return (
    <>
  <div  data-scroll-container className = ''>

    {/* <Highlight/> */}
    <Product highlighstDeta = {highlightsDeta}/>
  </div>
    </>
  )
}

export default App
