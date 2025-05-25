import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
// import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Hub } from 'aws-amplify/utils';

// const sesClient = new SESv2Client({ region: "us-east-1" });

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

    // const senderEmail = "jainsonal837@gmail.com";

    // const params = {
    //   FromEmailAddress: senderEmail,
    //   Destination: {
    //     ToAddresses: [recipientEmail],
    //   },
    //   Content: {
    //     Simple: {
    //       Subject: {
    //         Data: subject,
    //         Charset: "UTF-8"
    //       },
    //       Body: {
    //         Text: {
    //           Data: body,
    //           Charset: "UTF-8"
    //         }
    //       }
    //     }
    //   }
    // };

    // await sesClient.send(new SendEmailCommand(params));

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
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        message: "Failed to send email.",
        error: (error as Error).message,
      }),
    };
  }
};

// function to24HourWithSeconds(time12h: string) { ... }