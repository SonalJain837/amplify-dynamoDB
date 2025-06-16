import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { defineFunction } from '@aws-amplify/backend';
import { postConfirmation } from './auth/post-confirmation/resource';

const sendCommentEmail = defineFunction({
  entry: './data/function/sendCommentEmail/handler.ts'
});

defineBackend({
  auth,
  data,
  sendCommentEmail,
});
