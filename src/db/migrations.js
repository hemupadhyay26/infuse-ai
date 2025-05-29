// src/db/migrations.js
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure DynamoDB client
const dynamoDb = new AWS.DynamoDB({
  region: 'ap-south-1',
  endpoint: 'http://localhost:8001'
});

// Create tables function
async function createTables() {
  try {
    console.log('Creating DynamoDB tables...');
    
    // Create Users table
    try {
      await dynamoDb.createTable({
        TableName: 'Users',
        AttributeDefinitions: [
          { AttributeName: 'username', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'username', KeyType: 'HASH' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }).promise();
      console.log('Users table created successfully');
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log('Users table already exists');
      } else {
        throw error;
      }
    }
    
    // Create UserFiles table
    try {
      await dynamoDb.createTable({
        TableName: 'UserFiles',
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'fileId', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'fileId', KeyType: 'RANGE' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }).promise();
      console.log('UserFiles table created successfully');
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log('UserFiles table already exists');
      } else {
        throw error;
      }
    }
    
    console.log('DynamoDB migration completed successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => console.log('Migration completed'))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export { createTables };