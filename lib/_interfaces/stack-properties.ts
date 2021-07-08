import * as cdk from '@aws-cdk/core';

export interface StackProps extends cdk.StackProps {
  stackPrefix: string;
  isProd?: boolean;
  owner?: string;
  ownerId?: string;
  fqdn?: string;
}
