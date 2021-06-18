import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as targets from '@aws-cdk/aws-route53-targets';


interface StackProps extends cdk.StackProps {
  stackPrefix: string;
  isProd?: boolean;
  owner?: string;
  ownerId?: string;
  fqdn?: string;

}

export class SSGStack extends cdk.Stack {


  constructor(scope: cdk.Construct, id: string, props?: StackProps) {
    super(scope, id, props);



    const idPrefix = props?.stackPrefix || 'SSGStack';

    // the domain that we are going to work with
    const tld = props?.fqdn!;

    // this is the sub-domain we will be using for the SSG site
    let domain;
    if (props?.isProd) {
      domain = 'prod.' + tld;
    }
    else {
      domain = 'stage.' + tld;
    }


    // Creating a S3 bucket that will store the HTML and assets of the SSG site
    //  when it's resdy to be deployed

    // check origins depending on prod flag
    const allowedOrigins = props?.isProd ? ['prod.' + tld, 'www.' + tld,  tld] : ['stage.' + tld]
    const myBucket = new s3.Bucket(this, idPrefix.toLowerCase() + 's3bucket', {
      // we will keep versions of our objects 
      versioned: true,
      // since this is a test stack we want to destroy it when the stack is destroyed
      // if you are deploying this to prod, it may be prudent ot change this 
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // we want the objects to be removed when the stack is destroyed
      autoDeleteObjects: true,
      // give it a name
      bucketName: idPrefix.toLowerCase() + 's3bucket',
      enforceSSL: true,
    })
    // add cprsreule
    myBucket.addCorsRule({
      allowedOrigins: allowedOrigins,
      allowedMethods: [s3.HttpMethods.GET],
    })
    
    
    // create Route53 Hosted Zone or if supplied, get the existing hostedZone
    let myHostedZone;

    if (tld) {
      myHostedZone = route53.HostedZone.fromLookup(this, idPrefix + 'HostedZone', {
        domainName: tld
      });
    }
    else {
      myHostedZone = new route53.PublicHostedZone(this, idPrefix + 'HostedZone', {
        zoneName: domain
      })
    }

    // new certificate for this zone
    const myCert = new acm.DnsValidatedCertificate(this, idPrefix + 'Certificate', {
      domainName: tld,
      subjectAlternativeNames: ['*.' + tld],
      hostedZone: myHostedZone,
      // since we're using cloudfront, the certificate has to be created in us-east-1 Zone
      region: 'us-east-1'
    })
    const myFunc = new cloudfront.experimental.EdgeFunction(this, idPrefix + 'Function', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('src/edge', { exclude: ['*.ts', '*.json'] }),
      handler: 'redirects.handler',
      functionName: idPrefix + 'EdgeFunction',
      stackId: idPrefix + 'Edge'
    });

    // create cloudfront distribution using the bucket as origin
    const myDistribution = new cloudfront.Distribution(this, idPrefix + 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(myBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        edgeLambdas: [
          {
            functionVersion: myFunc.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          }
        ],
      },
      domainNames: (props?.isProd) ? [domain, 'www.' + tld, tld] : [domain],
      certificate: myCert,
    })

    // add cloudfront distribution domain name to Route53
    new route53.ARecord(this, idPrefix + 'Route53ARecordFromDistribution', {
      zone: myHostedZone,
      recordName: domain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(myDistribution))
    });

    new cdk.CfnOutput(this, "bucket", {"value" : myBucket.bucketName});
    new cdk.CfnOutput(this, "distro", {"value" :  myDistribution.distributionId});
    new cdk.CfnOutput(this, "certificate",  {"value" : myCert.certificateArn});
    new cdk.CfnOutput(this, "function",  {"value" : myFunc.edgeArn});
    new cdk.CfnOutput(this, "function version", {"value" : myFunc.currentVersion.version});

  }
}