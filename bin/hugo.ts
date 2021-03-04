#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { HugoStack } from '../lib/hugo-stack';
import * as _s from '../src/strings';


// start up a new app instance
const app = new cdk.App();

// get some variables from the context. This allows us to pass in different
// values from the command line as context values, this amending the stacks for 
// different clients/owners

const client = app.node.tryGetContext('ownerName')
const clientId = app.node.tryGetContext('ownerClientId')
const domainName = app.node.tryGetContext('domainName'); // 
const stackName = `${_s.camelCaseUpper(client)}HugoStack`
const description = `SSG Stack for ${client}`

// new stack now, the regions if not set as environment variables will 
const cs = new HugoStack(app, 'HugoStack', {
  stackName: stackName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
   description: description,
   owner: client,
   ownerId: clientId,
   stackPrefix: stackName,
   fqdn: domainName,
   isProd: app.node.tryGetContext('prod') || false
});

// Add a tag to all constructs in the stack
cdk.Tags.of(cs).add('ash:owner:name', client);
cdk.Tags.of(cs).add('ash:owner:client:id', clientId);

app.synth();