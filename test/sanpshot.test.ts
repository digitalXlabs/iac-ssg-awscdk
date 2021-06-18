import { SynthUtils } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';

import * as SSGTemplate from '../lib/ssg-stack';

test('SSG creates stack non production', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new SSGTemplate.SSGStack(app, 'MyTestStack', {
    stackName: "examplestackname",
    env: {
      account: "testaccount1",
      region: "eu-west-1"
    },
     description: "test description",
     owner: "ExampleOwner",
     ownerId: "ExampleClientId",
     stackPrefix: "ExampleStack",
     fqdn: "example.com",
     isProd: false
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('SSG creates stack production', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new SSGTemplate.SSGStack(app, 'MyTestStack', {
    stackName: "prodexamplestackname",
    env: {
      account: "testaccount1",
      region: "eu-west-1"
    },
     description: "test prod description",
     owner: "ExampleOwner",
     ownerId: "ExampleClientId",
     stackPrefix: "ExampleStackProduction",
     fqdn: "example.com",
     isProd: true
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});