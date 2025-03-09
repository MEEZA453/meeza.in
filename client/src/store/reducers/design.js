export default ( state = [] , action)=>{
    switch(action.type){
        case 'FETCH_ALL_PRODUCTS':
            return [...state , ...action.payload]
        case 'POST_PRODUCT':
            return [...state , action.payload]
        case 'CREATE-ORDER':
            return [...state , ...action.payload]
            default:
                return state;
    }
}