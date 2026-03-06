import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const URI = 'mongodb+srv://AONETARGET:SACHIN123@cluster0.yvihcjy.mongodb.net/aonetarget';

async function test() {
    try {
        console.log('Attempting to connect with Google DNS...');
        await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected successfully!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

test();
