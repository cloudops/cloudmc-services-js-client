# The CloudMC API JavaScript Client Library

The CloudMC API, now available with 75% less type safety!

## Installation

¯\\\_(ツ)_/¯

## Usage

```js
const cmc = require('./index')('https://api.your.cloudmc/v1', 'your_api_key'),
    sandbox = cmc('compute', 'sandbox');

sandbox.instances().list()
    .then(instances => Promise.all(instances
        .filter(i => i.state === 'Stopped')
        .map(i => sandbox.instances().start(i.id))));
```

## Future Work

- Inject service operations into entities using proxies
    + ie last line of example above becomes `.map(i => i.start())`
