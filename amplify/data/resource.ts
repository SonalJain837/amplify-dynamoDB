import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== SCHEMA DEFINITION ===============================================================
The section below defines three tables: Users, Trips, and Comments, according to the
specified requirements.
=========================================================================*/

const schema = a.schema({
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

  // Add your new table here
  YourNewTable: a
    .model({
      // Define your table attributes here
      id: a.string().required(),
      name: a.string().required(),
      description: a.string(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime(),
      // Add any other fields you need
    })
    .identifier(["id"])  // Primary key
    .secondaryIndexes(index => [
      // Add any secondary indexes if needed
      index("name")
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  // SES email notification mutation is disabled
  // sendCommentEmail: a.mutation()
  //   .arguments({
  //     tripId: a.string().required(),
  //     userEmail: a.string().required(),
  //     commentText: a.string().required()
  //   })
  //   .returns(a.string())
  //   .authorization(allow => [allow.public()])
  //   .handler(a.handler.function('sendCommentEmail'))
});

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
