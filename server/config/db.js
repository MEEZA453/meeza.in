import mongoose from 'mongoose' 
import dotenv from 'dotenv'


dotenv.config();

const connectDB = async ()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL2)
        .then(()=>{console.log('DB Conncted🎈')})
    }catch (error) {
            console.log ('DB Error😴:', error)
    }
}

export default connectDB 