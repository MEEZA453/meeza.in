import mongoose from 'mongoose'  
const cartSchema =  new mongoose.Schema(
    {
        name: { type: String, required: true },
  amount: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  desc: { type: String, default: "" },
  img: { type: String, required: true },
    }
)
const Cart = mongoose.model('cart' , cartSchema);

export default Cart;