/** Certificate utility functions */
import * as cdk from '@aws-cdk/core';

import { IHostedZone, IRecordSet } from '@aws-cdk/aws-route53';
import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import * as acm from '@aws-cdk/aws-certificatemanager';

import { SubDomain } from '../_interfaces/sub-domain';
import { GetDomain } from './utility';

/**
 * Makes a certificate for the domain and a wildcard domain
 * example.com & *.example.com
 * 
 * @param scope 
 * @param subDomains 
 * @param hostedZone 
 * @param domainApex 
 * @param region
 * @param isProd 
 * @returns ICertificate
 */
export const MakeCertificate = (scope: any, subDomains: SubDomain[], hostedZone: IHostedZone, domainApex: string, region?: string, isProd?: boolean): ICertificate => {
  // if we're prod, we need domainApex and alternates
  // if we're non-prod, only domain needed
  const ARecord = subDomains.filter(ele => ele.recordType === 'A');
  let props = {
    domainName: GetDomain(ARecord, domainApex),
    hostedZone: hostedZone,
    // since we're using cloudfront, the certificate has to be created in us-east-1 Zone
    region: region || 'us-east-1'
  }

  if (isProd) {
    const Cnames = subDomains.filter(ele => ele.recordType === 'CNAME');
    // means we have alternate names to add
    Object.assign(props, {
      subjectAlternativeNames: Cnames.map(ele => `${ele.recordName}.${domainApex}`)
    })
  }

  let cert = new acm.DnsValidatedCertificate(scope, scope.idPrefix + 'Certificate', props);
  new cdk.CfnOutput(scope, "Certificate", { "value": cert.certificateArn });

  return cert;
}