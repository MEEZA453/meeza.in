import * as api from '../../api'

export const postDesign = (post) => async (dispatch) => {
    try {
      console.log('Post data being sent:', post);  // Log the post data to check if it's formatted correctly
      const { data } = await api.postDesign(post); 
      dispatch({ type: 'POST_PRODUCT', payload: data });
    } catch (error) {
      console.log('Error in action:', error.message); // Log the error message
    }
  };

  export const getDesign = (page , limit)=> async(dispatch) =>{
    try {
      const { data } = await api.getDesign(page , limit);
      dispatch({type : 'FETCH_ALL_PRODUCTS' , payload : data})
    }catch (err){
      console.log('error in action : ', err.message)
    }
  }
  export const deleteDesign = (id) => async (dispatch) => {
  try {
    console.log(id)
    await api.deleteDesign(id); // Send DELETE request
    dispatch({ type: 'DELETE_PRODUCT', payload: id }); // Optionally update the Redux state
  } catch (err) {
    console.log('Error deleting product:', err.message);
  }
};

export const createOrder = (items) => async (dispatch) => {
  try {
    console.log('creating order...', items);
    const { data } = await api.createOrder(items);
    dispatch({ type: 'CREATE_ORDER', payload: data });
    return data.url;
  } catch (err) {
    console.log('create-order error', err);
    // Optionally dispatch an error action here
  }
};
