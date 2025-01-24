import React from 'react'
import Navber from '../../components/navber/highlightnavber.jsx' ; 
import posterStarlight from "../../assets/images/posters/starlightpsot.jpg";
import starlight from "../../assets/images/posters/STARLIGHT.jpg";
import profile1 from '../../assets/images/customerprofilepics/profile1.webp'
import profile2 from '../../assets/images/customerprofilepics/profile2.jpg'
import profile3 from '../../assets/images/customerprofilepics/profile3.jpg' ; 
import abundance from '../../assets/images/posters/abandance.jpg' ;
import dreaming from '../../assets/images/posters/dreaming.jpg' ;
import { IoReturnDownForwardOutline } from "react-icons/io5";

import glory from '../../assets/images/posters/glory.jpg' ;

import wanted from '../../assets/images/posters/wanted.jpg' ;


function product(highlightsDeta) {



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
      name : 'detailsMaterial:s Premium matte-finish paper for a modern, glare-free look.2' , 
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
  hastags : [{
    title : 'Releted Products' , 
    hastags : ['black' , 'night' , 'space']
  }] , 
  otherInfo : {
    cashOnDelivery : 'yes' , 
    returnOnDelivery : 'no' 
  }

} , 

  ]

  return (
    <div className=''><Navber/>
    
    <div className='images'>
      {
        detailOfTheProduct.map((images)=>{
      return <div  className="pictures flex -translate-y-[0.1vh] " > {images.images.map((img , index)=>{
        return  <div >
<div className={`imgcontainer w-[48.8vw] h-[35vw] ${index < 1 ? "border-r-0 border-t-0 border-l-0 w-[48.8vw]": "border-t-0 border-r-0 w-[50vw]"}  flex items-center justify-center  border-[#8D8D8D]   border-[1px]`}>  <img className='w-[15vw]' src={img.img} alt="" /></div>
        </div>
      })}</div>
        })
      }
     
     
    </div>

<div className="content flex">

  <div className='w-[70%]  h-[85vh] border-r-0 border-t-0 border-[#8D8D8D] border-l-0  border-[1px] px-[1.1vw] py-[1.5vw] '>


    {
      detailOfTheProduct.map((productDetails  , index)=>{ 
        return <div><h3 className='mb-10'>{productDetails.heading} </h3>
        {productDetails.details.map((detail , index )=>{

          return <div className='heading1 w-[30vw] mb-4'>
          <h3 className='mb-3 '>  {detail.title}</h3>
          {detail.points.map((point)=>{  
            return <div className='points ml-2'>

            <p> • {point.name}</p>
          {point.subPoints ?  point.subPoints.map((p)=>{
            return <div className='ml-2'><p> •  {p}</p></div>
          }): null}
             </div>
          })}
          
          </div>
        })}

<div>
  {productDetails.hastags.map((hastag)=>{
    return  <div>
      <h3>{hastag.title}</h3>
      <div className='hastags mt-4'>{hastag.hastags.map((tags)=>{
        return <a className='mr-1' href="">#{tags}</a>
      })}</div>
    </div>
  })}
</div>

        </div>
      

      

      })
    }




  </div>
  <div className='w-[30%]  h-[85vh]   border-r-0 border-t-0  border-[#8D8D8D] border-[1px]'>

{
  detailOfTheProduct.map((detail)=>{
    return <div className="mt-6 ml-4" >
      
       <div className="flex items-center gap-2">
       <h3 className=''>{detail.name}</h3>
       <div className='bg-[#d9d9d9] h-[1.4vw] rounded-[2px] flex items-center justify-center'><h4  className  = 'text-black font-[inter-medium] text-[1.2vw] tracking-tighter px-1  '>$ {detail.amount}</h4 ></div>
       </div>
       
       <div className = 'payment-section mt-10 px-2 py-4 rounded-[3px] bg-[#d9d9d9]'>
       <div className = ' flex justify-between h-[15vh] w-[28vw]  '> <div><h3 className='text-black font-[inter-medium] tracking-tighter'>50+ Happy Customer</h3></div>
       
       <div className='customer-profiles flex'>{detail.customerReviews.map((custmerDetails , index)=>{
        console.log(index)
      return  <div><img className ={ ` ${index > 0 ? `-translate-x-${2*index}`: null}  rounded-full w-[1.4vw] h-[1.4vw] `}src={custmerDetails.profilePic} alt={custmerDetails.name}/>
      
      </div>

       })}</div>

      
       </div>
       <button className='rounded-full w-full border-black border-[2px] flex justify-center items-center'><h3 className='text-black py-3'>add to cart</h3></button>
       <button className='rounded-[7px] w-full mt-2 bg-[#151515] border-black border-[2px] flex justify-center items-center'><h3 className=' py-3 '>Buy Now</h3></button>

       </div>

<div className="delivery-details w-full flex-col content-center h-[15vh] rounded-[10px] px-[1vw] py-[2vh] border-[1px] border-[#8d8d8d] mt-6">


  {
     detailOfTheProduct.map((detail)=>{
      return <div>

        <div className="flex  justify-between mb-2 "><p>Expected Delivery Date:</p>
<p>1/23/32</p></div>
<div className="flex  justify-between mb-2 "><p>cash on Delivery:</p>
<p>{detail.otherInfo.cashOnDelivery}</p></div>
<div className="flex  justify-between mb-2 "><p>Return on delivery:</p>
<p>{detail.otherInfo.returnOnDelivery}</p></div>
      </div>
     })
  }



</div>

       </div>
  })
}

  </div>
</div>


<div className="releted-productds">
<div className='w-full flex items-center py-3 px-3  border-x-0 border-[1px]  border-[#8d8d8d]'>
  <h1>More Designes</h1></div>
   

    <div className='flex border-[#8D8D8D] border-y-[1px] '>

    <div className="parent group w-1/4 h-[20vw] border-[#8D8D8D] border-r-[1px] flex place-content-center py-8 relative">
  <div className="flex justify-between w-[98%] absolute bottom-1">  
    <div className='flex items-center duration-300 group-hover:-translate-y-5'>
    <p className="text-white uppercase ">
      ABUNDANCE
    </p><div className='bg-[#d9d9d9] ml-1 opacity-0 group-hover:opacity-100 duration-300  h-[0.7vw] rounded-[2px] flex items-center justify-center'><h4  className  = 'text-black font-[inter-medium] text-[0.7vw] tracking-tighter px-1  '>$25</h4 ></div></div>
    <p>#001</p>
  </div>
  <div className="absolute group-hover:opacity-100 duration-300 opacity-0 flex bottom-1 left-1">
  <IoReturnDownForwardOutline  color='white' size={20}/>
    
    <p>#surrelism</p>
  <p>#minimal</p>
  <p>#top</p>
  <p></p></div>
  <img className="object-contain duration-300 group-hover:-translate-y-4" src={abundance} alt="" />
</div>

<div className="parent group w-1/4 h-[20vw] border-[#8D8D8D] border-r-[1px] flex place-content-center py-8 relative">
  <div className="flex justify-between w-[98%] absolute bottom-1">  
    <div className='flex items-center duration-300 group-hover:-translate-y-5'>
    <p className="text-white uppercase ">
      A FADED GLORY
    </p><div className='bg-[#d9d9d9] ml-1 opacity-0 group-hover:opacity-100 duration-300  h-[0.7vw] rounded-[2px] flex items-center justify-center'><h4  className  = 'text-black font-[inter-medium] text-[0.7vw] tracking-tighter px-1  '>$25</h4 ></div></div>
    <p>#001</p>
  </div>
  <div className="absolute group-hover:opacity-100 duration-300 opacity-0 flex bottom-1 left-1">
  <IoReturnDownForwardOutline  color='white' size={20}/>
    
    <p>#surrelism</p>
  <p>#minimal</p>
  <p>#top</p>
  <p></p></div>
  <img className="object-contain duration-300 group-hover:-translate-y-4" src={glory} alt="" />
</div>

<div className="parent group w-1/4 h-[20vw] border-[#8D8D8D] border-r-[1px] flex place-content-center py-8 relative">
  <div className="flex justify-between w-[98%] absolute bottom-1">  
    <div className='flex items-center duration-300 group-hover:-translate-y-5'>
    <p className="text-white uppercase ">
      wanted
    </p><div className='bg-[#d9d9d9] ml-1 opacity-0 group-hover:opacity-100 duration-300  h-[0.7vw] rounded-[2px] flex items-center justify-center'><h4  className  = 'text-black font-[inter-medium] text-[0.7vw] tracking-tighter px-1  '>$25</h4 ></div></div>
    <p>#001</p>
  </div>
  <div className="absolute group-hover:opacity-100 duration-300 opacity-0 flex bottom-1 left-1">
  <IoReturnDownForwardOutline  color='white' size={20}/>
    
    <p>#surrelism</p>
  <p>#minimal</p>
  <p>#top</p>
  <p></p></div>
  <img className="object-contain duration-300 group-hover:-translate-y-4" src={wanted} alt="" />
</div>

<div className="parent group w-1/4 h-[20vw] border-[#8D8D8D] border-r-[1px] flex place-content-center py-8 relative">
  <div className="flex justify-between w-[98%] absolute bottom-1">  
    <div className='flex items-center duration-300 group-hover:-translate-y-5'>
    <p className="text-white uppercase ">
      dreaming
    </p><div className='bg-[#d9d9d9] ml-1 opacity-0 group-hover:opacity-100 duration-300  h-[0.7vw] rounded-[2px] flex items-center justify-center'><h4  className  = 'text-black font-[inter-medium] text-[0.7vw] tracking-tighter px-1  '>$25</h4 ></div></div>
    <p>#001</p>
  </div>
  <div className="absolute group-hover:opacity-100 duration-300 opacity-0 flex bottom-1 left-1">
  <IoReturnDownForwardOutline  color='white' size={20}/>
    
    <p>#surrelism</p>
  <p>#minimal</p>
  <p>#top</p>
  <p></p></div>
  <img className="object-contain duration-300 group-hover:-translate-y-4" src={dreaming} alt="" />
</div>
    
    
    
    
    </div>




 </div>

    </div>
  )
}

export default product