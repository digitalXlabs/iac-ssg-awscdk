#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as _s from '../src/strings';
import { HZStack } from '../lib/zone-stack';

// start up a new app instance
const app = new cdk.App();

const client = app.node.tryGetContext('ownerName');
const clientId = app.node.tryGetContext('ownerClientId')
const brandProperty = app.node.tryGetContext('ownerBrandProperty')
const domainName = app.node.tryGetContext('domainName');
const production = app.node.tryGetContext('prod');

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
    isProd: production ? production : false
  }

  console.log(props);
  return props;
}

const makeTags = (scope: any) => {
  // Add a tag to all constructs in the stack
  cdk.Tags.of(scope).add('ash:owner:name', client);
  cdk.Tags.of(scope).add('ash:owner:client:id', clientId);
  cdk.Tags.of(scope).add('ash:owner:client:brand', brandProperty);
}

const makeStackName = (str: string, production?: boolean) => {
  return `${_s.camelCaseUpper(client)}${_s.camelCaseUpper(brandProperty)}` + (production ? `Production` : '') + `${_s.camelCaseUpper(str)}Stack`
}

const makeStackDescription = (str: string, production?: boolean) => {
  return `${str} Stack for client: ${client} brand: ${brandProperty} `
};

const hz = new HZStack(app, makeStackName('HostedZone'), makeStackProperties(makeStackName('HostedZone'), makeStackDescription('HostedZone'), production))
makeTags(hz)

app.synth();
