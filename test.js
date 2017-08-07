"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internode_1 = require("./internode");
class TestApp {
    get(syncPath, callback) {
        console.log('app init ' + syncPath);
        this.syncCallback = callback;
        let req = { query: { node_id: 3 } };
        this.syncCallback(req, new TestResponse());
    }
}
class TestResponse {
    send(message) {
        console.log('Response: ' + JSON.stringify(message));
    }
}
////
internode_1.InterNode.init(new TestApp(), null);
////
internode_1.InterNode.set('test1', '1');
if (internode_1.InterNode.itemCount() == 1) {
    console.log('set() success');
}
////
if (internode_1.InterNode.get('test1') == `1`) {
    console.log('get() success');
}
////
//# sourceMappingURL=test.js.map