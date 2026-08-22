#!/usr/bin/env node
import { App } from '../lib/constructs/app';
import { DatabaseStack } from '../lib/database';
import { GraphqlStack } from '../lib/graphql';
import { IamRoleGitHubStack } from '../lib/iamRoleGitHub';

const app = new App();

if (app.iamGitHubEnabled) {
  new IamRoleGitHubStack(app, 'iamGitHub');
}

const database = new DatabaseStack(app, 'database');
const graphql = new GraphqlStack(app, 'graphql', {
  notesTable: database.notesTable,
});
graphql.addStackDependency(database);
