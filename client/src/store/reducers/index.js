import {combineReducers} from 'redux' ; 
import design from './design.js'
import cart from './cart.js'

export const reducers = combineReducers({
    design : design , 
    cart : cart
})