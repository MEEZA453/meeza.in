import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux'; // Import Provider
import store from './store/store.js'; // Import the Redux store
import Highlight from './pages/highlight/highlight.jsx';
import Product from './pages/product/product.jsx';
import Signup from './pages/signup/signup.jsx';
import Login from './pages/login/login.jsx';
import ProductAll from './pages/productall/productall.jsx';
import Admin from './pages/admin/adminAddProduct.jsx'
import TestCode from './pages/testcode/testcode.jsx'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div data-scroll-container>
          <Routes>
            <Route path="/" element={<Highlight />} />
            <Route path="/product" element={<Product />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<ProductAll />} />
            <Route path="/admin" element={<Admin/>} />
            <Route path= "/test-code" element= {<TestCode/>}/>

          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;

