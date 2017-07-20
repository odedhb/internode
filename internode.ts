import {Synchronizer} from "./synchronizer";
import {DataStore} from "./datastore";
/**
 * Created by oded on 5/3/17.
 */
export class InterNode {

    static nodeID: string;
    private static dataStore: DataStore;
    private static synchronizer: Synchronizer;
    private static SYNC_INTERVAL = 100;

    public static getNodeID() {
        return InterNode.nodeID;
    }

    public static init(app: any, ...hosts: string[]) {
        InterNode.nodeID = Math.random().toString(36).substring(2, 8);
        InterNode.dataStore = new DataStore(InterNode.nodeID);
        InterNode.log('node ' + InterNode.nodeID + ' is up');
        let syncPath = '/sync';
        InterNode.synchronizer = new Synchronizer(InterNode.SYNC_INTERVAL, hosts, syncPath, InterNode.nodeID, InterNode.dataStore);
        app.get(syncPath, InterNode.receiveHttpGet());
    }


    public static itemCount() {
        return InterNode.dataStore.itemCount();
    }

    public static set(key: string, value: string, expire?: number): void {
        InterNode.dataStore.set(key, value, expire)
    }

    public static get(key: string): any {
        return InterNode.dataStore.get(key);
    }

    public static aggregate(key: string, value: number, expire: number): void {
        InterNode.dataStore.aggregate(key, value, expire);
    }

    public static getAggregated(key: string): any {
        return InterNode.dataStore.getAggregated(key);
    }

    private static receiveHttpGet(): (req: any, res: any) => void {
        return (req: any, res: any) => {
            if (InterNode.synchronizer.isFreshData(req)) {
                res.send(InterNode.dataStore.getDataStoreDiff(req.query.node_id));
            } else {
                res.send({status: Status.NOTHING_NEW});
            }
        }
    }

    static log(message: string) {
        if (InterNode.logHandler) {
            InterNode.logHandler('internode: ' + InterNode.nodeID + ' : ' + message);
        }
    }

    public static setLogHandler(logHandler: (message: string) => void) {
        InterNode.logHandler = logHandler;
    }

    private static logHandler: (message: string) => void;

}

export class Status {
    static NOTHING_NEW = 'nothing_new';
}