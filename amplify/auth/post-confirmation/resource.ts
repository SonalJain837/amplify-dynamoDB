import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
  name: 'postConfirmationUserCreator',
  entry: './handler.ts',
}); 