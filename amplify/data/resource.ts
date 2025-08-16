import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";

const sendCommentEmail = defineFunction({
  name: 'sendCommentEmail',
  entry: './function/sendCommentEmail/handler.ts'
});

/*== SCHEMA DEFINITION ===============================================================
The section below defines three tables: Users, Trips, and Comments, according to the
specified requirements.
=========================================================================*/

const schema = a
  .schema({
    Users: a
      .model({
        // Attributes
        username: a.string().required(), // Unique, validated (4–14 chars)
        firstName: a.string().required(), // Alphabet only, max 50 chars
        lastName: a.string().required(), // Alphabet only, max 50 chars
        email: a.string().required(), // Unique, validated format
        ageRange: a.string(), // Optional (e.g., 18-25)
        nationality: a.string(), // Optional (dropdown values)
        createdAt: a.datetime().required(), // Timestamp
        userId: a.string(), // Optional, for internal ID (UUID)
        // zipCode: a.string(),
        // profession: a.string(),
        // employerSize: a.string(),
      })
      .identifier(["email"])  // USER#<email>
      .authorization((allow) => [allow.publicApiKey()]),

    Trips: a
      .model({
        // Attributes
        tripId: a.string().required(), // Unique ID for each trip
        userEmail: a.string().required(), // For linking with Users table
        fromCity: a.string().required(), // 3-letter airport code, UPPERCASE
        toCity: a.string().required(), // Same as above
        layoverCity: a.string().array(), // Optional list of 3-letter codes
        flightDate: a.date(), // Changed to date type
        flightTime: a.time(), // expects "HH:mm:ss"
        confirmed: a.boolean().required(), // Y/N
        flightDetails: a.string(), // Max 250 characters
        languagePreferences: a.string().array(), // Optional array of preferred languages
        createdAt: a.datetime().required(), // For sorting/filtering
      })
      .identifier(["tripId"])  // TRIP#<trip_id>
      .secondaryIndexes(index => [
        index("flightDate") // Add a secondary index for DATE#<flight_date>
      ])
      .authorization((allow) => [allow.publicApiKey()]),

    Comments: a
      .model({
        // Attributes
        commentId: a.string().required(), // Unique comment identifier
        tripId: a.string().required(), // To link with trip
        userEmail: a.string().required(), // Who posted it
        commentText: a.string().required(), // Max 500 characters
        createdAt: a.datetime().required(), // Timestamp
        updatedAt: a.datetime(), // For edit tracking
        editable: a.boolean(), // True if current user can edit
        notifyEmail: a.boolean(), // True if comment notification sent
        created_by: a.string(),
        like: a.integer().default(0), // Number of likes
        dislike: a.integer().default(0), // Number of dislikes
        replies: a.string().array(), // Add a field to store replies
      })
      .identifier(["tripId", "commentId"])  // Composite key: TRIP#<trip_id>, COMMENT#<comment_id>
      .authorization((allow) => [allow.publicApiKey()]),

    // New Airports Model
    Airports: a
      .model({
        IATA: a.string().required(),
        ICAO: a.string(),
        airportName: a.string(),
        country: a.string(),
        city: a.string(),
        information: a.string(),
      })
      .identifier(["IATA"])
      .authorization((allow) => [allow.publicApiKey()]),

    // Messaging System Models
    Conversations: a
      .model({
        conversationId: a.string().required(),
        type: a.enum(['direct', 'group']),
        title: a.string(), // For group chats
        lastMessageAt: a.datetime(),
        createdAt: a.datetime().required(),
        updatedAt: a.datetime(),
      })
      .identifier(["conversationId"])
      .secondaryIndexes(index => [
        index("lastMessageAt")
      ])
      .authorization((allow) => [allow.publicApiKey()]),

    ConversationParticipants: a
      .model({
        conversationId: a.string().required(),
        userEmail: a.string().required(),
        joinedAt: a.datetime().required(),
        lastReadAt: a.datetime(),
        role: a.enum(['member', 'admin']),
        isActive: a.boolean().required(),
      })
      .identifier(["conversationId", "userEmail"])
      .secondaryIndexes(index => [
        index("userEmail").queryField("listUserConversations")
      ])
      .authorization((allow) => [allow.publicApiKey()]),

    Messages: a
      .model({
        messageId: a.string().required(),
        conversationId: a.string().required(),
        senderEmail: a.string().required(),
        receiverEmail: a.string().required(), // Add receiver email
        content: a.string(),
        messageType: a.enum(['text', 'system']), // Remove unused file types
        createdAt: a.datetime().required(),
        editedAt: a.datetime(),
        deletedAt: a.datetime(),
        replyToMessageId: a.string(), // For threading
      })
      .identifier(["conversationId", "messageId"])
      .secondaryIndexes(index => [
        index("createdAt"),
        index("senderEmail").queryField("listUserMessages"),
        index("receiverEmail").queryField("listReceivedMessages")
      ])
      .authorization((allow) => [allow.publicApiKey()]),


    // Enable SES email notification mutation
    sendCommentEmail: a.mutation()
      .arguments({
        email: a.string().required(),
        subject: a.string().required(), 
        message: a.string().required()
      })
      .returns(a.json())
      .handler(a.handler.function(sendCommentEmail))
  })
  .authorization((allow) => [allow.publicApiKey()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
  functions: {
    sendCommentEmail
  }
});

/*== FRONTEND INTEGRATION ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your tables. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>

function to24HourWithSeconds(time12h: string) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes}:00`;
}

to24HourWithSeconds("02:08 PM"); // "14:08:00"
