import * as cdk from '@aws-cdk/core'
import { camelCaseUpper } from '../src/strings';
import { AssetCode, Function, Runtime } from '@aws-cdk/aws-lambda';
import { LambdaRestApi, Cors, EndpointType, DomainName } from '@aws-cdk/aws-apigateway';
import { AttributeType, BillingMode, Table, TableEncryption } from '@aws-cdk/aws-dynamodb';
import { PolicyStatement, Policy } from '@aws-cdk/aws-iam';
import { RecordSet, RecordTarget } from '@aws-cdk/aws-route53';

import { MakeCertificate } from './_utils/certificate';
import { GetAHostedZone } from './_utils/hosted-zones';
import { StackProps } from './_interfaces/stack-properties';
import { SubDomain } from './_interfaces/sub-domain';
import { GetDomain } from './_utils/utility';
import { apexDomain, ICertificate } from '@aws-cdk/aws-certificatemanager';
import { domain } from 'process';

export class PrelaunchStack extends cdk.Stack {
  domainApex: string;
  idPrefix: string;
  isProd: boolean;

  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props);

    // uniform id prefix for our resources
    this.idPrefix = props?.stackPrefix || 'PreLaunchStack';

    // are we building a production stack
    this.isProd = props?.isProd || false;

    // the domain that we are going to work with
    this.domainApex = props?.fqdn!;

    const client = props?.owner!;

    const confirmationTemplate = this.node.tryGetContext('confirmationTemplate')
    const emailSource = this.node.tryGetContext('emailSource')
    const emailReply = this.node.tryGetContext('emailReply')

    const table = this.makeDynamoDBTable(client);
    new cdk.CfnOutput(this, "DynamoDB Table", { "value": table.tableName });


    // defines an AWS Lambda resource
    const handler = this.makeLambdaFunction(client, table, confirmationTemplate, emailSource, emailReply)
    new cdk.CfnOutput(this, "Lambda Function Arn", { "value": handler.functionArn });
    new cdk.CfnOutput(this, "Lambda Function Version", { "value": handler.latestVersion.version });
    // table permissions for lambda
    table.grantReadWriteData(handler);

    // add ses statement to lambda
    let policy = new Policy(this, "SendEmailPolicy", {})
    handler.role!.attachInlinePolicy(policy)
    policy.addStatements(new PolicyStatement(
      {
        resources: ["*"],
        actions: [
          "ses:*"
        ]
      }))

    // get the hosted zone if it exists for this domain
    const hz = GetAHostedZone(this);

    // make a certificate
    const certificate = MakeCertificate(this, [{
      recordName: "api",
      recordType: "A"
    }], hz, this.domainApex, props?.env?.region)


    // make the api domain
    const apiDomain = new DomainName(this, this.idPrefix + 'ApiGatewayCustomDomain', {
      domainName: `api.${this.domainApex}`,
      certificate: certificate,
      endpointType: EndpointType.REGIONAL
    })

    console.log(apiDomain)

    // define the api
    const api = this.makeRestAPI(client, handler, apiDomain, certificate, 'Rest api')


  }

  /**
   *
   *
   * @param {string} client
   * @returns
   * @memberof PrelaunchStack
   */
  makeDynamoDBTable(client: string) {
    return new Table(this, camelCaseUpper(`${this.idPrefix} Table`), {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      tableName: camelCaseUpper(`${this.idPrefix} Table`),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'expiresAt',
      encryption: TableEncryption.DEFAULT,
    });
  }

  /**
   *
   *
   * @param {string} client
   * @param {*} table
   * @param {string} confirmationTemplate
   * @param {string} emailSource
   * @param {string} emailReply
   * @returns
   * @memberof PrelaunchStack
   */
  makeLambdaFunction(client: string, table: any, confirmationTemplate: string, emailSource: string, emailReply: string) {
    return new Function(this, camelCaseUpper(`${this.idPrefix} Handler`), {
      runtime: Runtime.NODEJS_12_X,
      code: new AssetCode('src/prelaunch', { exclude: ['*.ts', '*.json'] }),
      handler: 'handler.handler',
      environment: {
        TABLE: table.tableName,
        CONFIRMTEMPLATE: confirmationTemplate,
        EMAILSOURCE: emailSource,
        EMAILREPLY: emailReply
      }
    });
  }

  /**
   *
   *
   * @param {string} client
   * @param {*} handler
   * @param {string} domainApex
   * @param {*} certificate
   * @param {string} description
   * @returns
   * @memberof PrelaunchStack
   */
  makeRestAPI(client: string, handler: any, apidomain: any, certificate: ICertificate, description: string) {

    return new LambdaRestApi(this, camelCaseUpper(`${this.idPrefix} RestAPI`), {
      handler: handler,
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS // this is also the default
      },
      deploy: true,
      deployOptions: { stageName: this.isProd ? 'prod' : 'stage' },
      description: "API used to collect prelaunch subscribers",
      disableExecuteApiEndpoint: true,
      domainName: {
        domainName: apidomain,
        certificate: certificate,
      },
      endpointTypes: [EndpointType.REGIONAL],
      retainDeployments: false
    });
  }
}
