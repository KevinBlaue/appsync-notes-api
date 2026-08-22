import { CfnOutput } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { BaseStack } from './constructs/baseStack';
import type { StackProps } from './constructs/baseStack';
import type { App } from './constructs/app';

export class DatabaseStack extends BaseStack {
  readonly notesTable: Table;

  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    this.notesTable = new Table(this, 'Notes', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      deletionProtection: this.booleanValue('deletionProtection'),
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: this.booleanValue('pointInTimeRecovery'),
      },
      removalPolicy: this.removalPolicy(),
    });

    if (this.booleanValue('seedDemoData')) {
      this.seedDemoNote();
    }

    new CfnOutput(this, 'NotesTableName', { value: this.notesTable.tableName });
  }

  private seedDemoNote(): void {
    new AwsCustomResource(this, 'DemoNote', {
      installLatestAwsSdk: false,
      onCreate: {
        service: 'DynamoDB',
        action: 'putItem',
        parameters: {
          TableName: this.notesTable.tableName,
          Item: {
            id: { S: '00000000-0000-4000-8000-000000000001' },
            title: { S: 'DEMO Note' },
            content: { S: 'Synthetic example owned by portfolio-user@example.invalid' },
            createdAt: { S: '2026-01-01T00:00:00.000Z' },
            dataClassification: { S: 'synthetic' },
          },
          ConditionExpression: 'attribute_not_exists(id)',
        },
        physicalResourceId: PhysicalResourceId.of('DEMO-NOTE-001'),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: [this.notesTable.tableArn] }),
    });
  }
}
