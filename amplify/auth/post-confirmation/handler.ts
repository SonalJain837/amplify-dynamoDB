import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/post-confirmation";
import { v4 as uuidv4 } from 'uuid';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log("Post Confirmation Trigger received event:", JSON.stringify(event, null, 2));

  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    const { email, given_name, family_name } = event.request.userAttributes;
    const username = event.userName;
    
    // Accessing custom attributes from userAttributes as they are passed by Cognito
    const ageRange = event.request.userAttributes['custom:ageRange'];
    const nationality = event.request.userAttributes['custom:nationality'];
    const zipCode = event.request.userAttributes['custom:zipCode'];
    const profession = event.request.userAttributes['custom:profession'];
    const employerSize = event.request.userAttributes['custom:employerSize'];

    const userItem = {
      username: username,
      firstName: given_name,
      lastName: family_name,
      email: email,
      ageRange: ageRange || undefined,
      nationality: nationality || undefined,
      createdAt: new Date().toISOString(),
      userId: uuidv4(),
      zipCode: zipCode || undefined,
      profession: profession || undefined,
      employerSize: employerSize || undefined,
    };

    try {
      await client.models.Users.create(userItem);
      console.log("User successfully created in DynamoDB:", userItem);
    } catch (error) {
      console.error("Error creating user in DynamoDB:", error);
      throw new Error("Failed to create user in DynamoDB.");
    }
  }

  return event; // Important: Always return the event object from a Lambda trigger
}; 