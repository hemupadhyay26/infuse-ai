// src/db/migrations.js
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

// Configure DynamoDB client
const dynamoDbClient = new DynamoDBClient({
  region: 'ap-south-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined
});

// Create tables function
async function createTables() {
  try {
    console.log('Creating DynamoDB tables...');

    // Create Users table
    try {
      const usersTableParams = {
        TableName: 'Users',
        AttributeDefinitions: [
          { AttributeName: 'username', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'username', KeyType: 'HASH' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      };

      await dynamoDbClient.send(new CreateTableCommand(usersTableParams));
      console.log('Users table created successfully');
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log('Users table already exists');
      } else {
        throw error;
      }
    }

    // Create UserFiles table
    try {
      const userFilesTableParams = {
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
      };

      await dynamoDbClient.send(new CreateTableCommand(userFilesTableParams));
      console.log('UserFiles table created successfully');
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log('UserFiles table already exists');
      } else {
        throw error;
      }
    }

    // Create ChatHistory table
    try {
      const chatHistoryTableParams = {
        TableName: 'ChatHistory',
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'messageId', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'messageId', KeyType: 'RANGE' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      };

      await dynamoDbClient.send(new CreateTableCommand(chatHistoryTableParams));
      console.log('ChatHistory table created successfully');
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log('ChatHistory table already exists');
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

createTables()
  .then(() => console.log('Migration completed'))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });


export { createTables };