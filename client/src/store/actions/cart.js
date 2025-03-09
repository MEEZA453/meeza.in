import * as api from '../../api'



export const postCart = (post) => async (dispatch) => {
    try {
      console.log('Post data being sent:', post);  // Log the post data to check if it's formatted correctly
      const { data } = await api.postCart(post); 
      dispatch({ type: 'POST', payload: data });
    } catch (error) {
      console.log('Error in action:', error); // Log the error message
    }
  };

  export const getCart = (page , limit)=> async(dispatch) =>{
    try {
      const { data } = await api.getCart();
      dispatch({type : 'FETCH_ALL_CART' , payload : data})
    }catch (err){
      console.log('error in action : ', err.message)
    }
  }
  export const updateCartItem = (updatedItem) => async (dispatch) => {
    try {
      const { data } = await api.updateCartItem(updatedItem); // API call to update item in DB
      dispatch({ type: 'UPDATE_CART_ITEM', payload: data });
    } catch (error) {
      console.error("Error updating cart item:", error);
    }
  };