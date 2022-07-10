# Example

Runs a simple example which lists kafka kafka topics.

## Run

```bash
# cd project root
npm install
cd example
npm install
# Substitute with valid brokers and region
# Run inside EC2 or ECS instance in same VPC as MSK cluster
BROKERS=host1:9098,host2:9098,host3:9098 REGION=eu-central-1 node .
```
