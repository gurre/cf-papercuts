// import { Construct } from 'constructs';

import * as cdk     from 'aws-cdk-lib';
import * as sqs     from 'aws-cdk-lib/aws-sqs';
import * as lambda  from 'aws-cdk-lib/aws-lambda';
import {SqsEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam     from 'aws-cdk-lib/aws-iam';
import * as dynamo  from 'aws-cdk-lib/aws-dynamodb';
import * as rds     from 'aws-cdk-lib/aws-rds';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    // 1  Logical-ID rename demo
    const userTable = new dynamo.Table(this, 'SafeUserTable', {
      tableName: 'users-dev',    // physical name stable
      partitionKey: { name: 'id', type: dynamo.AttributeType.STRING },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      // removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 2  Name tweak
    new dynamo.Table(this, 'OrdersTable', {
      tableName: 'orders-dev',   // switch to 'orders' → replacement
      partitionKey: { name: 'orderId', type: dynamo.AttributeType.STRING },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      // removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 3  Subnet switch on RDS
    const vpc = new cdk.aws_ec2.Vpc(this, 'DevVPC', {
      // Create the VPC with only public subnets
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 24
        }
      ],
      maxAzs: 2
    });
    
    // Create subnet groups using the public subnets since we're just demonstrating
    const publicSubnets = vpc.publicSubnets;
    const sgA = new rds.SubnetGroup(this, 'DbSubnetGroupA', { 
      vpc, 
      description: 'A', 
      subnetGroupName: 'a',
      vpcSubnets: {
        subnets: [publicSubnets[0], publicSubnets[1]]
      }
    });
    
    const sgB = new rds.SubnetGroup(this, 'DbSubnetGroupB', { 
      vpc, 
      description: 'B', 
      subnetGroupName: 'b',
      vpcSubnets: {
        subnets: [publicSubnets[0], publicSubnets[1]]
      }
    });
    
    new rds.DatabaseInstance(this, 'DevDB', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15 }),
      vpc,
      subnetGroup: sgA,            // flip to sgB for PAPER CUT
      // deletionProtection: true,
    });

    // 4  Cross-stack export name change
    new cdk.CfnOutput(this, 'DevVpcId', {
      value: vpc.vpcId,
      exportName: 'DevVPC-Id',  // rename → consumer stacks break
    });

    // 5  SQS FIFO flip
    const q = new sqs.Queue(this, 'DevWorkQueue', {
      fifo: false,                 // set to true (and *.fifo name) → replacement
      // removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    const fn = new lambda.Function(this, 'DevDemoFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, ctx): print(event)'),
    });
    fn.addEventSource(new SqsEventSource(q));

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sqs:*'],
      resources: [q.queueArn],
    }));
  }
}