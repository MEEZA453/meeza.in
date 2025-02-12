import axios from 'axios' 
const url = 'http://localhost:8080/' 
export const postDesign = (newPost)=> axios.post(`${url}post` , newPost)
export const getDesign = ()=> axios.get(`${url}allProducts` )