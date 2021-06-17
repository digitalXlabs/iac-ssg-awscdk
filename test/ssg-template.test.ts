import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import * as SSGTemplate from '../lib/ssg-stack';

test('Resources test', () => {
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


    expect(stack).toHaveResource('AWS::S3::Bucket');
    expect(stack).toHaveResource('AWS::S3::BucketPolicy');
    expect(stack).toHaveResource('Custom::S3AutoDeleteObjects');
    expect(stack).toHaveResource('AWS::IAM::Role');
    expect(stack).toHaveResource('AWS::Lambda::Function');

    console.log(stack);
    // expect(stack).toHaveOutput({'outputName': 'S3Bucket'})
    // expect(stack).toHaveOutput({'outputName': 'Certificate'})
    // expect(stack).toHaveOutput({'outputName': 'CloudfrontDistrubutionID'})
    // expect(stack).toHaveOutput({'outputName': 'RecordSetDomain'})
    // expect(stack).toHaveOutput({'outputName': 'LambdaEdgeFunctionArn'})
    // expect(stack).toHaveOutput({'outputName': 'LambdaEdgeFunctionVersion'})
    
});
