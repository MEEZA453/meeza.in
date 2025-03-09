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
import RazorPayCheckout from './pages/payment/razorPayCheckout.jsx'
import PaymentSuccess from './pages/payment/paymentSuccess.jsx'
import PaymentFail from './pages/payment/paymentSuccess.jsx'
import Highlight3 from './pages/highlight/highlight3.jsx' ;


function App() {
  const lenisRef = useRef(null);
  const pageVariants = {
    initial: { opacity : 0 ,  filter: "blur(10px)" },
    in: { opacity : 1 , filter: "blur(0px)"  },
    out: {  opacity : 0  , filter: "blur(200px)"}, 
  }
const pageTransition = { type: "tween", ease: "linear", duration: .8 }; 
  return (
    <Provider store={store}>
      <Router>
        {/* Lenis will manage scrolling for this container */}
        <div data-scroll-container>
          <Routes>
            <Route path="/" element={<Highlight3 />} />
            {/* <Route path="/highlight3" element={<Highlight3 />} /> */}

            
            <Route path="/:designname" element={<Product />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<ProductAll />} />
            <Route path="/admin" element={<Admin />} />
            {/* <Route path="/test-code" element={<TestCode />} /> */}
            <Route path="/payment" element={<RazorPayCheckout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-fail" element={<PaymentFail />} />


          </Routes>
        </div>
      </Router>
    </Provider>
    
  );
}

export default App;


