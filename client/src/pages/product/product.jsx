import React from 'react'
import ShopNavber from '../../components/navber/shopnavber.jsx' ; 
import posterStarlight from "../../assets/images/posters/starlightpsot.jpg";
import starlight from "../../assets/images/posters/STARLIGHT.jpg";
import profile1 from '../../assets/images/customerprofilepics/profile1.webp'
import profile2 from '../../assets/images/customerprofilepics/profile2.jpg'
import profile3 from '../../assets/images/customerprofilepics/profile3.jpg' ; 
import abundance from '../../assets/images/posters/abandance.jpg' ;
import dreaming from '../../assets/images/posters/dreaming.jpg' ;
import { IoReturnDownForwardOutline, IoTimeSharp } from "react-icons/io5";

import glory from '../../assets/images/posters/glory.jpg' ;

import wanted from '../../assets/images/posters/wanted.jpg' ;
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {useState , useEffect} from 'react' 
import { useDispatch } from 'react-redux';
import { createOrder } from '../../store/actions/design.js';
import { postCart } from '../../store/actions/cart.js';
import cart from '../../store/reducers/cart.js';
import ProductAll from '../productall/productall.jsx';
import ImageCaro from '../../components/imageCaro/imageCaro.jsx'


function product(highlightsDeta) {


const {designname} = useParams()

  const location = useLocation();
const productDeta = [location.state?.data];
console.log(productDeta)


const [items, setItems] = useState(() => [{
  name: '',
  amount: 10,
  quantity: 1,
  image: '',
}]);


const [cartDetails , setCartDetails ] = useState({
  name : '' , 
  amount : 0 , 
  quantity : 1 ,
  desc : '25 inches',
  img : ''
})

console.log(cartDetails)

const dispatch  = useDispatch()
const handleBuyNow = (data) => {
  setItems((items) =>  // 'items' correctly represents the current state array
    items.map((el) => ({
      ...el,  
      name: data.name,
      quantity: 1,  
      amount: data.amount,  
      image: data.image[0],  
    }))
  );
};


useEffect (()=>{
window.scrollTo(0 , 0)
},[])
const handleSubmit = async (event)=>{
  event.preventDefault()
  const url = await dispatch(createOrder(items))
if(url){
  window.location.href = url
}
}

const handleCart = async (data) => {
  console.log(data.name, data.amount, data.image[0]);

  const updatedCartDetails = {
    name: data.name,
    amount: data.amount,
    img: data.image[0],
    quantity : 1 , 
    desc: data.headline,
  };

  setCartDetails(updatedCartDetails); // Update state

  dispatch(postCart(updatedCartDetails)); // Dispatch immediately with updated data
};




  return (
    <div className=' w-[100vw]'><ShopNavber cartData = {cartDetails}/>
{
  productDeta.map((deta)=>{
    return <div className='w-[100vw]'>
      
 
    
    <div className='images'>
       <div  className="pictures -translate-y-[0.1vh] " ><ImageCaro images = {deta.image}/></div>
     
     
    </div>
    {/* <h1 className='mb-3 mt-5 '>  {deta.headline}</h1> */}

<div className="content w-[100vw] flex lg:flex-row max-sm:flex-col-reverse">

<div className = "px-2">
  <div className='lg:w-[70%] w-[95%] lg:h-[85vh] border-r-0 border-t-0 border-[#8D8D8D] border-l-0  px-[1.1vw] py-[1.5vw] '>
{
  deta.sections.map((section)=>{
    return <div>
    
      {[section].map((contents)=>{
        return <div className='mb-2'> <h3 className='mb-2'>{contents.title} </h3>
        {
          contents.content.map((details)=>{
            return <div className=' mt-1'> <p className=''> • {details}</p></div>
          })
        }
        </div>
      })}
      
    </div>
  })
}

 <div>
      <h3>Releted Products</h3>
      <div className='hastags mt-2'>{deta.hastags.map((tags)=>{
        return <a className='mr-1' href="">#{tags}</a>
      })}</div>
    </div>

    {/* {
      detailOfTheProduct.map((productDetails  , index)=>{ 
        return <div>
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
 */}



  </div>
  {window.innerWidth < 640 ? <div className="delivery-details w-full flex-col items-center justify-between lg:h-[12vh] rounded-[10px] lg:px-[1vw] lg:py-[2vh] py-3 px-2 border-[1px] border-[#8d8d8d] mt-3 lg:mt-6">

<div className=''>

       <div className="flex  justify-between mb-2 "><p>Expected Delivery Date:</p>
<p>coming soon</p></div>
<div className="flex  justify-between mb-2 "><p>cash on Delivery:</p>
<p>{deta.cashOnDelivery ? "yes" : "no"}</p></div>
<div className="flex  justify-between mb-2 "><p>Return on delivery:</p>
<p>{deta.returnOnDelivery ? "yes" : "no"}</p></div>
     </div>
 


</div> : null}

  </div>
  <div className='lg:w-[29%] w-full  lg:h-[85vh]     lg:border-r-0 lg:border-t-0  border-[#8D8D8D] lg:border-[1px]'>

 <div className="lg:mt-6 lg:ml-4 mx-2 my-4" >
      
       <div className="flex items-center gap-2">
       <h3 className='capitalize'>{deta.name}</h3>
       <div className='bg-[#d9d9d9] h-[18px] lg:h-[1.4vw]  rounded-[2px] flex items-center justify-center'><h4  className  = 'text-black font-[inter-bold]  lg:text-[1.4vw] text-[3.9vw] tracking-tighter px-1  '>${deta.amount}</h4 ></div>
       </div>
       
       <div className = 'payment-section lg:mt-10 mt-5  px-1 lg:px-2 py-4 rounded-[3px] bg-[#d9d9d9]'>
       <div className = ' flex justify-between h-[10vh] lg:h-[15vh] lg:w-[28vw]  '> <div><h3 className='text-black font-[inter-medium] tracking-tighter'>50+ Happy Customer</h3></div>
       
       {/* <div className='customer-profiles flex'>{detail.customerReviews.map((custmerDetails , index)=>{
        console.log(index)
      return  <div><img className ={ ` ${index > 0 ? `-translate-x-${2*index}`: null}  rounded-full w-[1.4vw] h-[1.4vw] `}src={custmerDetails.profilePic} alt={custmerDetails.name}/>
      
      </div>

       })}</div> */}

       </div>
       <button onClick ={()=>{handleCart(deta)}} className='rounded-full w-full border-black border-[2px] flex justify-center items-center'><h3 className='text-black py-2'>add to cart</h3></button>
       <form onSubmit={handleSubmit}>
       <button onClick = { ()=>{handleBuyNow(deta)}} className='rounded-[7px] w-full mt-1 bg-[#151515] border-black border-[1px] flex justify-center items-center'><h3 className=' py-2 '>Buy Now</h3></button>
       </form>
       </div>

{window.innerWidth > 640 ? <div className="delivery-details w-full flex-col items-center justify-between lg:h-[12vh] rounded-[10px] lg:px-[1vw] lg:py-[2vh] py-3 px-2 border-[1px] border-[#8d8d8d] mt-3 lg:mt-6">

 <div>

        <div className="flex  justify-between mb-2 "><p>Expected Delivery Date:</p>
<p>23/02/2025</p></div>
<div className="flex  justify-between mb-2 "><p>cash on Delivery:</p>
<p>no</p></div>
<div className="flex  justify-between mb-2 "><p>Return on delivery:</p>
<p>no</p></div>
      </div>
  


</div> : null}

       </div>
  </div>
</div>


{/* <div className="releted-productds">
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




 </div> */}
 </div>
  })
}
<div className='mt-4'>
<h2 className='font-[inter-regular]  tracking-tight text-[6vw] border-t-[1px]  pl-3 py-1 border-[#8D8D8D]'>Releted Products </h2>
<div className='border-t-[1px]  border-[#8D8D8D]'>

<ProductAll/>
</div>
</div>
    </div>
    
  )
}




export default product