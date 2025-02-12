import Product from '../models/designs.js'

export const getDesign = async( req , res)=>{
  console.log('reached to the get design')
  const postedDesigns = await Product.find()
  res.json(postedDesigns)
    
    };
    

export const deleteDesign = async( req , res)=>{
    
}
export const postDesign = async( req , res)=>{
    console.log('reached to the postDesign')
    try {
        const {
          name,
          amount,   
          headline,
          image,
          sections,
          hastags,
          // relatedProducts,
          expectedDeliveryDate,
          cashOnDelivery,
          returnOnDelivery,
        } = req.body;
    
        // Create new product
        const product = new Product({
          name,
          amount,
          headline,
          image,
          sections,
          hastags,
          // relatedProducts,
          expectedDeliveryDate,
          cashOnDelivery,
          returnOnDelivery,
        });
    
        await product.save();
        console.log(product)
        console.log('product added successfully')
        res.status(201).json({ success: true, product });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
}