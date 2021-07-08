#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SSGStack } from '../lib/ssg-stack';
import { PrelaunchStack } from '../lib/prelaunch-stack';
import { HZStack } from '../lib/zone-stack';

import * as _s from '../src/strings';

// start up a new app instance
const app = new cdk.App();

// get some variables from the context. This allows us to pass in different
// values from the command line as context values, this amending the stacks for 
// different clients/owners

const getOwner = (): string => {
  let owner = app.node.tryGetContext('ownerName');
  if (!owner) throw new Error('No owner name supplied');
  return owner;
}

const client = getOwner();
const clientId = app.node.tryGetContext('ownerClientId')
const brandProperty = app.node.tryGetContext('ownerBrandProperty')
const domainName = app.node.tryGetContext('domainName');
const isProduction = (): boolean => {
  return app.node.tryGetContext('prod') || false
}

const makeStackProperties = (stackName: string, description: string, production: boolean) => {

  let props = {
    stackName: stackName,
    env: {
      account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT,
      region: app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION
    },
    description: production ? `Production ${description}` : description,
    owner: client,
    ownerId: clientId,
    stackPrefix: stackName,
    fqdn: domainName,
    isProd: production
  }

  // console.log(props);
  return props;
}

const makeTags = (scope: any) => {
  // Add a tag to all constructs in the stack
  cdk.Tags.of(scope).add('ash:owner:name', client);
  cdk.Tags.of(scope).add('ash:owner:client:id', clientId);
  cdk.Tags.of(scope).add('ash:owner:client:brand', brandProperty);
}

const makeStackName = (str: string) => {
  return `${_s.camelCaseUpper(client)}${_s.camelCaseUpper(brandProperty)}` + (isProduction() ? `Prod` : '') + `${_s.camelCaseUpper(str)}Stack`
}

const makeStackDescription = (str: string) => {
  return `${str} Stack for client: ${client} brand: ${brandProperty} `
};

// const hz = new HZStack(app, makeStackName('HostedZone'), makeStackProperties(makeStackName('HostedZone'), makeStackDescription('HostedZone'), isProduction()))
// makeTags(hz)

const cs = new SSGStack(app, makeStackName('SSG'), makeStackProperties(makeStackName('SSG'), makeStackDescription('SSG'), isProduction()))
makeTags(cs)

const pl = new PrelaunchStack(app, makeStackName('Prelaunch'), makeStackProperties(makeStackName('Prelaunch'), makeStackDescription('Prelaunch'), isProduction()))
makeTags(pl)

app.synth();
