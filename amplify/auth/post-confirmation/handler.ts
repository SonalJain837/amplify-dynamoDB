import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('Post confirmation trigger:', JSON.stringify(event, null, 2));
  
  try {
    // Your user creation logic here
    const userAttributes = event.request.userAttributes;
    
    // Example: Save user to DynamoDB
    const putCommand = new PutCommand({
      TableName: process.env.USER_TABLE_NAME,
      Item: {
        id: event.request.userAttributes.sub,
        email: event.request.userAttributes.email,
        createdAt: new Date().toISOString(),
        // Add other attributes as needed
      }
    });
    
    await docClient.send(putCommand);
    console.log('User created successfully');
    
    return event;
  } catch (error) {
    console.error('Error in post confirmation:', error);
    throw error;
  }
}; 