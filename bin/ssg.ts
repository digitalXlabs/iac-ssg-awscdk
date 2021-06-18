#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SSGStack } from '../lib/ssg-stack';
import * as _s from '../src/strings';


// start up a new app instance
const app = new cdk.App();

// get some variables from the context. This allows us to pass in different
// values from the command line as context values, this amending the stacks for 
// different clients/owners

const client = app.node.tryGetContext('ownerName')
const clientId = app.node.tryGetContext('ownerClientId')
const domainName = app.node.tryGetContext('domainName'); // 
const isProduction = (): boolean => {
  return app.node.tryGetContext('prod') || false
}

console.log('am I prod', isProduction())

// const stackName = `${_s.camelCaseUpper(client)}SSGStack`
const stackName = `${_s.camelCaseUpper(client)}` + (isProduction() ? `Production` : '') + `SSGStack`
const description = `SSG Stack for ${client}`


// new stack now, the regions if not set as environment variables will 
const cs = new SSGStack(app, stackName, {
  stackName: stackName,
  env: {
    account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT,
    region: app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION
  },
  description: isProduction() ? `Production ${description}` : description,
  owner: client,
  ownerId: clientId,
  stackPrefix: stackName,
  fqdn: domainName,
  isProd: isProduction()
});

// Add a tag to all constructs in the stack
cdk.Tags.of(cs).add('ash:owner:name', client);
cdk.Tags.of(cs).add('ash:owner:client:id', clientId);

app.synth();
