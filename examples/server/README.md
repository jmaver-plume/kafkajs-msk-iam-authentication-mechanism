# Example

Runs an express server with a couple of endpoints to manage kafka topics and messages.

## Run

```bash
# cd project root
npm install
cd examples/server
npm install
# Substitute with valid brokers and region
# Run inside EC2 or ECS instance in same VPC as MSK cluster
BROKERS=host1:9098,host2:9098,host3:9098 REGION=eu-central-1 node .
```

### Create topic

```shell
curl -H 'Content-Type: application/json' -d '{"topic": "foo"}' http://localhost:3000/topic
```

### Subscribe to topic

```shell
curl -H 'Content-Type: application/json' -d '{"topic": "foo"}' http://localhost:3000/subscribe
```

### Post a message

```shell
curl -H 'Content-Type: application/json' -d '{"message": "Clean room", "topic": "foo"}' http://localhost:3000/message
```

