import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// SES implementation temporarily disabled
// const AWS = require('aws-sdk');
// const ses = new AWS.SES(); // AWS_REGION is automatically available in Lambda runtime

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { recipientEmail, subject, body } = JSON.parse(event.body || "{}");

    if (!recipientEmail || !subject || !body) {
      return {
        statusCode: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({
          message: "Missing recipientEmail, subject, or body.",
        }),
      };
    }

    // SES implementation temporarily disabled
    // const senderEmail = process.env.SENDER_EMAIL || "YOUR_VERIFIED_SES_EMAIL";
    // const params = {
    //   Source: senderEmail,
    //   Destination: {
    //     ToAddresses: [recipientEmail],
    //   },
    //   Message: {
    //     Subject: {
    //       Charset: "UTF-8",
    //       Data: subject,
    //     },
    //     Body: {
    //       Text: {
    //         Charset: "UTF-8",
    //         Data: body,
    //       },
    //     },
    //   },
    // };
    // await ses.sendEmail(params).promise();

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        message: "Email functionality temporarily disabled.",
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        message: "Operation failed.",
        error: (error as Error).message,
      }),
    };
  }
};