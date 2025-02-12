// src/store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { createStore, applyMiddleware } from "redux";
import {thunk} from "redux-thunk";
import {reducers} from '../store/reducers/index.js'

// Create a slice for products
const productsSlice = createSlice({
  name: 'products',
  initialState: [],
  reducers: {
    setProducts: (state, action) => action.payload, // Updates the product list
  },
});

// Export the action
export const { setProducts } = productsSlice.actions;

// Create the store
const store = createStore(reducers, applyMiddleware(thunk));


export default store;
