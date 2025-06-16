import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { defineFunction } from '@aws-amplify/backend';

const sendCommentEmail = defineFunction({
  entry: './data/function/sendCommentEmail/handler.ts'
});

defineBackend({
  auth,
  data,
  sendCommentEmail,
}).addAuthTrigger('postConfirmation', (event) => {
  const postConfirmationUserCreator = defineFunction({
    entry: './data/function/postConfirmationUserCreator/handler.ts',
    environment: {
      TABLE_USERS: event.resources.tables.Users.name,
    }
  });
  return postConfirmationUserCreator;
});
