import * as synthetics from 'Synthetics';
import * as logger from 'SyntheticsLogger';
import { apiTest } from './apiTest';

export async function handler(): Promise<void> {
  logger.info('Starting AppSync notes API canary');
  await synthetics.executeStep('create and load note', apiTest);
}
