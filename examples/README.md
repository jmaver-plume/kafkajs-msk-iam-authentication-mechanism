# Examples

You can provision an MSK cluster using the CloudFormation template provided in `cloudformation.yaml`.

## Provision AWS infrastructure

**WARNING**: Provisioning an MSK cluster is not part of AWS Free Tier.

CloudFormation template will create an EC2 instance with Node.js LTS installed, MSK cluster and all other
required services to successfully connect from inside EC2 inside to MSK cluster.

CloudFormation provisioning will take approximately 30–45 minutes.

Template supports only **us-west-1** and **eu-central-1** regions. If you want support for additional regions you need to update
AWSRegionAMIEC2 mapping.
