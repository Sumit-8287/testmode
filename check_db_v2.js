
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aonetarget";

async function run() {
    await mongoose.connect(MONGODB_URI, { dbName: 'aonetarget' });
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("ALL_COLLECTIONS_START");
    collections.forEach(c => console.log(c.name));
    console.log("ALL_COLLECTIONS_END");

    const id = "69a33b96692a7018f0f248f8";
    const oid = new mongoose.Types.ObjectId(id);

    for (const coll of collections) {
        const name = coll.name;
        const res1 = await db.collection(name).findOne({ _id: id });
        const res2 = await db.collection(name).findOne({ _id: oid });
        const res3 = await db.collection(name).findOne({ id: id });

        if (res1 || res2 || res3) {
            console.log(`FOUND_IN_${name}`);
            console.log(`Match _id(string): ${!!res1}`);
            console.log(`Match _id(ObjectId): ${!!res2}`);
            console.log(`Match id(string): ${!!res3}`);
        }
    }
    process.exit(0);
}
run();
