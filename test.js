"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internode_1 = require("./internode");
class TestApp {
    get(syncPath, callback) {
        console.log('app init ' + syncPath);
        TestApp.syncCallback = callback;
        let req = { query: { node_id: 3 } };
        setInterval(() => {
            TestApp.syncCallback(req, new TestResponse());
        }, 1000);
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
new TestApp();
//# sourceMappingURL=test.js.map