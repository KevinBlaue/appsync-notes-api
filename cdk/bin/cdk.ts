#!/usr/bin/env node
import { App } from '../lib/constructs/app';
import { GraphqlStack } from '../lib/graphql';

const app = new App();
new GraphqlStack(app, 'graphql');
