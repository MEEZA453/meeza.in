import React from 'react'
import ShopNavber  from '../../components/navber/shopnavber.jsx' ;
import ProductAll from './productall.jsx'
function products() {
  return (
    <div>
        <div className=' sticky top-0 z-[999]'>
        <ShopNavber/>

        </div>
        <ProductAll/>
    </div>
  )
}

export default products