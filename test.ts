import {InterNode} from "./internode";
import {Stats} from "./stats";


class TestApp {
    static syncCallback: any;

    get(syncPath: string, callback: any) {
        console.log('app init ' + syncPath);
        TestApp.syncCallback = callback;
        let req = {query: {node_id: 3}};

        InterNode.setLogHandler((message) => {
            console.log(message);
        });

        setInterval(() => {
            TestApp.syncCallback(req, new TestResponse())
            console.log(Stats.stats());
        }, 1000);
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
new TestApp();