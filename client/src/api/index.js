import axios from 'axios' 
const url = 'https://meeza-in-8.onrender.com/' 
//  const url  = 'http://localhost:8080/'
export const postDesign = (newPost)=> axios.post(`${url}post` , newPost)
export const getDesign = (page = 1 , limit = 6)=> axios.get(`${url}allProducts` , page , limit )
export const createOrder = (items)=> axios.post(`${url}payment/create-order` , items)
export const getCart = ()=>axios.get('https://meeza-in-8.onrender.com/cart')
export const postCart = (newCart)=>axios.post('https://meeza-in-8.onrender.com/cart/postcart' , newCart)
export const deleteCart = (newCart)=>axios.post('https://meeza-in-8.onrender.com/cart/deletecart' , newCart)

export const updateCartItem = (updatedItem) => axios.put(`https://meeza-in-8.onrender.com/cart/update/${updatedItem._id}`, updatedItem);