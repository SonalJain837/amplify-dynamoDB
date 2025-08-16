import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Hub } from 'aws-amplify/utils';
const appConfig = require('../../../../app.config.json');

const sesClient = new SESClient({ region: "us-east-1" });

export const handler = async (
  event: any
): Promise<APIGatewayProxyResult> => {
  try {
    // Support both AppSync (event.arguments) and API Gateway (event.body)
    let email, subject, message;
    if (event.arguments) {
      ({ email, subject, message } = event.arguments);
    } else if (event.body) {
      const body = JSON.parse(event.body);
      email = body.email;
      subject = body.subject;
      message = body.message;
    }

    if (!email || !subject || !message) {
      return {
        statusCode: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({
          message: "Missing required parameters: email, subject, or message",
        }),
      };
    }

    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Data: `
              <html>
                <body>
                  <h2>${subject}</h2>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <p style="margin: 0;">${message}</p>
                  </div>
                  <p>You can view all comments by logging into your account.</p>
                </body>
              </html>
            `
          },
          Text: {
            Data: `${subject}\n\n${message}\n\nYou can view all comments by logging into your account.`
          }
        },
        Subject: {
          Data: subject
        }
      },
      Source: process.env.SES_FROM_EMAIL || appConfig.defaultEmail  // Must be a verified SES identity
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