import { RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { App } from './app';
import { BaseStack } from './baseStack';

class InspectableStack extends BaseStack {
  constructor(app: App) {
    super(app, 'graphql');
  }

  inspect(): void {
    expect(this.numberValue('apiKeyExpiresDays')).toBeGreaterThan(0);
    expect(this.booleanValue('canaryEnabled')).toBe(false);
    expect(this.stringValue('fieldLogLevel')).toBe('ERROR');
  }

  policies(): { removal: RemovalPolicy; retention: RetentionDays } {
    return { removal: this.removalPolicy(), retention: this.logRetention() };
  }

  invalidValues(): void {
    expect(() => this.stringValue('apiKeyExpiresDays')).toThrow('non-empty string');
    expect(() => this.numberValue('fieldLogLevel')).toThrow('must be a number');
    expect(() => this.booleanValue('fieldLogLevel')).toThrow('must be a boolean');
    expect(() => this.removalPolicy('fieldLogLevel')).toThrow('destroy or retain');
    this.configuration.invalidLogRetentionDays = 14;
    expect(() => this.logRetention('invalidLogRetentionDays')).toThrow('must be 7 or 30 days');
  }
}

describe('BaseStack', () => {
  test.each([
    ['dev', RemovalPolicy.DESTROY, RetentionDays.ONE_WEEK],
    ['prod', RemovalPolicy.RETAIN, RetentionDays.ONE_MONTH],
  ])('loads defaults and %s overrides', (environmentName, removal, retention) => {
    const app = new App({ context: { environment: environmentName } });
    const stack = new InspectableStack(app);
    stack.inspect();
    expect(stack.policies()).toEqual({ removal, retention });
    stack.invalidValues();
  });
});
