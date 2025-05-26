import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const sesClient = new SESv2Client({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try {
    // Handle both direct mutation calls and model hooks
    const { tripId, userEmail, commentText } = event.arguments || event;

    const params = {
      FromEmailAddress: 'jainsonal837@gmail.com',
      Destination: {
        ToAddresses: ['jainsonal837@gmail.com'],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `New Comment on Trip ${tripId}`,
          },
          Body: {
            Text: {
              Data: `A new comment was added by ${userEmail}:\n\n${commentText}`,
            },
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 