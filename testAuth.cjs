#!/usr/bin/env node

// Test script to verify authentication works
const { Amplify } = require('aws-amplify');
const { signIn, signOut } = require('aws-amplify/auth');
const outputs = require('./amplify_outputs.json');

// Configure Amplify
console.log('🔧 Configuring Amplify...');
try {
  Amplify.configure(outputs);
  console.log('✅ Amplify configured successfully');
  console.log(`   User Pool ID: ${outputs.auth.user_pool_id}`);
  console.log(`   Client ID: ${outputs.auth.user_pool_client_id}`);
  console.log(`   Region: ${outputs.auth.aws_region}`);
} catch (error) {
  console.error('❌ Amplify configuration failed:', error);
  process.exit(1);
}

const testCredentials = [
  {
    email: 'jainsonal837@gmail.com',
    password: 'TempPass123!'
  },
  {
    email: 'r40738937@gmail.com', 
    password: 'TempPass123!'
  }
];

async function testSignIn(credentials) {
  try {
    console.log(`\n🔐 Testing sign in for: ${credentials.email}`);
    console.log(`   Using password: ${credentials.password.substring(0, 4)}****`);
    
    const result = await signIn({
      username: credentials.email,
      password: credentials.password
    });
    
    console.log(`✅ Sign in successful for ${credentials.email}`);
    console.log(`   Access Token present: ${!!result.isSignedIn}`);
    console.log(`   Next step: ${result.nextStep?.signInStep || 'DONE'}`);
    
    // Sign out to clean up
    await signOut();
    console.log(`🚪 Signed out ${credentials.email}`);
    
    return { success: true, error: null };
  } catch (error) {
    console.log(`❌ Sign in failed for ${credentials.email}:`);
    console.log(`   Error Name: ${error.name}`);
    console.log(`   Error Message: ${error.message}`);
    
    // Log additional error details
    if (error.$metadata) {
      console.log(`   HTTP Status: ${error.$metadata.httpStatusCode}`);
      console.log(`   Request ID: ${error.$metadata.requestId}`);
    }
    
    return { success: false, error: error };
  }
}

async function testAllCredentials() {
  console.log('🧪 Testing authentication for all users...\n');
  
  let successCount = 0;
  let errors = [];
  
  for (const creds of testCredentials) {
    const result = await testSignIn(creds);
    if (result.success) {
      successCount++;
    } else {
      errors.push({
        email: creds.email,
        error: result.error
      });
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${testCredentials.length} users can sign in successfully`);
  
  if (successCount === testCredentials.length) {
    console.log('🎉 All authentication tests passed!');
    console.log('\n✅ The authentication system is working correctly.');
    console.log('The issue might be in the frontend application.');
  } else {
    console.log('⚠️  Some authentication tests failed.');
    console.log('\n❌ Common issues to check:');
    
    errors.forEach(({ email, error }) => {
      console.log(`\n📧 ${email}:`);
      if (error.name === 'NotAuthorizedException') {
        console.log('   - Incorrect password');
        console.log('   - User might be disabled');
        console.log('   - Password might have been changed');
      } else if (error.name === 'UserNotFoundException') {
        console.log('   - User does not exist');
        console.log('   - Username format might be wrong');
      } else if (error.name === 'NetworkError') {
        console.log('   - Network connectivity issue');
        console.log('   - AWS region configuration problem');
      } else {
        console.log(`   - Unknown error: ${error.name}`);
      }
    });
  }
}

// Also test the Amplify configuration
async function testConfiguration() {
  console.log('\n🔍 Testing Amplify Configuration...');
  
  const config = Amplify.getConfig();
  console.log('Auth Config:', {
    userPoolId: config.Auth?.Cognito?.userPoolId,
    userPoolClientId: config.Auth?.Cognito?.userPoolClientId,
    region: config.Auth?.Cognito?.region
  });
  
  if (!config.Auth?.Cognito?.userPoolId) {
    console.log('❌ User Pool ID missing from configuration');
    return false;
  }
  
  if (!config.Auth?.Cognito?.userPoolClientId) {
    console.log('❌ User Pool Client ID missing from configuration');
    return false;
  }
  
  console.log('✅ Amplify configuration looks correct');
  return true;
}

async function main() {
  const configValid = await testConfiguration();
  
  if (configValid) {
    await testAllCredentials();
  } else {
    console.log('❌ Configuration issues detected. Fix these first.');
  }
}

main().catch(console.error);