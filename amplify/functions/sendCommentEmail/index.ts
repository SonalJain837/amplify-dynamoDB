const AWS = require('aws-sdk');
const ses = new AWS.SES();

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

// Simple handler that returns success
export const handler = async (event: any) => {
  try {
    const { tripId, userEmail, commentText } = event.arguments;
    
    if (!userEmail || !commentText) {
      throw new Error('Missing required parameters: userEmail or commentText');
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

    await ses.sendEmail(params).promise();
    return 'Email sent successfully';
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 