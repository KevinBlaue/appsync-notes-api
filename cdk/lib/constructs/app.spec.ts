import { Tags } from 'aws-cdk-lib';
import { App } from './app';

describe('App', () => {
  test('loads app defaults and environment-specific tags', () => {
    const app = new App({ context: { environment: 'dev' } });
    expect(app.defaultRegion).toBe('eu-central-1');
    expect(app.resourceTags).toEqual({
      project: 'appsync-notes-api',
      'managed-by': 'aws-cdk',
      'data-classification': 'synthetic',
      lifecycle: 'ephemeral',
    });
    expect(app.iamGitHubEnabled).toBe(true);
    expect(Tags.of(app)).toBeDefined();
  });

  test('uses defaults for a dynamic pull-request environment', () => {
    const app = new App({ context: { environment: 'pr-123' } });
    expect(app.environmentName).toBe('pr-123');
    expect(app.iamGitHubEnabled).toBe(false);
    expect(app.resourceTags).toEqual({
      project: 'appsync-notes-api',
      'managed-by': 'aws-cdk',
      'data-classification': 'synthetic',
    });
  });

  test('validates the environment context', () => {
    expect(() => new App()).toThrow('environment');
    expect(() => new App({ context: { environment: '../prod' } })).toThrow('environment');
  });
});
