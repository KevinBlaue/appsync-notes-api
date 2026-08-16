import { Tags } from 'aws-cdk-lib';
import { App } from './app';

describe('App', () => {
  test('loads app defaults and environment-specific tags', () => {
    const app = new App({ context: { environment: 'dev' } });
    expect(app.defaultRegion).toBe('eu-central-1');
    expect(app.resourceTags).toEqual({
      project: 'appsync-notes-api',
      'managed-by': 'aws-cdk',
      lifecycle: 'ephemeral',
    });
    expect(Tags.of(app)).toBeDefined();
  });

  test('validates the environment context', () => {
    expect(() => new App()).toThrow('environment');
    expect(() => new App({ context: { environment: '../prod' } })).toThrow('environment');
  });
});
