import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

const sesClient = new SESClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { recipientEmail, subject, body } = JSON.parse(event.body || "{}");

    if (!recipientEmail || !subject || !body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Missing recipientEmail, subject, or body.",
        }),
      };
    }

    // Replace with your verified SES sender email address
    const senderEmail = "YOUR_VERIFIED_SES_EMAIL";

    const sendEmailCommand = new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: body,
          },
        },
      },
    });

    await sesClient.send(sendEmailCommand);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Email sent successfully!",
      }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Failed to send email.",
        error: (error as Error).message,
      }),
    };
  }
}; 