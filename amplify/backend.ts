import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { defineFunction } from '@aws-amplify/backend';

const sendCommentEmail = defineFunction({
  entry: './data/function/sendCommentEmail/handler.ts',
  environment: {
    SENDER_EMAIL: process.env.SENDER_EMAIL || 'YOUR_VERIFIED_SES_EMAIL'
  }
});

defineBackend({
  auth,
  data,
  sendCommentEmail
});
