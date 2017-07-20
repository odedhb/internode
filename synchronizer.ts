import {InterNode} from "./internode";
import {DataStore} from "./datastore";
/**
 * Created by oded on 6/5/17.
 */
export class Synchronizer {
    private hosts: string[];
    private syncPath: string;
    private nodeID: string;
    private dataStore: DataStore;

    constructor(syncInterval: number, hosts: string[], syncPath: string, nodeID: string, dataStore: DataStore) {
        this.hosts = hosts;
        this.syncPath = syncPath;
        this.nodeID = nodeID;
        this.dataStore = dataStore;
        setInterval(() => {
            this.sync();
        }, syncInterval);
    }

    private sync() {
        let randomHost = this.hosts[Math.floor(Math.random() * this.hosts.length)];
        let url = randomHost + this.syncPath + '?node_id=' + this.nodeID;
        InterNode.log('syncing from ' + url);

        require('request').get(
            {
                url: url,
            },
            (error: any, response: any, body: any) => {
                if (body && response && response.statusCode == 200) {

                    try {
                        let parsedSyncData = JSON.parse(body);

                        if (parsedSyncData.status) {
                            InterNode.log('received status: ' + parsedSyncData.status);
                        } else {
                            this.dataStore.receiveSync(parsedSyncData);
                        }

                    } catch (error) {
                        InterNode.log('receiveSync error: ' + JSON.stringify(error));
                        return;
                    }
                } else {
                    InterNode.log(error + ' | ' + randomHost + ' | ' + JSON.stringify(response) + ' | ' + body);
                }
            }
        );
    }

    //does this node have fresh data for the requesting node?
    isFreshData(req: any) {
        if (req.query.node_id === InterNode.nodeID) {
            InterNode.log('do not sync: same server');
            return false;
        } else if (Object.keys(this.dataStore.items).length < 1) {
            InterNode.log('do not sync: no data');
            return false;
        }
        return true;
    }

}