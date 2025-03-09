export default ( state = [] , action)=>{
    switch(action.type){
        case 'FETCH_ALL_CART':
            return action.payload
        case 'POST':
            return [...state , action.payload]
            case 'UPDATE_CART_ITEM':
      return state.map((item) =>
        item._id === action.payload._id ? action.payload : item
      );
            default:
                return state;
    }
}