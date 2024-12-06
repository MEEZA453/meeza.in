import React from 'react'
import Navber from '../../components/navber/highlightnavber.jsx' ; 
import posterStarlight from "../../assets/images/posters/starlightpsot.jpg";
import starlight from "../../assets/images/posters/STARLIGHT.jpg";
import profile1 from '../../assets/images/customerprofilepics/profile1.webp'
import profile2 from '../../assets/images/customerprofilepics/profile2.jpg'
import profile3 from '../../assets/images/customerprofilepics/profile3.jpg'


function product(highlightsDeta) {



  const detailOfTheProduct =  [  
{name : 'ABUNDANCE'  , 
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
  hastags : [{
    title : 'Releted Products' , 
    hastags : ['black' , 'night' , 'space']
  }]
} , 



//     {
//       heading1 : {
//         title : 'Highlight' , 
//         details1 : '' , 
//         details2 : '' , 

//       },

//       heading2 : {
//         title : 'Details' , 
//         details1 : ' Dimensions: 18 * 24 inches' , 
//         details2 : {main : '* Material: Premium matte-finish paper for a modern, glare-free look.' ,}
        
//       }
// ,
//       heading3 : {
//         title : 'Why This Poster ?' , 
//         details1 : '' , 
//         details2 : '' , 
        
//       },

//       heading4 : {
//         title : 'Perfect For :' , 
//         details1 : '' , 
//         details2 : '' , 
        
//       },
//       heading5 : {
//         title : 'Shipping and Delivery' , 
//         details1 : '' , 
//         details2 : '' , 
        
//       },
//       heading6 : {
//         title : 'Releted products' , 
//        hastags : ['future' , 'minimal' , 'dark']
        
//       },
//     }

  ]

  return (
    <div className=''><Navber/>
    <div className="pictures flex -translate-y-[0.1vh] ">
      <div className="imgcontainer w-[48.8vw] h-[35vw]  flex items-center justify-center border-r-0 border-t-0 border-[#8D8D8D] border-l-0  border-[1px]">  <img className='w-[15vw]' src={starlight} alt="" /></div>
      <div className="imgcontainer w-[50vw] h-[35vw] flex items-center justify-center border-r-0 border-t-0  border-[#8D8D8D] border-[1px]">  <img  className='size-[15vw]'src={posterStarlight} alt="" /></div>

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
       <div className = ' flex justify-between h-[20vh] w-[28vw]  '> <div><h3 className='text-black font-[inter-medium] tracking-tighter'>50+ Happy Customer</h3></div>
       
       <div className='customer-profiles flex'>{detail.customerReviews.map((custmerDetails)=>{
      return  <div><img className = 'rounded-full w-[1.4vw] h-[1.4vw]' src={custmerDetails.profilePic} alt={custmerDetails.name}/>
      
      </div>

       })}<h3 className='text-black'>+</h3></div>

      
       </div>
       <button className='rounded-full w-full border-black border-[2px] flex justify-center items-center'><h3 className='text-black py-3'>add to cart</h3></button>
       <button className='rounded-full w-full mt-2 bg-[#151515] border-black border-[2px] flex justify-center items-center'><h3 className='text-black py-3'>add to cart</h3></button>

       </div>
       </div>
  })
}

  </div>
</div>

    </div>
  )
}

export default product