import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Hub } from 'aws-amplify/utils';

const sesClient = new SESv2Client({ region: "us-east-1" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the event body to get the arguments
    const body = JSON.parse(event.body || "{}");
    const { tripId, userEmail, commentText } = body;

    if (!tripId || !userEmail || !commentText) {
      return {
        statusCode: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({
          message: "Missing required parameters: tripId, userEmail, or commentText",
        }),
      };
    }

    const senderEmail = process.env.SENDER_EMAIL || "noreply@yourdomain.com";

    const params = {
      FromEmailAddress: senderEmail,
      Destination: {
        ToAddresses: [userEmail],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `New Comment on Trip ${tripId}`,
            Charset: "UTF-8"
          },
          Body: {
            Text: {
              Data: `A new comment has been added to your trip:\n\n${commentText}`,
              Charset: "UTF-8"
            }
          }
        }
      }
    };

    await sesClient.send(new SendEmailCommand(params));

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        message: "Email sent successfully",
      }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        message: "Failed to send email",
        error: (error as Error).message,
      }),
    };
  }
};

// function to24HourWithSeconds(time12h: string) { ... }