"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const sesClient = new client_sesv2_1.SESv2Client({ region: process.env.AWS_REGION });
const handler = async (event) => {
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
        const command = new client_sesv2_1.SendEmailCommand(params);
        await sesClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully' }),
        };
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
exports.handler = handler;
