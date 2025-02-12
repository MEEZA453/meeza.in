import * as api from '../../api'

export const postDesign = (post) => async (dispatch) => {
    try {
      console.log('Post data being sent:', post);  // Log the post data to check if it's formatted correctly
      const { data } = await api.postDesign(post); 
      dispatch({ type: 'POST', payload: data });
    } catch (error) {
      console.log('Error in action:', error.message); // Log the error message
    }
  };

  export const getDesign = ()=> async(dispatch) =>{
    try {
      const { data } = await api.getDesign();
      dispatch({type : 'FETCH_ALL' , payload : data})
    }catch (err){
      console.log('error in action : ', err.message)
    }
  }