const mongoose = require('mongoose');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { withRetry } = require('../utils/retry');

mongoose.Promise = global.Promise;

let isConnected = false;
let dbConnected = null;
let DB_URL = null;
let listenersAttached = false;

const ssmClient = new SSMClient();

/**
 * Connect to MongoDB. Uses SSM for URI in AWS; MONGODB_URI in local.
 * @param {string} [dbNameOverride] - Optional DB name override (default: MONGODB_DB_NAME env)
 * @returns {Promise<void>}
 */
async function connectToDatabase(dbNameOverride) {
  const dbName = dbNameOverride || process.env.MONGODB_DB_NAME || 'test';

  if (isConnected && dbConnected === dbName) {
    if (mongoose.connection.readyState !== 1) {
      isConnected = false;
      dbConnected = null;
    } else {
      return Promise.resolve();
    }
  }

  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    dbConnected = null;
  }

  let environment = 'AWS';
  if (process.env.AWS_SAM_LOCAL || process.env.IS_OFFLINE) {
    environment = 'LOCAL';
  }

  if (environment === 'LOCAL') {
    DB_URL = process.env.MONGODB_URI;
    if (!DB_URL) {
      throw new Error('MONGODB_URI is required when running locally');
    }
  } else if (!DB_URL) {
    const paramName = process.env.MONGODB_SSM_PARAM_NAME;
    if (!paramName) {
      throw new Error('MONGODB_SSM_PARAM_NAME is required');
    }
    const response = await withRetry(() =>
      ssmClient.send(
        new GetParameterCommand({
          Name: paramName,
          WithDecryption: true,
        })
      )
    );
    DB_URL = response.Parameter.Value;
  }

  await mongoose.connect(DB_URL, {
    dbName,
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
  });
  isConnected = mongoose.connection.readyState === 1;
  dbConnected = dbName;

  if (!listenersAttached) {
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      dbConnected = null;
    });
    mongoose.connection.on('error', () => {
      isConnected = false;
      dbConnected = null;
    });
    listenersAttached = true;
  }
}

function getMongoose() {
  return mongoose;
}

module.exports = {
  connectToDatabase,
  getMongoose,
};
