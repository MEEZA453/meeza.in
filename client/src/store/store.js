// src/store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';

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
const store = configureStore({
  reducer: {
    products: productsSlice.reducer,
  },
});

export default store;
