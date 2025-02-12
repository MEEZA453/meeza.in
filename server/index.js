import express from 'express'
import { env } from './config/dotenv.js';
import connectDB from './config/db.js';
import cors from 'cors'
import  designRoute from './routes/postDesign.js'
import highlightDesignRoute from './routes/postHighlightDesign.js'

// Define the server port
const PORT =   env.PORT||8080 ;
const app = express()
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use('/' , designRoute)
app.use('/highlight' , highlightDesignRoute)

connectDB()
// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
