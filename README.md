# AWS CloudFormation Paper cuts

> A paper cut is a small customer deficency that would never be prioritized.

This repository contains a CloudFormation template which can be used to demo some unexpected destructive behaviours in the service.


## Deploy

```bash
# Deploy
aws cloudformation deploy --stack-name cfn-papercuts --template-file demo.yml --capabilities CAPABILITY_IAM

# Create change-set
aws cloudformation create-change-set \
  --stack-name <stack-name> \
  --template-body file://demo.yml \
  --change-set-name "change-set-$(date +%Y%m%d%H%M%S)" \
  --capabilities CAPABILITY_IAM

# View change-set
aws cloudformation describe-change-set \
  --stack-name <stack-name> \
  --change-set-name "change-set-$(date +%Y%m%d%H%M%S)" \
  --query 'Changes[*].{Action:ResourceChange.Action,LogicalId:ResourceChange.LogicalResourceId,ResourceType:ResourceChange.ResourceType,Replacement:ResourceChange.Replacement}' \
  --output table

```