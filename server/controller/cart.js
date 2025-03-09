import Cart from '../models/cart.js' 


 export const getCart = async (req, res) => {
    try {
        console.log('reached to the getCart')
      const cartItems = await Cart.find();
      res.status(200).json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
 export const postCart = async (req, res) => {
  console.log('reached to the postCart ')
    try {
      const { name, amount, quantity, desc, img } = req.body;
  
      if (!name || !amount || !quantity || !img) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }
  
      const newCartItem = new Cart({
        name,
        amount,
        quantity,
        desc,
        img,
      });
  
      await newCartItem.save();
      console.log(newCartItem)
      res.status(201).json(newCartItem);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

  export const updateCartItem = async (req, res) => {
    console.log('raached to the updateCartIterm')
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      console.log(quantity)
  
      // Ensure quantity is valid
      if (quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
  
      // Find and update the cart item
      const updatedCartItem = await Cart.findByIdAndUpdate(
        id,
        { quantity },
        { new: true }
      );
  
      if (!updatedCartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
  
      res.status(200).json(updatedCartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };

   export const deleteCart = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedItem = await Cart.findByIdAndDelete(id);
  
      if (!deletedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
  
      res.status(200).json({ message: "Item deleted", deletedItem });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  