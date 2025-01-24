import React from 'react'
import profile1 from '../../assets/images/customerprofilepics/profile1.webp'
import profile2 from '../../assets/images/customerprofilepics/profile2.jpg'
import profile3 from '../../assets/images/customerprofilepics/profile3.jpg' ;   
import { IoReturnDownForwardOutline } from "react-icons/io5";
import posterStarlight from "../../assets/images/posters/starlightpsot.jpg";
import starlight from "../../assets/images/posters/STARLIGHT.jpg";
import abundance from '../../assets/images/posters/abandance.jpg' ;
import dreaming from '../../assets/images/posters/dreaming.jpg' ; 
import Navber from '../../components/navber/highlightnavber.jsx'

function productall() {

 const detailOfTheProduct =  [  
{name : 'ABUNDANCE'  ,
 images : [{name : 'img1' , img : starlight} , {name : 'img2' , img : posterStarlight }] ,
  amount : 25,
   customerReviews : [
    {
      name : 'The weeknd' , 
      profilePic : profile1 ,
      desc : 'i love this product', 
      rating : 5 ,  
    }, 
    {
      name : 'Ariyana Grande' , 
      profilePic : profile2 ,
      desc : 'the quality of this poster is dope ', 
      rating : 3 ,  
    } , 
    {
      name : 'John Wisper' , 
      profilePic : profile3 ,
      desc : 'dont buy it ', 
      rating : 2 ,  
    }
   ] , 
  heading : 'Step into the cosmos with this stunning poster, Starlight Journey .' ,
  details : [  {
    title : 'Highlight' , 
    points : [
      {
      name : ' "Next stop: Nebula Station" text adds a futuristic, sci-fi touch.' , 
    }, {
      name : '   Inspiring quote: "Look out for shimmering clouds and swirling cosmic dust."' , 
    },]

  } , {
    title : 'Details' , 
    points : [
      {
      name : 'Dimensions: 18 * 24 inches' , 
  
    }, {
      name : 'detailsMaterial: Premium matte-finish paper for a modern, glare-free look.2' , 
    },{
      name : 'Weight and coordinates add a scientific, exploratory vibe:' , 
      subPoints : ['Weight: 44,400 lb' , 'Coordinates: 76°09"N 65°10"W' , 'Date: 11/11/2024' ]
    }]

  } ,{
    title : 'Why This Poster?' , 
    points : [
      {
      name : "Whether you're decorating a workspace, living area, or bedroom, this artwork speaks of curiosity, adventure, and the beauty of the stars. It’s more than just a poster—it’s a journey into the cosmos." , 
  
    },]

  } ,{
    title : 'Perfect For  : ' , 
    points : [
      {
      name : "Space and science lovers ,Sci-fi fans , Modern and minimalistic home decor themes" , 
  
    },]

  } , {
    title : 'Shipping and Delivery' , 
    points : [
      {
      name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
  
    },]

  } , {
    title : 'Releted catagories ' , 
      points : [
        {
      name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
  
    },]

  }], 
  hastags : ['black' , 'night' , 'space'] , 
  otherInfo : {
    cashOnDelivery : 'yes' , 
    returnOnDelivery : 'no' 
  }

} , 
{name : 'STARLIGHT'  ,
  images : [{name : 'img1' , img : abundance} , {name : 'img2' , img : posterStarlight }] ,
   amount : 25,
    customerReviews : [
     {
       name : 'The weeknd' , 
       profilePic : profile1 ,
       desc : 'i love this product', 
       rating : 5 ,  
     }, 
     {
       name : 'Ariyana Grande' , 
       profilePic : profile2 ,
       desc : 'the quality of this poster is dope ', 
       rating : 3 ,  
     } , 
     {
       name : 'John Wisper' , 
       profilePic : profile3 ,
       desc : 'dont buy it ', 
       rating : 2 ,  
     }
    ] , 
   heading : 'Step into the cosmos with this stunning poster, Starlight Journey .' ,
   details : [  {
     title : 'Highlight' , 
     points : [
       {
       name : ' "Next stop: Nebula Station" text adds a futuristic, sci-fi touch.' , 
     }, {
       name : '   Inspiring quote: "Look out for shimmering clouds and swirling cosmic dust."' , 
     },]
 
   } , {
     title : 'Details' , 
     points : [
       {
       name : 'Dimensions: 18 * 24 inches' , 
   
     }, {
       name : 'detailsMaterial: Premium matte-finish paper for a modern, glare-free look.2' , 
     },{
       name : 'Weight and coordinates add a scientific, exploratory vibe:' , 
       subPoints : ['Weight: 44,400 lb' , 'Coordinates: 76°09"N 65°10"W' , 'Date: 11/11/2024' ]
     }]
 
   } ,{
     title : 'Why This Poster?' , 
     points : [
       {
       name : "Whether you're decorating a workspace, living area, or bedroom, this artwork speaks of curiosity, adventure, and the beauty of the stars. It’s more than just a poster—it’s a journey into the cosmos." , 
   
     },]
 
   } ,{
     title : 'Perfect For  : ' , 
     points : [
       {
       name : "Space and science lovers ,Sci-fi fans , Modern and minimalistic home decor themes" , 
   
     },]
 
   } , {
     title : 'Shipping and Delivery' , 
     points : [
       {
       name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
   
     },]
 
   } , {
     title : 'Releted catagories ' , 
       points : [
         {
       name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
   
     },]
 
   }], 
   hastags : ['black' , 'night' , 'space'] , 
   otherInfo : {
     cashOnDelivery : 'yes' , 
     returnOnDelivery : 'no' 
   }
 
 } 
,{name : 'STARLIGHT'  ,
  images : [{name : 'img1' , img : abundance} , {name : 'img2' , img : posterStarlight }] ,
   amount : 25,
    customerReviews : [
     {
       name : 'The weeknd' , 
       profilePic : profile1 ,
       desc : 'i love this product', 
       rating : 5 ,  
     }, 
     {
       name : 'Ariyana Grande' , 
       profilePic : profile2 ,
       desc : 'the quality of this poster is dope ', 
       rating : 3 ,  
     } , 
     {
       name : 'John Wisper' , 
       profilePic : profile3 ,
       desc : 'dont buy it ', 
       rating : 2 ,  
     }
    ] , 
   heading : 'Step into the cosmos with this stunning poster, Starlight Journey .' ,
   details : [  {
     title : 'Highlight' , 
     points : [
       {
       name : ' "Next stop: Nebula Station" text adds a futuristic, sci-fi touch.' , 
     }, {
       name : '   Inspiring quote: "Look out for shimmering clouds and swirling cosmic dust."' , 
     },]
 
   } , {
     title : 'Details' , 
     points : [
       {
       name : 'Dimensions: 18 * 24 inches' , 
   
     }, {
       name : 'detailsMaterial: Premium matte-finish paper for a modern, glare-free look.2' , 
     },{
       name : 'Weight and coordinates add a scientific, exploratory vibe:' , 
       subPoints : ['Weight: 44,400 lb' , 'Coordinates: 76°09"N 65°10"W' , 'Date: 11/11/2024' ]
     }]
 
   } ,{
     title : 'Why This Poster?' , 
     points : [
       {
       name : "Whether you're decorating a workspace, living area, or bedroom, this artwork speaks of curiosity, adventure, and the beauty of the stars. It’s more than just a poster—it’s a journey into the cosmos." , 
   
     },]
 
   } ,{
     title : 'Perfect For  : ' , 
     points : [
       {
       name : "Space and science lovers ,Sci-fi fans , Modern and minimalistic home decor themes" , 
   
     },]
 
   } , {
     title : 'Shipping and Delivery' , 
     points : [
       {
       name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
   
     },]
 
   } , {
     title : 'Releted catagories ' , 
       points : [
         {
       name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
   
     },]
 
   }], 
   hastags : ['black' , 'night' , 'space'] , 
   otherInfo : {
     cashOnDelivery : 'yes' , 
     returnOnDelivery : 'no' 
   }
 
 } 
 ,{name : 'STARLIGHT'  ,
  images : [{name : 'img1' , img : abundance} , {name : 'img2' , img : posterStarlight }] ,
   amount : 25,
    customerReviews : [
     {
       name : 'The weeknd' , 
       profilePic : profile1 ,
       desc : 'i love this product', 
       rating : 5 ,  
     }, 
     {
       name : 'Ariyana Grande' , 
       profilePic : profile2 ,
       desc : 'the quality of this poster is dope ', 
       rating : 3 ,  
     } , 
     {
       name : 'John Wisper' , 
       profilePic : profile3 ,
       desc : 'dont buy it ', 
       rating : 2 ,  
     }
    ] , 
   heading : 'Step into the cosmos with this stunning poster, Starlight Journey .' ,
   details : [  {
     title : 'Highlight' , 
     points : [
       {
       name : ' "Next stop: Nebula Station" text adds a futuristic, sci-fi touch.' , 
     }, {
       name : '   Inspiring quote: "Look out for shimmering clouds and swirling cosmic dust."' , 
     },]
 
   } , {
     title : 'Details' , 
     points : [
       {
       name : 'Dimensions: 18 * 24 inches' , 
   
     }, {
       name : 'detailsMaterial: Premium matte-finish paper for a modern, glare-free look.2' , 
     },{
       name : 'Weight and coordinates add a scientific, exploratory vibe:' , 
       subPoints : ['Weight: 44,400 lb' , 'Coordinates: 76°09"N 65°10"W' , 'Date: 11/11/2024' ]
     }]
 
   } ,{
     title : 'Why This Poster?' , 
     points : [
       {
       name : "Whether you're decorating a workspace, living area, or bedroom, this artwork speaks of curiosity, adventure, and the beauty of the stars. It’s more than just a poster—it’s a journey into the cosmos." , 
   
     },]
 
   } ,{
     title : 'Perfect For  : ' , 
     points : [
       {
       name : "Space and science lovers ,Sci-fi fans , Modern and minimalistic home decor themes" , 
   
     },]
 
   } , {
     title : 'Shipping and Delivery' , 
     points : [
       {
       name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
   
     },]
 
   } , {
     title : 'Releted catagories ' , 
       points : [
         {
       name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
   
     },]
 
   }], 
   hastags : ['black' , 'night' , 'space'] , 
   otherInfo : {
     cashOnDelivery : 'yes' , 
     returnOnDelivery : 'no' 
   }
 
 } ,{name : 'STARLIGHT'  ,
  images : [{name : 'img1' , img : abundance} , {name : 'img2' , img : posterStarlight }] ,
   amount : 25,
    customerReviews : [
     {
       name : 'The weeknd' , 
       profilePic : profile1 ,
       desc : 'i love this product', 
       rating : 5 ,  
     }, 
     {
       name : 'Ariyana Grande' , 
       profilePic : profile2 ,
       desc : 'the quality of this poster is dope ', 
       rating : 3 ,  
     } , 
     {
       name : 'John Wisper' , 
       profilePic : profile3 ,
       desc : 'dont buy it ', 
       rating : 2 ,  
     }
    ] , 
   heading : 'Step into the cosmos with this stunning poster, Starlight Journey .' ,
   details : [  {
     title : 'Highlight' , 
     points : [
       {
       name : ' "Next stop: Nebula Station" text adds a futuristic, sci-fi touch.' , 
     }, {
       name : '   Inspiring quote: "Look out for shimmering clouds and swirling cosmic dust."' , 
     },]
 
   } , {
     title : 'Details' , 
     points : [
       {
       name : 'Dimensions: 18 * 24 inches' , 
   
     }, {
       name : 'detailsMaterial: Premium matte-finish paper for a modern, glare-free look.2' , 
     },{
       name : 'Weight and coordinates add a scientific, exploratory vibe:' , 
       subPoints : ['Weight: 44,400 lb' , 'Coordinates: 76°09"N 65°10"W' , 'Date: 11/11/2024' ]
     }]
 
   } ,{
     title : 'Why This Poster?' , 
     points : [
       {
       name : "Whether you're decorating a workspace, living area, or bedroom, this artwork speaks of curiosity, adventure, and the beauty of the stars. It’s more than just a poster—it’s a journey into the cosmos." , 
   
     },]
 
   } ,{
     title : 'Perfect For  : ' , 
     points : [
       {
       name : "Space and science lovers ,Sci-fi fans , Modern and minimalistic home decor themes" , 
   
     },]
 
   } , {
     title : 'Shipping and Delivery' , 
     points : [
       {
       name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
   
     },]
 
   } , {
     title : 'Releted catagories ' , 
       points : [
         {
       name : "Available worldwide with secure packaging to ensure your poster arrives in pristine condition.Add this cosmic masterpiece to your collection today and let your walls tell a story of exploration and wonder!" , 
   
     },]
 
   }], 
   hastags : ['black' , 'night' , 'space'] , 
   otherInfo : {
     cashOnDelivery : 'yes' , 
     returnOnDelivery : 'no' 
   }
 
 } 
  ]

  return (
    <div className=''> 
    <div className="*:">
      
    <Navber/></div>

    

      <div className="grid grid-cols-4 gap-0"> {/* Parent container for the grid */}
  {detailOfTheProduct.map((preDetails, index) => (
    <div className="group border-[#8D8D8D] border-r-[1px] border-b-[1px] relative flex flex-col items-center" key={preDetails.name}>
      {/* Product Image */}
      <img
        className="object-contain size-[85%] mt-5 duration-300 group-hover:-translate-y-4"
        src={preDetails.images[0].img}
        alt={preDetails.name}
      />

      {/* Product Details */}
      <div className="absolute bottom-1 w-[98%] flex justify-between items-center">
        <div className="flex items-center duration-300 group-hover:-translate-y-5">
          <p className="text-white uppercase">{preDetails.name}</p>
          <div className="bg-[#d9d9d9] ml-1 opacity-0 group-hover:opacity-100 duration-300 h-[0.7vw] rounded-[2px] flex items-center justify-center">
            <h4 className="text-black font-[inter-medium] text-[0.7vw] tracking-tighter px-1">$25</h4>
          </div>
        </div>
        <p>#00{index}</p>
      </div>

      {/* Tags and Icon */}
      <div className="absolute bottom-1 left-1 flex opacity-0 group-hover:opacity-100 duration-300">
        <IoReturnDownForwardOutline color="white" size={20} />
        {preDetails.hastags.map((tag, tagIndex) => (
          <p key={tagIndex} className="ml-1">#{tag}</p>
        ))}
      </div>
    </div>
  ))}
</div>
</div>
  )
}

export default productall