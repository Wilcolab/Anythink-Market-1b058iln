//TODO: seeds script should come here, so we'll be able to put some data in our local env
require("dotenv").config();
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("%c run:", "color:green", "client connected");
    const database = client.db("anythink-market");

    const users = database.collection("users");
    const items = database.collection("items");
    const comments = database.collection("comments");

    const userDocs = createUser({ number: 100, data: "test.user" });
    const userResult = await users.insertMany(userDocs);
    console.log(`Users inserted count: ${userResult.insertedCount}`);
    console.log(`User inserted ids: ${JSON.stringify(userResult.insertedIds)}`);
    let userList = [];
    for (let index = 0; index < userDocs.length; index++) {
      userList.push({ ...userDocs[index], _id: userResult.insertedIds[index] });
    }

    const itemDocs = createItemsFor({ userList, number: 1 });
    const itemResult = await items.insertMany(itemDocs);
    console.log(`Items inserted count: ${itemResult.insertedCount}`);
    console.log(`Item inserted ids: ${JSON.stringify(itemResult.insertedIds)}`);
    let itemList = [];
    for (let index = 0; index < itemDocs.length; index++) {
      itemList.push({ ...itemDocs[index], _id: itemResult.insertedIds[index] });
    }

    const commentDocs = createComments({
      userList,
      itemList,
      commentsPerUser: 1,
    });
    const commentResult = await comments.insertMany(commentDocs);
    console.log(`Comments inserted count: ${commentResult.insertedCount}`);
    console.log(
      `Comment inserted ids: ${JSON.stringify(commentResult.insertedIds)}`
    );
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

function createComments({ userList, itemList, commentsPerUser }) {
  const commentList = [];

  for (let userIndex = 0; userIndex < userList.length; userIndex++) {
    const user = userList[userIndex];

    const itemIndexListToCommentOn = getItemsIndexListToCommentOn({
      itemListSize: itemList.length,
      userIndex,
      commentsPerUser,
    });

    for (const index of itemIndexListToCommentOn) {
      commentList.push(
        createComment({
          body: "test comment",
          sellerId: user._id,
          itemId: itemList[index],
        })
      );
    }
  }

  return commentList;
}

function createComment({ body, sellerId, itemId }) {
  return {
    body: body ? body : "default test comment",
    seller: sellerId,
    item: itemId,
  };
}

function getItemsIndexListToCommentOn({
  itemListSize,
  userIndex,
  commentsPerUser,
}) {
  const itemsToCommentOn = [];

  let startAt = (commentsPerUser * userIndex) % itemListSize;
  let endAt = startAt + commentsPerUser;

  for (let index = startAt; index < endAt; index++) {
    itemsToCommentOn.push(index % itemListSize);
  }

  return itemsToCommentOn;
}

function createItemsFor({ userList, number }) {
  const itemList = [];

  for (const user of userList) {
    for (let index = 0; index < number; index++) {
      itemList.push(createItem({ user }));
    }
  }

  return itemList;
}

function createItem({ user }) {
  const item = {
    title: `Test Title ${user.username}`,

    slug: `Test-Title-${user.username}-${(
      (Math.random() * Math.pow(36, 6)) |
      0
    ).toString(36)}`,

    description: `test description ${user.username}`,
    // image: String,

    favoritesCount: 0,
    // comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    // tagList: [{ type: String }],

    seller: user._id,
  };

  return item;
}

function createUser({ number, data }) {
  const userList = [];

  for (let index = 0; index < number; index++) {
    const password = createPassword(data);

    const user = {
      username: `${data}.${index}`,
      email: `${data}.${index}@gmail.com`,
      role: "user",
      hash: password.hash,
      salt: password.salt,
    };

    userList.push(user);
  }

  return userList;
}

function createPassword(password) {
  let passwordObject = {};

  passwordObject.salt = crypto.randomBytes(16).toString("hex");
  passwordObject.hash = crypto
    .pbkdf2Sync(password, passwordObject.salt, 10000, 512, "sha512")
    .toString("hex");

  return passwordObject;
}