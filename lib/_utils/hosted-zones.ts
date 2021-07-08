import { HostedZone, IHostedZone, PublicHostedZone } from '@aws-cdk/aws-route53';

/**
   * Returns the hosted zone record for the top level domain
   * 
   * @returns 
   */
export const GetAHostedZone = (scope: any): IHostedZone => {
  return HostedZone.fromLookup(scope, scope.idPrefix + 'HostedZone', {
    domainName: scope.domainApex
  });
}

/**
 * Creates a new hosted zone
 * @returns 
 */
export const CreateAHostedZone = (scope: any): IHostedZone => {
  return new PublicHostedZone(scope, scope.idPrefix + 'HostedZone', {
    zoneName: scope.domainApex
  })
}