import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import * as SSGTemplate from '../lib/ssg-stack';


describe('Resources available', () => {
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

    expect(stack).toHaveOutput({ "outputName": "S3Bucket" });
    expect(stack).toHaveOutput({ "outputName": "CloudfrontDistrubutionID" });
    expect(stack).toHaveOutput({ "outputName": "Certificate" });
    expect(stack).toHaveOutput({ "outputName": "LambdaEdgeFunctionArn" });
    expect(stack).toHaveOutput({ "outputName": "LambdaEdgeFunctionVersion" });
    expect(stack).toHaveOutput({ "outputName": "Route53domains0" });

  });


  test('Resources production test', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SSGTemplate.SSGStack(app, 'MyTestProductionStack', {
      stackName: "examplestacknameproduction",
      env: {
        account: "testaccount1",
        region: "eu-west-1"
      },
      description: "test description production",
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
      "Name": "www.example.com.",
      "Type": "CNAME"
    });
    expect(stack).toHaveResource('AWS::Route53::RecordSet', {
      "Name": "example.com.",
      "Type": "A"
    });


    expect(stack).toHaveResource('AWS::S3::BucketPolicy');
    expect(stack).toHaveResource('AWS::IAM::Role');
    expect(stack).toHaveResource('AWS::Lambda::Function');
    expect(stack).toHaveResource('AWS::IAM::Policy');
    expect(stack).toHaveResource('AWS::CloudFormation::CustomResource');
    expect(stack).toHaveResource('Custom::CrossRegionStringParameterReader');
    expect(stack).toHaveResource('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    expect(stack).toHaveResource('AWS::CloudFront::Distribution');

    expect(stack).toHaveOutput({ "outputName": "S3Bucket" });
    expect(stack).toHaveOutput({ "outputName": "CloudfrontDistrubutionID" });
    expect(stack).toHaveOutput({ "outputName": "Certificate" });
    expect(stack).toHaveOutput({ "outputName": "LambdaEdgeFunctionArn" });
    expect(stack).toHaveOutput({ "outputName": "LambdaEdgeFunctionVersion" });
    expect(stack).toHaveOutput({ "outputName": "Route53domains0" });
    expect(stack).toHaveOutput({ "outputName": "Route53domains1" });


  });

})