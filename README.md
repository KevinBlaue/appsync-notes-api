# AppSync Notes API

This project showcases a small GraphQL API for creating and retrieving notes stored in Amazon DynamoDB.

A Lambda-based resolver handles both write and read operations, keeping the API layer lightweight while encapsulating the application logic in a single serverless component.

The schema includes mutations for creating notes and queries for retrieving them, illustrating the core GraphQL interaction model end to end.

A CloudWatch Synthetics canary regularly exercises this flow end to end by creating a note and retrieving it through the deployed API.

All AWS resources are defined with the AWS CDK, making the infrastructure reproducible, version-controlled, and easy to deploy across environments.

## Architecture

The CDK application separates resources with different lifecycles into three stacks:

```text
<environment>-iamGitHub    GitHub OIDC provider and repository deployment role
<environment>-database     DynamoDB notes table and optional demo seed
<environment>-graphql      AppSync API, resolvers, logs and canary
```

`graphql` receives the DynamoDB table through typed stack properties. The stack orchestration lives directly in `cdk/bin/cdk.ts`, following the same explicit composition style used in the reference projects. The resulting CloudFormation dependency keeps persistent data independent from application deployments. The IAM stack is enabled only for the persistent `dev`, `qa`, and `prod` environments.

## Environments

`environment` is both the configuration selector and the namespace for stacks and resources:

```bash
npm run cdk -- deploy --all -c environment=pr-123 --require-approval never
```

The command creates `pr-123-database` and `pr-123-graphql`. Configuration starts with `cdk/environments/default`; an environment-specific directory overrides those defaults when it exists. Dynamic environments such as `pr-123` therefore need no committed configuration directory.

The defaults are intentionally ephemeral. Production enables table deletion protection and retention and disables demo seeding.

## Synthetic demo data

All included seed data is synthetic and visibly marked. Development and pull-request tables contain one `DEMO` note referencing `portfolio-user@example.invalid`; the `.invalid` top-level domain cannot resolve as a real email domain. Production never receives seed data.

The AppSync API intentionally uses a short-lived API key for this isolated, non-production working probe. It demonstrates the GraphQL flow but does not represent user authentication or replace OAuth 2.0/OIDC.

## GitHub OIDC bootstrap

The `iamGitHub` stack restricts its trust policy to this repository and requires the `sts.amazonaws.com` audience. Its AWS permissions are deliberately pragmatic for a working probe: the role can assume only the standard CDK bootstrap roles in its account and region, plus read the bootstrap version and CloudFormation stack state. A production organization should review and further constrain these permissions for its own bootstrap model.

The role must be bootstrapped once using an administrator or AWS SSO session before GitHub Actions can assume it:

```bash
cd cdk
npx cdk bootstrap -c environment=dev
npx cdk deploy dev-iamGitHub -c environment=dev --require-approval never
```

By default, the stack creates the account's GitHub OIDC provider. If the provider already exists, set `createOidcProvider: false` in the environment's `iamGitHub.yaml`; the stack then imports the conventional provider ARN and creates only the repository role.

Store the resulting `DeployRoleArn` output in GitHub repository variables:

- `ENABLE_AWS_DEPLOYMENT=true`
- `AWS_DEV_DEPLOY_ROLE_ARN`
- `AWS_QA_DEPLOY_ROLE_ARN`
- `AWS_PROD_DEPLOY_ROLE_ARN`
- optionally `AWS_REGION` (defaults to `eu-central-1`)

## Deployment workflows

- Pull requests from branches in this repository deploy `pr-<number>` automatically when AWS deployment is enabled. Forks never receive an OIDC deployment job.
- Closing a pull request destroys all matching `pr-<number>-*` stacks.
- A push to `main` deploys `dev`.
- `qa` and `prod` are manual workflow-dispatch targets, providing an explicit promotion gate.

Every deployment runs formatting, linting, builds, unit tests, coverage, and CDK synthesis before assuming the AWS role.
