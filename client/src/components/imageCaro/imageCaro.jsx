import React from 'react'

function imageCaro({images}) {
    console.log(images)
  return (
    <div>
        <div>

        </div>
        <div className='flex w-screen h-[90vw] border-b-[1px] border-[#8d8d8d] justify-center items-center'>

        <img  className  = "w-[50%]"src={images[0]} alt="" />
        </div>
      { images.length > 1 ?   <div className='flex w-screen h-[76vw]  '>
        <div className='flex w-screen border-b-[1px]  border-[#8d8d8d] justify-center items-center'>

<img  className  = "w-[70%]"src={images[1]} alt="" />
</div>

{<div className='flex w-screen  border-b-[1px] border-l border-[#8d8d8d] justify-center items-center'>

<img  className  = "w-[70%]"src={ images.length > 2 ? images[2]  : images[0]} alt="" />
</div>}
        </div> : null}
    </div>
  )
}

export default imageCaro