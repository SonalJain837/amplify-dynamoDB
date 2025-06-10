import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Hub } from 'aws-amplify/utils';

const sesClient = new SESClient({ region: "us-east-1" });

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

    const params = {
      Destination: {
        ToAddresses: [userEmail]
      },
      Message: {
        Body: {
          Html: {
            Data: `
              <html>
                <body>
                  <h2>New Comment on Your Trip</h2>
                  <p>A new comment has been added to your trip (ID: ${tripId}):</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <p style="margin: 0;">${commentText}</p>
                  </div>
                  <p>You can view all comments by logging into your account.</p>
                </body>
              </html>
            `
          },
          Text: {
            Data: `A new comment has been added to your trip (ID: ${tripId}):\n\n${commentText}\n\nYou can view all comments by logging into your account.`
          }
        },
        Subject: {
          Data: `New Comment on Trip ${tripId}`
        }
      },
      Source: process.env.SES_FROM_EMAIL || 'no-reply@map-vpat.email.ihapps.ai'  // Must be a verified SES identity
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