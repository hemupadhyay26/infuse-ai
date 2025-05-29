import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8001", // your local DynamoDB endpoint
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fakecanbehere",
    secretAccessKey: process.env.AWS_SECRET_KEY_ID || "fakethisalsoforlocal",
  },
  // nedd to change cred for production
});

const dynamoDB = DynamoDBDocumentClient.from(client);

export async function testConnection() {
  try {
    const data = await dynamoDB.send(new ListTablesCommand({}));
    console.log('Connected to DynamoDB, tables:', data.TableNames);
  } catch (err) {
    console.error('DynamoDB connection error:', err);
  }
}

export default dynamoDB;
