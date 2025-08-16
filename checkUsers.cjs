#!/usr/bin/env node

// Script to check user status in Cognito User Pool
const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const outputs = require('./amplify_outputs.json');

const client = new CognitoIdentityProviderClient({ region: outputs.auth.aws_region });

async function checkUserPool() {
  try {
    console.log('🔍 Checking Cognito User Pool...');
    console.log(`User Pool ID: ${outputs.auth.user_pool_id}`);
    console.log(`Region: ${outputs.auth.aws_region}\n`);

    // List all users in the pool
    const listUsersParams = {
      UserPoolId: outputs.auth.user_pool_id,
      Limit: 10
    };

    const listResult = await client.send(new ListUsersCommand(listUsersParams));
    console.log(`📊 Total users in pool: ${listResult.Users?.length || 0}`);

    if (listResult.Users && listResult.Users.length > 0) {
      console.log('\n👥 Users found:');
      
      for (const user of listResult.Users) {
        console.log(`\n📧 Username: ${user.Username}`);
        console.log(`   Status: ${user.UserStatus}`);
        console.log(`   Enabled: ${user.Enabled}`);
        console.log(`   Created: ${user.UserCreateDate}`);
        
        // Get detailed user info
        try {
          const getUserParams = {
            UserPoolId: outputs.auth.user_pool_id,
            Username: user.Username
          };
          
          const userDetails = await client.send(new AdminGetUserCommand(getUserParams));
          console.log(`   Email Verified: ${userDetails.UserAttributes?.find(attr => attr.Name === 'email_verified')?.Value || 'unknown'}`);
          console.log(`   Email: ${userDetails.UserAttributes?.find(attr => attr.Name === 'email')?.Value || 'unknown'}`);
          
        } catch (error) {
          console.log(`   ❌ Error getting user details: ${error.message}`);
        }
      }
    } else {
      console.log('❌ No users found in the User Pool!');
      console.log('💡 This explains the authentication error.');
    }

  } catch (error) {
    console.error('❌ Error checking User Pool:', error.message);
  }
}

async function testSpecificUsers() {
  const testEmails = ['jainsonal837@gmail.com', 'r40738937@gmail.com'];
  
  console.log('\n🧪 Testing specific users...');
  
  for (const email of testEmails) {
    try {
      const getUserParams = {
        UserPoolId: outputs.auth.user_pool_id,
        Username: email
      };
      
      const userDetails = await client.send(new AdminGetUserCommand(getUserParams));
      console.log(`✅ ${email}: EXISTS`);
      console.log(`   Status: ${userDetails.UserStatus}`);
      console.log(`   Enabled: ${userDetails.Enabled}`);
      
    } catch (error) {
      console.log(`❌ ${email}: ${error.name === 'UserNotFoundException' ? 'NOT FOUND' : error.message}`);
    }
  }
}

async function main() {
  await checkUserPool();
  await testSpecificUsers();
  
  console.log('\n📋 Summary:');
  console.log('If no users exist, that explains the authentication error.');
  console.log('Users may have been deleted when the backend was redeployed.');
}

main().catch(console.error);