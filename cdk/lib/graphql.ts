import { join } from 'node:path';
import {
  AppsyncFunction,
  AuthorizationType,
  Code as AppsyncCode,
  Definition,
  FieldLogLevel,
  FunctionRuntime,
  GraphqlApi,
  Resolver,
} from 'aws-cdk-lib/aws-appsync';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  ApplicationLogLevel,
  Architecture,
  LoggingFormat,
  Runtime,
  SystemLogLevel,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import {
  Canary,
  Cleanup,
  Code as SyntheticsCode,
  Runtime as SyntheticsRuntime,
  Schedule,
  Test,
} from 'aws-cdk-lib/aws-synthetics';
import { CfnOutput, Duration, Expiration, Stack } from 'aws-cdk-lib';
import { BaseStack } from './constructs/baseStack';
import type { StackProps } from './constructs/baseStack';
import type { App } from './constructs/app';

export class GraphqlStack extends BaseStack {
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    const removalPolicy = this.removalPolicy();
    const notes = new Table(this, 'Notes', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      deletionProtection: this.booleanValue('deletionProtection'),
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: this.booleanValue('pointInTimeRecovery'),
      },
      removalPolicy,
    });

    const resolverLogGroup = new LogGroup(this, 'ResolverLogs', {
      logGroupName: `/aws/lambda/${Stack.of(this).stackName}-notes-resolver`,
      retention: this.logRetention(),
      removalPolicy,
    });
    const resolver = new NodejsFunction(this, 'NotesResolver', {
      entry: join(
        __dirname,
        '..',
        '..',
        'src',
        'lambda-functions',
        'notes-resolver',
        'src',
        'index.ts'
      ),
      handler: 'handler',
      functionName: `${Stack.of(this).stackName}-notes-resolver`,
      runtime: Runtime.NODEJS_24_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(10),
      memorySize: 256,
      tracing: Tracing.ACTIVE,
      logGroup: resolverLogGroup,
      loggingFormat: LoggingFormat.JSON,
      applicationLogLevelV2: this.applicationLogLevel(),
      systemLogLevelV2: SystemLogLevel.WARN,
      bundling: {
        minify: this.booleanValue('minify'),
        sourceMap: true,
        target: 'node24',
      },
      environment: { NOTES_TABLE_NAME: notes.tableName },
    });
    notes.grantReadWriteData(resolver);

    const api = new GraphqlApi(this, 'NotesApi', {
      name: Stack.of(this).stackName,
      definition: Definition.fromFile(join(__dirname, '..', '..', 'contract', 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            description: 'Short-lived key for this non-production working probe',
            expires: Expiration.after(Duration.days(this.numberValue('apiKeyExpiresDays'))),
          },
        },
      },
      logConfig: {
        excludeVerboseContent: true,
        fieldLogLevel: this.fieldLogLevel(),
        retention: this.logRetention(),
      },
      xrayEnabled: true,
    });

    const dataSource = api.addLambdaDataSource('NotesDataSource', resolver);
    dataSource.createResolver('NoteQueryResolver', {
      typeName: 'Query',
      fieldName: 'note',
    });

    const createNoteFunction = new AppsyncFunction(this, 'CreateNoteFunction', {
      api,
      name: 'createNote',
      dataSource,
      runtime: FunctionRuntime.JS_1_0_0,
      code: AppsyncCode.fromAsset(
        join(__dirname, '..', '..', 'src', 'resolvers', 'create-note', 'dist', 'index.js'),
        { deployTime: true }
      ),
    });
    new Resolver(this, 'CreateNoteMutationResolver', {
      api,
      typeName: 'Mutation',
      fieldName: 'createNote',
      runtime: FunctionRuntime.JS_1_0_0,
      code: this.pipelineResolverCode,
      pipelineConfig: [createNoteFunction],
    });

    if (this.booleanValue('canaryEnabled')) {
      const apiKey = api.apiKey;
      if (!apiKey) throw new Error('The canary requires AppSync API key authorization');
      new Canary(this, 'NotesCanary', {
        canaryName: `${this.environmentName}-appsync-notes`,
        test: Test.custom({
          code: SyntheticsCode.fromAsset(join(__dirname, '..', '..', 'canary', 'dist')),
          handler: 'canary/index.handler',
        }),
        runtime: SyntheticsRuntime.SYNTHETICS_NODEJS_PUPPETEER_11_0,
        schedule: Schedule.once(),
        cleanup: Cleanup.LAMBDA,
        environmentVariables: {
          GRAPHQL_URL: api.graphqlUrl,
          GRAPHQL_API_KEY: apiKey,
        },
        startAfterCreation: true,
      });
    }

    new CfnOutput(this, 'GraphqlUrl', { value: api.graphqlUrl });
  }

  private get pipelineResolverCode(): AppsyncCode {
    return AppsyncCode.fromInline(`
      export function request() {
        return {};
      }

      export function response(ctx) {
        return ctx.result;
      }
    `);
  }

  private applicationLogLevel(): ApplicationLogLevel {
    const configured = this.stringValue('applicationLogLevel');
    if (configured === 'DEBUG') return ApplicationLogLevel.DEBUG;
    if (configured === 'INFO') return ApplicationLogLevel.INFO;
    if (configured === 'WARN') return ApplicationLogLevel.WARN;
    if (configured === 'ERROR') return ApplicationLogLevel.ERROR;
    throw new Error('Configuration value applicationLogLevel is unsupported');
  }

  private fieldLogLevel(): FieldLogLevel {
    const configured = this.stringValue('fieldLogLevel');
    if (configured === 'NONE') return FieldLogLevel.NONE;
    if (configured === 'ERROR') return FieldLogLevel.ERROR;
    if (configured === 'INFO') return FieldLogLevel.INFO;
    if (configured === 'DEBUG') return FieldLogLevel.DEBUG;
    if (configured === 'ALL') return FieldLogLevel.ALL;
    throw new Error('Configuration value fieldLogLevel is unsupported');
  }
}
