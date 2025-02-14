import React, { useEffect } from 'react'
import profile1 from '../../assets/images/customerprofilepics/profile1.webp'
import profile2 from '../../assets/images/customerprofilepics/profile2.jpg'
import profile3 from '../../assets/images/customerprofilepics/profile3.jpg' ;   
import { IoReturnDownForwardOutline } from "react-icons/io5";
import posterStarlight from "../../assets/images/posters/starlightpsot.jpg";
import starlight from "../../assets/images/posters/STARLIGHT.jpg";
import abundance from '../../assets/images/posters/abandance.jpg' ;
import dreaming from '../../assets/images/posters/dreaming.jpg' ; 
import Navber from '../../components/navber/highlightnavber.jsx'
import {useDispatch, useSelector} from 'react-redux'
import {getDesign} from '../../store/actions/design.js'
import { useNavigate } from 'react-router-dom';
function productall() {


  const BASE_URL = 'http://localhost:8080'

const navigate = useNavigate()
  const dispatch = useDispatch()
  useEffect(()=>{
    dispatch(getDesign())
  } , [dispatch])

  const designs = useSelector((state)=>state.design)
  console.log(designs)


  const goTotheProduct = (preDetails)=>{
    console.log(``)

    navigate(`/products${preDetails.name}` , {state : {data : preDetails}} )
  
  }

  const getImageUrl = (image) => {

    if(image){
    return `${BASE_URL}${image}`; // Otherwise, prepend BASE_URL
    }else{  
      return abundance
    }
   
  };

  return (
    <div className=''> 
    <div className="*:">
      
    <Navber/></div>
      <div className="grid grid-cols-4 gap-0"> {/* Parent container for the grid */}
  {designs.map((preDetails, index) => (
   
    <div onClick = {()=>{goTotheProduct(preDetails) }} className="group border-[#8D8D8D] border-r-[1px] border-b-[1px] relative flex flex-col items-center" key={preDetails.name}>
      {/* Product Image */}

      {/* <div className='w-[10vw] h-[10vh] bg-white border'>

      </div>  */}
    <img
        className="object-contain size-[85%] mt-5 duration-300 group-hover:-translate-y-4"
        src={getImageUrl(preDetails.image[0])} 
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