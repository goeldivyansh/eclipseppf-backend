require('dotenv').config();
const globals = require("../globals");
const { MongoClient, ListCollectionsCursor } = require('mongodb');

// Create a new MongoClient & Connect to MongoDB
const client = new MongoClient(process.env.DB_URL);
let database;

async function initDatabase() {
  try {
    await client.connect();
    console.log('globals: ',globals);
    console.log('globals.DATABASE_NAME: ',globals.DATABASE_NAME);
    database = client.db(globals.DATABASE_NAME);
    console.log('Connected to MongoDB');
  }
  catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
}
initDatabase();

async function createUserInDb(options) {
  try {
    let collection = database.collection(globals.DEALER_COLLECTION);
    let result = await collection.insertOne(options);
 
    console.log(`Result: ${JSON.stringify(result)}`);
  }
  catch (error) {
    console.error(`Error inserting document of username: ${options.username}. Error: ${error}`);
  }
};

async function findUserInDb(username) {
  try {
    let collection = database.collection(globals.DEALER_COLLECTION);
    let result = await collection.find({ username: username }).toArray();
    return result[0];
  }
  catch (error) {
    console.error(`Error finding document of username: ${username}. Error: ${error}`);
  }
};

async function updateUserInDb(options) {
  try {
    console.log('options: ', options)
    
    let updateDbOptions = {};
    if (options.name) { updateDbOptions.name = options.name; }
    if (options.address) { updateDbOptions.address = options.address; }
    if (options.mobile_no) { updateDbOptions.mobile_no = options.mobile_no; }
    if (options.email) { updateDbOptions.email = options.email; }
    if (options.password) { updateDbOptions.password = options.password; }
    if (options.active === true || options.active === 'true') { updateDbOptions.active = true }
    if (options.active === false || options.active === 'false') { updateDbOptions.active = false; }

    updateDbOptions.modified = Date.now();

    let collection = database.collection(globals.DEALER_COLLECTION);
    let result = await collection.updateOne({ username: options.username }, { $set: updateDbOptions });
    return result;
  }
  catch (error) {
    console.error('Error updating user info', error);
  }
};

async function createWrappedCarRecordInDb(options) {
  console.log("In function createWrappedCarRecordInDb");
  try {
    // Add JSON info in db
    let collection = database.collection(globals.PPF_WARRANTY_COLLECTION);
    let result = await collection.insertOne(options);
    console.log(`Result: ${JSON.stringify(result)}`);
  }
  catch (error) {
    console.error(`Error inserting document of rollno: ${options.roll_no}. Error: ${error}`);
  }
}

async function findCarInDb(options) {
  try {
    let collection = database.collection(globals.PPF_WARRANTY_COLLECTION);
    let getOptions = {};
    
    if (options.roll_no) {
      getOptions.roll_no = options.roll_no;
    }
    else if (options.car_no) {
      getOptions['car_details.car_no'] = options.car_no;
    }
    console.log("getOptions: ", getOptions);
    let result = await collection.find(getOptions).toArray();
    console.log("result: ", result);
    return result[0];
  }
  catch (error) {
    console.error(`Error finding document of roll no/car no: ${getOptions}. Error: ${error}`);
  }
};

async function getCarsOfSpecificPeriodFromDb(options) {
  try {
    let collection = database.collection(globals.PPF_WARRANTY_COLLECTION);
    let sortOptions = { sort: { application_date: -1 } };

    let query = {
      'application_date': { $gte: options.startdate, $lte: options.enddate }
    };

    if (options.dealer_username) {
      query.dealer_username = options.dealer_username;
    }

    console.log("query: ", query);
    console.log("sortOptions: ", sortOptions);
    let result = await collection.find(query, sortOptions).toArray();
    console.log("result: ", result);
    return result;
  }
  catch (error) {
    console.error(`Error finding Warranty of specific period. Error: ${error}`);
  }
};


module.exports = {
  createUserInDb: createUserInDb,
  createWrappedCarRecordInDb: createWrappedCarRecordInDb,
  findUserInDb: findUserInDb,
  updateUserInDb: updateUserInDb,
  findCarInDb: findCarInDb,
  getCarsOfSpecificPeriodFromDb: getCarsOfSpecificPeriodFromDb
};
