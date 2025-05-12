# AWS CloudFormation Paper cuts

> A paper cut is a small customer deficency that would never be prioritized.

This repository contains a CloudFormation template which can be used to demo some unexpected destructive behaviours in the service.


## Deploy

```bash
aws cloudformation deploy --stack-name cfn-papercuts --template-file demo.yml --capabilities CAPABILITY_IAM
```