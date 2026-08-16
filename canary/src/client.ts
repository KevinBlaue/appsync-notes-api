import { request } from 'node:https';
import type { RequestOptions } from 'node:https';

export interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class Client {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly userAgent: string
  ) {}

  createRequest(
    query: string,
    variables: Record<string, unknown>
  ): RequestOptions & {
    body: string;
  } {
    const endpoint = new URL(this.endpoint);
    const body = JSON.stringify({ query, variables });
    return {
      protocol: endpoint.protocol,
      hostname: endpoint.hostname,
      port: endpoint.port || undefined,
      path: `${endpoint.pathname}${endpoint.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': this.userAgent,
        'x-api-key': this.apiKey,
      },
      body,
    };
  }

  execute<T>(query: string, variables: Record<string, unknown>): Promise<GraphqlResponse<T>> {
    const { body, ...options } = this.createRequest(query, variables);
    return new Promise((resolve, reject) => {
      const httpRequest = request(options, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as GraphqlResponse<T>);
          } catch (error) {
            reject(error instanceof Error ? error : new Error('Could not parse GraphQL response'));
          }
        });
      });
      httpRequest.on('error', reject);
      httpRequest.end(body);
    });
  }
}
