import React, { useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store.js'
import Lenis from '@studio-freight/lenis';
import Highlight from './pages/highlight/highlight.jsx';
import Product from './pages/product/product.jsx';
import Signup from './pages/signup/signup.jsx';
import Login from './pages/login/login.jsx';
import ProductAll from './pages/productall/productall.jsx';
import Admin from './pages/admin/adminAddProduct.jsx';
import TestCode from './pages/testcode/testcode.jsx';

function App() {
  const lenisRef = useRef(null);

  // useEffect(() => {
  //   // Initialize Lenis
  //   const lenis = new Lenis({
  //     duration: 5, // Smoothness of scrolling
  //     smooth: true,
  //     lerp : 2
      
  //   });
  //   lenisRef.current = lenis;

  //   // Animation frame loop for Lenis
  //   const animate = (time) => {
  //     lenis.raf(time);
  //     requestAnimationFrame(animate);
  //   };
  //   requestAnimationFrame(animate);

  //   console.log('Lenis initialized');

  //   return () => {
  //     // Cleanup Lenis instance
  //     lenis.destroy();
  //   };
  // }, []);

  return (
    <Provider store={store}>
      <Router>
        {/* Lenis will manage scrolling for this container */}
        <div data-scroll-container>
          <Routes>
            <Route path="/" element={<Highlight />} />
            <Route path="/product" element={<Product />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<ProductAll />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/test-code" element={<TestCode />} />
          </Routes>
        </div>
      </Router>
    </Provider>
    
  );
}

export default App;


