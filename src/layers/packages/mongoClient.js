const mongoose = require('mongoose');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

mongoose.Promise = global.Promise;

let isConnected = false;
let db_connected = null;
let DB_URL = null;

const ssmClient = new SSMClient();

module.exports = async function connectToDatabase() {
  try {

    let dbName = process.env.MONGODB_DB_NAME || 'test';
    // ✅ If already connected to same DB
    if (isConnected && db_connected === dbName) {
      return Promise.resolve();
    }

    // ✅ Close existing connection if switching DB
    if (isConnected) {
      await mongoose.connection.close();
    }

    // ✅ Determine environment
    let environment;
    if (process.env.AWS_SAM_LOCAL || process.env.IS_OFFLINE) {
      environment = "LOCAL";
    }

    // ✅ Get DB URL
    if (environment === "LOCAL") {
      console.log("🔹 Using local .env Mongo URI");
      DB_URL = process.env.MONGODB_URI;
    } else if (!DB_URL) {
      const paramName = process.env.MONGODB_SSM_PARAM_NAME

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: paramName,
          WithDecryption: true,
        })
      );

      DB_URL = response.Parameter.Value;
    }

    // ✅ Connect to MongoDB
    await mongoose.connect(DB_URL, { dbName });
    isConnected = mongoose.connection.readyState;
    db_connected = dbName;

    console.log(`✅ Connected to MongoDB: ${dbName} (${environment})`);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
};