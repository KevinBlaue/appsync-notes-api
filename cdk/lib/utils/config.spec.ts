import { join } from 'node:path';
import { deepMerge, loadEnvironmentConfiguration } from './config';

describe('environment configuration', () => {
  test('merges defaults with the selected environment', () => {
    const directory = join(__dirname, '..', '..', 'environments');
    expect(loadEnvironmentConfiguration(directory, 'dev', 'graphql')).toMatchObject({
      apiKeyExpiresDays: 30,
      applicationLogLevel: 'DEBUG',
      removalPolicy: 'destroy',
    });
    expect(loadEnvironmentConfiguration(directory, 'prod', 'graphql')).toMatchObject({
      apiKeyExpiresDays: 90,
      removalPolicy: 'retain',
    });
  });

  test('uses defaults when a dynamic environment has no override directory', () => {
    const directory = join(__dirname, '..', '..', 'environments');
    expect(loadEnvironmentConfiguration(directory, 'pr-123', 'database')).toMatchObject({
      removalPolicy: 'destroy',
      seedDemoData: true,
    });
  });

  test('deep-merges nested objects without mutating defaults', () => {
    const defaults = { tags: { project: 'notes', lifecycle: 'default' }, region: 'eu-central-1' };
    expect(deepMerge(defaults, { tags: { lifecycle: 'ephemeral' } })).toEqual({
      tags: { project: 'notes', lifecycle: 'ephemeral' },
      region: 'eu-central-1',
    });
    expect(defaults.tags.lifecycle).toBe('default');
  });
});
