import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const URI = 'mongodb+srv://AONETARGET:SACHIN123@cluster0.yvihcjy.mongodb.net/aonetarget';

async function test() {
    try {
        await mongoose.connect(URI, { serverSelectionTimeoutMS: 10000 });
        console.log('--- CONNECTION_SUCCESS ---');
        await mongoose.disconnect();
    } catch (err) {
        console.log('--- CONNECTION_FAILED ---');
        console.log(err.message);
    }
}

test();
