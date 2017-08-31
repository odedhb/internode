"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internode_1 = require("./internode");
/**
 * Created by oded on 6/5/17.
 */
class Synchronizer {
    constructor(syncInterval, hosts, syncPath, nodeID, dataStore) {
        this.nodesSyncTime = {};
        this.hosts = hosts;
        this.syncPath = syncPath;
        this.nodeID = nodeID;
        this.dataStore = dataStore;
        this.nodesSyncTime = {};
        setInterval(() => {
            this.sync();
        }, syncInterval);
    }
    getItemPartition(itemKey) {
        let nodeLifeSpan = 300000;
        let activeNodes = [];
        for (let key in this.nodesSyncTime) {
            if (this.nodesSyncTime.hasOwnProperty(key)) {
                let lastSync = this.nodesSyncTime[key];
                if (lastSync > (Date.now() - nodeLifeSpan)) {
                    activeNodes.push(key);
                }
            }
        }
        let nodeCount = activeNodes.length;
        let thisNodesNumber = activeNodes.indexOf(this.nodeID);
        let itemKeyHash = itemKey.length; //todo: change this to an efficient hash function
        if (itemKeyHash % nodeCount == thisNodesNumber) {
            return true;
        }
        return false;
    }
    sync() {
        let randomHost = this.hosts[Math.floor(Math.random() * this.hosts.length)];
        let url = randomHost + this.syncPath + '?node_id=' + this.nodeID;
        internode_1.InterNode.log('syncing from ' + url);
        require('request').get({
            url: url,
        }, (error, response, body) => {
            if (body && response && response.statusCode == 200) {
                try {
                    let parsedSyncData = JSON.parse(body);
                    if (parsedSyncData.status) {
                        internode_1.InterNode.log('received status: ' + parsedSyncData.status);
                    }
                    else {
                        this.dataStore.receiveSync(parsedSyncData);
                    }
                }
                catch (error) {
                    internode_1.InterNode.log('receiveSync error: ' + JSON.stringify(error));
                    return;
                }
            }
            else {
                internode_1.InterNode.log(error + ' | ' + randomHost + ' | ' + JSON.stringify(response) + ' | ' + body);
            }
        });
    }
    //does this node have fresh data for the requesting node?
    isFreshData(req) {
        let nodeID = req.query.node_id;
        this.nodesSyncTime[nodeID] = Date.now();
        internode_1.InterNode.log('nodesSyncTime: ' + JSON.stringify(this.nodesSyncTime));
        if (nodeID === internode_1.InterNode.nodeID) {
            internode_1.InterNode.log('do not sync: same server');
            return false;
        }
        else if (Object.keys(this.dataStore.items).length < 1) {
            internode_1.InterNode.log('do not sync: no data');
            return false;
        }
        return true;
    }
}
exports.Synchronizer = Synchronizer;
//# sourceMappingURL=synchronizer.js.map