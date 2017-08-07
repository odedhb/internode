import {InterNode} from "./internode";


class TestApp {
    get() {
        console.log('getCalled');
    }
}

InterNode.init(new TestApp(), null);
InterNode.set('test1', '1');
