import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as  s3deploy from '@aws-cdk/aws-s3-deployment';

import { IHostedZone, IRecordSet } from '@aws-cdk/aws-route53';
import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import { IBucket } from '@aws-cdk/aws-s3';
import { ErrorResponse, IDistribution } from '@aws-cdk/aws-cloudfront';
interface StackProps extends cdk.StackProps {
  stackPrefix: string;
  isProd?: boolean;
  owner?: string;
  ownerId?: string;
  fqdn?: string;
}

interface SubDomains {
  recordName: string;
  recordType: string;
  recordValue?: string;
}
export class SSGStack extends cdk.Stack {

  domainApex: string;
  idPrefix: string;
  isProd: boolean;


  constructor(scope: cdk.Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // uniform id prefix for our resources
    this.idPrefix = props?.stackPrefix || 'SSGStack';

    // are we building a production stack
    this.isProd = props?.isProd || false;

    // the domain that we are going to work with
    this.domainApex = props?.fqdn!;

    if (!this.domainApex) {
      throw new Error('We need a FQDN to proceed, please add a context property `domainName`')
    }
  }

  run() {

    // this is the sub-domain we will be using for the SSG site
    const subDomains = this.makeSubDomains();

    // retrieves an existing zone based on the domainApex
    const myHostedZone = this.getHostedZone();
    if (!myHostedZone) {
      throw new Error(`There is no hosted zone for this domain ${this.domainApex}`);
    }
    // create allow origins for cors rule on s3 bucket
    const allowedOrigins = subDomains.map(ele => ele.recordName ? `${ele.recordName}.${this.domainApex}` : this.domainApex)

    // Create the S3 bucket that will store the HTML and assets of the SSG site
    const myBucket = this.makeBucket(allowedOrigins);
    // // new certificate for this zone
    const myCert = this.makeCertificate(subDomains, myHostedZone)

    const myFunc = this.makeLambdaFunction();

    // // create cloudfront distribution using the bucket as origin
    const myDistribution = this.makeDistribution(myBucket, myFunc, myCert, allowedOrigins)

    this.makeRecordSets(myHostedZone, myDistribution, subDomains);
    this.makeDeployment(myBucket, myDistribution);
  }


  makeSubDomains(): SubDomains[] {
    if (this.isProd) {
      return [
        {
          recordName: "www",
          recordType: "CNAME"
        },
        {
          recordName: "",
          recordType: "A"
        }
      ]
    }
    else {
      return [
        {
          recordName: "stage",
          recordType: "A"
        }]
    }
  }

  /**
   * Creates an S3 Bucket for storing our site
   * @param allowedOrigins 
   * @returns 
   */
  makeBucket(allowedOrigins: any): IBucket {
    const bucketName = this.idPrefix.toLowerCase() + 's3bucket';
    const bucket = new s3.Bucket(this, bucketName, {
      // we will keep versions of our objects 
      versioned: true,
      // since this is a test stack we want to destroy it when the stack is destroyed
      // if you are deploying this to prod, it may be prudent ot change this 
      removalPolicy: this.isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      // we want the objects to be removed when the stack is destroyed
      autoDeleteObjects: this.isProd ? false : true,
      // give it a name
      bucketName: bucketName,
      // only allow retrieval via SSL
      enforceSSL: true,
      cors: [
        {
          allowedOrigins: allowedOrigins,
          allowedMethods: [s3.HttpMethods.GET],
        }
      ]
    })


    new cdk.CfnOutput(this, "S3Bucket", { "value": bucket.bucketName });
    return bucket;
  }

  /**
   * Returns the hosted zone record for the top level domain
   * 
   * @returns 
   */
  getHostedZone(): IHostedZone  {
    return route53.HostedZone.fromLookup(this, this.idPrefix + 'HostedZone', {
      domainName: this.domainApex
    });

  }

  /**
   * Creates a new hosted zone
   * @returns 
   */
  createHostedZone(): IHostedZone {
    return new route53.PublicHostedZone(this, this.idPrefix + 'HostedZone', {
      zoneName: this.domainApex
    })
  }

  /**
   * Makes a certificate for the domain and a wildcard domain
   * example.com & *.example.com
   * 
   * @param subDomains 
   * @param hostedZone 
   * @returns 
   * @todo certificate transparencylogs needs to be added for non prods so that they just be not visible
   */
  makeCertificate(subDomains: SubDomains[], hostedZone: IHostedZone): ICertificate {
    // if we're prod, we need domainApex and alternates
    // if we're non-prod, only domain needed
    const ARecord = subDomains.filter(ele => ele.recordType === 'A');

    let props = {
      domainName: this._getDomain(ARecord),
      hostedZone: hostedZone,
      // since we're using cloudfront, the certificate has to be created in us-east-1 Zone
      region: 'us-east-1'
    }

    if (this.isProd) {
      const Cnames = subDomains.filter(ele => ele.recordType === 'CNAME');
      // means we have alternate names to add
      Object.assign(props, {
        subjectAlternativeNames: Cnames.map(ele => `${ele.recordName}.${this.domainApex}`)
      })
    }

    let cert = new acm.DnsValidatedCertificate(this, this.idPrefix + 'Certificate', props);
    new cdk.CfnOutput(this, "Certificate", { "value": cert.certificateArn });

    return cert;
  }

  makeLambdaFunction() {
    const func = new cloudfront.experimental.EdgeFunction(this, this.idPrefix + 'Function', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('src/edge', { exclude: ['*.ts', '*.json'] }),
      handler: 'redirects.handler',
      functionName: this.idPrefix + 'EdgeFunction',
      stackId: this.idPrefix + 'Edge'
    });


    new cdk.CfnOutput(this, "Lambda Edge Function Arn", { "value": func.edgeArn });
    new cdk.CfnOutput(this, "Lambda Edge Function Version", { "value": func.currentVersion.version });
    return func;
  }


  /**
   * 
   * @param bucket 
   * @param func 
   * @param cert 
   * @param allowedOrigins 
   * @returns 
   */
  makeDistribution(bucket: IBucket, func: any, cert: ICertificate, allowedOrigins: any): IDistribution {

    let distribution = new cloudfront.Distribution(this, this.idPrefix + 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        edgeLambdas: [
          {
            functionVersion: func.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          }
        ],
      },
      domainNames: allowedOrigins,
      certificate: cert,
    })

    new cdk.CfnOutput(this, "Cloudfront Distrubution ID", { "value": distribution.distributionId });
    return distribution;
  }

  /**
   * 
   * @param hostedZone 
   * @param distribution 
   * @param subDomains 
   */
  makeRecordSets(hostedZone: IHostedZone, distribution: IDistribution, subDomains: SubDomains[]): any { //} route53.IRecordSet {

    const completed = subDomains.map(ele => {

      switch (ele.recordType) {
        case route53.RecordType.A:
          // console.log('makeRecordSets getting recordnameback', this._getDomain(ele))
          return new route53.RecordSet(this, this.idPrefix + 'Route53ARecordFromDistribution', {
            recordType: route53.RecordType.A,
            zone: hostedZone,
            recordName: this._getDomain(ele),
            comment: 'this is the A record',
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
          });
        default:
          return new route53.RecordSet(this, this.idPrefix + 'Route53CNameRecord' + ele.recordName, {
            recordType: route53.RecordType.CNAME,
            zone: hostedZone,
            comment: 'this is the nth cname',
            recordName: `${ele.recordName}.${this.domainApex}`,
            target: route53.RecordTarget.fromValues(this.domainApex)

          })
      }
    })

    // console.log(processed)
    for (let i = 0; i < completed.length; i++) {
      // console.log("CFNOUTPUT", completed[i].domainName)
      new cdk.CfnOutput(this, "Route53 domains" + i, { "value": completed[i].domainName });
    }
  }

  makeDeployment(bucket: IBucket, distribution: IDistribution) {
    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset('./src/defaultSite')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }

  /**
   * Return the domain from the A record
   * @param a 
   * @returns string
   */
  _getDomain(a: any): string {

    let o = Array.isArray(a) ? a[0] : a;

    if (a.length > 1) {
      throw new Error(' Cannot handle more than one A record');
    }
    return (o.recordName === '') ? this.domainApex : `${o.recordName}.${this.domainApex}`;
  }
}