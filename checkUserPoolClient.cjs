#!/usr/bin/env node

// Script to check User Pool Client configuration
const { CognitoIdentityProviderClient, DescribeUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
const outputs = require('./amplify_outputs.json');

const client = new CognitoIdentityProviderClient({ region: outputs.auth.aws_region });

async function checkUserPoolClient() {
  try {
    console.log('🔍 Checking User Pool Client Configuration...');
    console.log(`User Pool ID: ${outputs.auth.user_pool_id}`);
    console.log(`Client ID: ${outputs.auth.user_pool_client_id}`);
    console.log(`Region: ${outputs.auth.aws_region}\n`);

    const params = {
      UserPoolId: outputs.auth.user_pool_id,
      ClientId: outputs.auth.user_pool_client_id
    };

    const result = await client.send(new DescribeUserPoolClientCommand(params));
    const clientConfig = result.UserPoolClient;

    console.log('📋 User Pool Client Configuration:');
    console.log(`   Client Name: ${clientConfig.ClientName}`);
    console.log(`   Client ID: ${clientConfig.ClientId}`);
    console.log(`   Generate Secret: ${clientConfig.GenerateSecret}`);
    console.log(`   Refresh Token Validity: ${clientConfig.RefreshTokenValidity} days`);
    console.log(`   Access Token Validity: ${clientConfig.AccessTokenValidity} minutes`);
    console.log(`   ID Token Validity: ${clientConfig.IdTokenValidity} minutes`);
    
    console.log('\n🔐 Authentication Flows:');
    clientConfig.ExplicitAuthFlows?.forEach(flow => {
      console.log(`   ✅ ${flow}`);
    });
    
    console.log('\n📧 Supported Identity Providers:');
    clientConfig.SupportedIdentityProviders?.forEach(provider => {
      console.log(`   ✅ ${provider}`);
    });

    // Check if required flows are enabled
    const requiredFlows = ['ADMIN_NO_SRP_AUTH', 'ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'];
    const enabledFlows = clientConfig.ExplicitAuthFlows || [];
    
    console.log('\n🔍 Flow Requirements Check:');
    requiredFlows.forEach(flow => {
      const isEnabled = enabledFlows.includes(flow);
      console.log(`   ${isEnabled ? '✅' : '❌'} ${flow}: ${isEnabled ? 'ENABLED' : 'MISSING'}`);
    });
    
    const hasRequiredFlows = requiredFlows.some(flow => enabledFlows.includes(flow));
    
    if (!hasRequiredFlows) {
      console.log('\n❌ ISSUE FOUND: Missing required authentication flows!');
      console.log('This could be causing the authentication failures.');
      console.log('\n💡 Required flows for Amplify authentication:');
      console.log('   - ALLOW_USER_SRP_AUTH (for SRP authentication)');
      console.log('   - ALLOW_REFRESH_TOKEN_AUTH (for token refresh)');
    } else {
      console.log('\n✅ Authentication flows look correct.');
    }

    // Check if client secret is set (should be false for frontend apps)
    if (clientConfig.GenerateSecret) {
      console.log('\n⚠️  WARNING: Client has secret enabled.');
      console.log('Frontend applications should not use client secrets.');
      console.log('This could cause authentication issues.');
    }

  } catch (error) {
    console.error('❌ Error checking User Pool Client:', error.message);
  }
}

checkUserPoolClient();