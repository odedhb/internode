"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internode_1 = require("./internode");
class TestApp {
    get() {
        console.log('getCalled');
    }
}
internode_1.InterNode.init(new TestApp(), null);
internode_1.InterNode.set('test1', '1');
//# sourceMappingURL=test.js.map