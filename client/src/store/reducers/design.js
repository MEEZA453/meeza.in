export default ( state = [] , action)=>{
    switch(action.type){
        case 'FETCH_ALL':
            return action.payload
        case 'POST':
            return [...state , action.payload]
    
            default:
                return state;
    }
}