require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function deleteDocuments({ collection, query }) {
  try {
    console.log(`delete documents from: ${collection.collectionName}`);

    const result = await collection.deleteMany(query);

    // Print the number of deleted documents
    console.log(
      "Deleted " + result.deletedCount + " " + collection.collectionName
    );
  } catch (error) {
    console.error(`delete documents method cath error: ${error}`);
  }
}

async function run() {
  try {
    await client.connect();
    console.log(`run method: client connected`);

    const database = client.db("anythink-market");
    const users = database.collection("users");
    const items = database.collection("items");
    const comments = database.collection("comments");

    users.collectionName;

    await deleteDocuments({
      collection: users,
      query: { username: { $regex: /^test/ } },
    });

    await deleteDocuments({
      collection: items,
      query: { title: { $regex: /^Test/ } },
    });

    await deleteDocuments({
      collection: comments,
      query: { body: { $regex: /^test/ } },
    });
  } catch (error) {
    console.error(`rum method cath error: ${error}`);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);