import * as mongoose from 'mongoose';
import 'dotenv/config';

export async function connectToMongoDB(){
    await mongoose.connect(process.env.MONGO_URI, { retryWrites: true });
    return mongoose;
}