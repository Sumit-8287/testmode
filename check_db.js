
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aonetarget";

async function checkCollections() {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: 'aonetarget' });
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        for (const coll of collections) {
            const count = await mongoose.connection.db.collection(coll.name).countDocuments();
            console.log(`- ${coll.name}: ${count} docs`);
        }

        const testId = "69a33b96692a7018f0f248f8";
        console.log(`Searching for ${testId}...`);

        for (const coll of collections) {
            const doc = await mongoose.connection.db.collection(coll.name).findOne({
                $or: [
                    { id: testId },
                    { _id: testId },
                    { _id: mongoose.Types.ObjectId.isValid(testId) ? new mongoose.Types.ObjectId(testId) : null }
                ].filter(f => f._id !== null)
            });
            if (doc) {
                console.log(`FOUND in [${coll.name}]!`);
                console.log(JSON.stringify(doc, null, 2).substring(0, 500));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCollections();
