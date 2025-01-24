import React from 'react'
import { useState } from 'react'
import TagInput from '../../components/inputs/taginput.jsx'
import ImageInput from '../../components/inputs/imageInput.jsx'

function adminAddProduct() {

let [name , setName ] = useState('');
let [headline , setHeadline] = useState('');
let [amount , setAmount] = useState('');
let [selectedImage , setSelectedImage ] = useState([]);
let [sections , setSections] = useState(['Section-1' , 'Section-2'])

const [ content , setContent ] = useState({
  0 : ['content-1' , 'content-2'], 1 : []

})
let [cashOnDelivery  , setCashOnDelivery] = useState('')
let [returnOnDelivery , setReturnOnDelivery] = useState('')
let [expectedDeliveryDate , setExpectedDeliveryDate] = useState('')




const addSections = ()=>{
setSections([...sections, `Section-${sections.length+1}` ]);

    console.log('section added')
    console.log(sections)
}
const addContent = (sectionIndex)=>{
  console.log(sectionIndex)
    console.log('content added' , content)
setContent({
  ...content , 
    [sectionIndex] : [...(content[sectionIndex] || []), `content-${(content[sectionIndex]?.length || 0)+1}`]
  
})


}
const formSubmit = (event)=>{
    event.preventDefault()
}





  return (
    <div> 

<h1 className='mb-20'>Admin panel</h1>


<form onSubmit={formSubmit}>
<input type="text" name = 'name' value={name} onChange = {(e)=>{setName(e.target.value)}} placeholder='name ' className='bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]'  />


<ImageInput/>


<input type="number" name = '' value={amount} onChange = {(e)=>{setAmount(e.target.value)}} placeholder=' $ ' className='bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[4vw]'  />

<input type="text" name = '' value = {headline} onChange = {(e)=>{setHeadline(e.target.value)}} placeholder='headline ' className='bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]'  />


<div className= ' other-information mb-32'>

<h3>section Information : </h3>
 {sections.map((section , index)=>{
    return  <div key={index} className={`${section} w-full border border-[#424242] p-3`}>
    <input type="text" name = '' placeholder='title ' className='bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]'  />
    <input type="text" name = '' placeholder='content ' className='bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]'  />
    {content[index]?.map((cont , index)=>{
       return <input key = {index} type="text" placeholder={cont} className='bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]' />
    })}
    <button onClick={()=> addContent(index)} className='bg-white text-black font-[inter-regular] p-1 ml-2  rounded'>Add content</button>
    
    </div>
  
  
  
})}


<button onClick={addSections} className='bg-white text-black rounded p-1 font-[inter-regular]'>Add section </button>

</div>
<div className = ''> 
<h3>Releted Product</h3>
<TagInput/>
</div>


<div>
<h3 className='mb-12 mt-12'>other information :</h3>
<div className='flex mr-2 items-center' >
  <p>expected Delivery date : </p>
<input type="date" value = {expectedDeliveryDate} className='bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]' onChange = {(e)=>{setExpectedDeliveryDate(e.target.value) , console.log(expectedDeliveryDate  )}} />
</div>
<div className=' cashondelivery flex  gap-3 mt-10'>
  <h6>cash on delivery  : </h6>
  <label><input type="radio"  name='cash on delivery' placeholder='cash on delivery' value={'yes'} checked = { cashOnDelivery == 'yes'} onChange={(e)=>{
    setCashOnDelivery(e.target.value)
    console.log(cashOnDelivery)
  }}/>yes</label>
  <label><input type="radio"  name='cash on delivery' placeholder='cash on delivery' value={'no'} checked = { cashOnDelivery == 'no'} onChange={(e)=>{
    setCashOnDelivery(e.target.value)
    console.log(cashOnDelivery)
  }}/>no</label>
</div>
<div className=' returnondelivery flex  gap-3 mt-10'>
  <h6>return on delivery  : </h6>
  <label><input type="radio"  name='return on delivery' placeholder='return on delivery' value={'yes'} checked = { returnOnDelivery == 'yes'} onChange={(e)=>{
    setReturnOnDelivery(e.target.value)
  }}/>yes</label>
  <label><input type="radio"  name='return on delivery' placeholder='return on delivery' value={'no'} checked = { returnOnDelivery == 'no'} onChange={(e)=>{
    setReturnOnDelivery(e.target.value)
  }}/>no</label>
</div>

</div>

</form>


    </div>
  )
}

export default adminAddProduct