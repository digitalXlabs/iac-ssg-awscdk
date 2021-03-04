import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as HugoTemplate from '../lib/hugo-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new HugoTemplate.HugoStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
