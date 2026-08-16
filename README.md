# AppSync Notes API

This project showcases a small GraphQL API for creating and retrieving notes stored in Amazon DynamoDB.

A Lambda-based resolver handles both write and read operations, keeping the API layer lightweight while encapsulating the application logic in a single serverless component.

The schema includes mutations for creating notes and queries for retrieving them, illustrating the core GraphQL interaction model end to end.

A CloudWatch Synthetics canary regularly exercises this flow end to end by creating a note and retrieving it through the deployed API.

All AWS resources are defined with the AWS CDK, making the infrastructure reproducible, version-controlled, and easy to deploy across environments.
