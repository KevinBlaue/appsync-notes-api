import { Template } from 'aws-cdk-lib/assertions';
import { App } from './constructs/app';
import { GraphqlStack } from './graphql';

describe('GraphqlStack', () => {
  test.each(['dev', 'prod'])(
    'synthesizes the %s AppSync API with Lambda resolvers',
    (environment) => {
      const app = new App({ context: { environment } });
      const stack = new GraphqlStack(app, 'graphql', {
        env: { account: '111111111111', region: 'eu-central-1' },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    }
  );
});
