import mongoose from "mongoose";
import {config} from "./config"

const dns = require("dns")
dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
])

const connectDB = async() => {
    try{
        await mongoose.connect(config.databaseUrl as string);
        console.log("Connected to database")
    }catch(error){
        console.log("Failed to connect to database",error);
        process.exit(1);
    }
}


export default connectDB