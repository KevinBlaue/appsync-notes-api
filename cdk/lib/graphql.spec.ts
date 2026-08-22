import { Template } from 'aws-cdk-lib/assertions';
import { App } from './constructs/app';
import { DatabaseStack } from './database';
import { GraphqlStack } from './graphql';

describe('GraphqlStack', () => {
  test.each(['dev', 'prod'])(
    'synthesizes the %s AppSync API with Lambda resolvers',
    (environment) => {
      const app = new App({ context: { environment } });
      const database = new DatabaseStack(app, 'database', {
        env: { account: '111111111111', region: 'eu-central-1' },
      });
      const stack = new GraphqlStack(app, 'graphql', {
        notesTable: database.notesTable,
        env: { account: '111111111111', region: 'eu-central-1' },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    }
  );
});
