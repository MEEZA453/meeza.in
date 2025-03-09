import axios from 'axios' 
const url = 'http://localhost:8080/' 
export const postDesign = (newPost)=> axios.post(`${url}post` , newPost)
export const getDesign = (page = 1 , limit = 6)=> axios.get(`${url}allProducts` , page , limit )
export const createOrder = (items)=> axios.post(`${url}payment/create-order` , items)
export const getCart = ()=>axios.get('http://localhost:8080/cart')
export const postCart = (newCart)=>axios.post('http://localhost:8080/cart/postcart' , newCart)
export const deleteCart = (newCart)=>axios.post('http://localhost:8080/cart/deletecart' , newCart)

export const updateCartItem = (updatedItem) => axios.put(`http://localhost:8080/cart/update/${updatedItem._id}`, updatedItem);