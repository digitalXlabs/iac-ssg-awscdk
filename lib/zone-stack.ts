/**
 *  Create a hosted zone as a separate stack
 * 
 */
import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';

import { IHostedZone, IRecordSet } from '@aws-cdk/aws-route53';

interface StackProps extends cdk.StackProps {
  stackPrefix: string;
  isProd?: boolean;
  owner?: string;
  ownerId?: string;
  fqdn?: string;
}

export class HZStack extends cdk.Stack {

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

    const myHostedZone = this.createHostedZone();
    if (!myHostedZone) {
      throw new Error(`There is no hosted zone for this domain ${this.domainApex}`);
    }

    new cdk.CfnOutput(this, "HostedZone", { "value": myHostedZone.zoneName });

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

}