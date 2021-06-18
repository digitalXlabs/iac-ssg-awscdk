import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import * as SSGTemplate from '../lib/ssg-stack';

test('Resources non production test', () => {
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


  expect(stack).toHaveResource('AWS::S3::Bucket', {
    "BucketName": "examplestacks3bucket",
    "VersioningConfiguration": {
      "Status": "Enabled"
    }
  });
  expect(stack).toHaveResource('AWS::S3::BucketPolicy');
  expect(stack).toHaveResource('Custom::S3AutoDeleteObjects');
  expect(stack).toHaveResource('AWS::IAM::Role');
  expect(stack).toHaveResource('AWS::Lambda::Function');
  expect(stack).toHaveResource('AWS::IAM::Policy');
  expect(stack).toHaveResource('AWS::CloudFormation::CustomResource');
  expect(stack).toHaveResource('Custom::CrossRegionStringParameterReader');
  expect(stack).toHaveResource('AWS::CloudFront::CloudFrontOriginAccessIdentity');
  expect(stack).toHaveResource('AWS::CloudFront::Distribution');
  expect(stack).toHaveResource('AWS::Route53::RecordSet', {
    "Name": "stage.example.com.",
    "Type": "A"
  });

  expect(stack).toHaveOutput({ "outputName": "bucket" });
  expect(stack).toHaveOutput({ "outputName": "distro" });
  expect(stack).toHaveOutput({ "outputName": "certificate" });
  expect(stack).toHaveOutput({ "outputName": "function" });
  expect(stack).toHaveOutput({ "outputName": "functionversion" });



});


test('Resources production test', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new SSGTemplate.SSGStack(app, 'MyTestStack', {
    stackName: "examplestacknameproduction",
    env: {
      account: "testaccount1",
      region: "eu-west-1"
    },
    description: "test description",
    owner: "ExampleOwner",
    ownerId: "ExampleClientId",
    stackPrefix: "ExampleStackProduction",
    fqdn: "example.com",
    isProd: true
  });

  expect(stack).toHaveResource('AWS::S3::Bucket', {
    "BucketName": "examplestackproductions3bucket",
    "VersioningConfiguration": {
      "Status": "Enabled"
    }
  });

  expect(stack).toHaveResource('AWS::Route53::RecordSet', {
    "Name": "prod.example.com.",
    "Type": "A"
  });

});