import {InterNode} from "./internode";


class TestApp {
    syncCallback: any;

    get(syncPath: string, callback: any) {
        console.log('app init ' + syncPath);
        this.syncCallback = callback;
        let req = {query: {node_id: 3}};
        this.syncCallback(req, new TestResponse());
    }
}

class TestResponse {
    send(message: any) {
        console.log('Response: ' + JSON.stringify(message));
    }
}

////
InterNode.init(new TestApp(), null);
////
InterNode.set('test1', '1');
if (InterNode.itemCount() == 1) {
    console.log('set() success');
}
////
if (InterNode.get('test1') == `1`) {
    console.log('get() success');
}
////
