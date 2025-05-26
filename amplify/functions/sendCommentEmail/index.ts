import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// Comment out SES email sending function
/*
export const handler = async (event: any) => {
  try {
    const { tripId, userEmail, commentText } = event.arguments;
    
    const sesClient = new SESv2Client({ region: process.env.AWS_REGION });
    
    const params = {
      FromEmailAddress: process.env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [userEmail],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `New Comment on Trip ${tripId}`,
          },
          Body: {
            Text: {
              Data: `A new comment has been added to your trip:\n\n${commentText}`,
            },
          },
        },
      },
    };

    await sesClient.send(new SendEmailCommand(params));
    
    return 'Email sent successfully';
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
*/

// Placeholder handler that returns success
export const handler = async (event: any) => {
  return 'Email functionality disabled';
}; 