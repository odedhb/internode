# internode

## init
In express's `app.js`, init *internode* with the express `app` and the domain base path on which to sync.
internode will add `/sync` to the base path and try to send and recieve sync data on that path.

```
let express = require('express');
let app = express();
require('internode').InterNode.init(app, 'https://domain.com');
```

## set(key: string, value: string, expire?: number)
`Internode.set('john@gmail.com', 'John Doe', 3600000)`

## get(key: string)
```
InterNode.get('john@gmail.com')
--> 'John Doe'
```

## aggregate(key: string, value: number, expire: number)
