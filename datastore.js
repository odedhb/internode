"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internode_1 = require("./internode");
/**
 * Created by oded on 6/5/17.
 */
//for serialization
class DataStore {
    constructor(nodeID) {
        this.items = {};
        this.node_id = nodeID;
        this.nodeSyncIndex = new Map();
    }
    itemCount() {
        return Object.keys(this.items).length;
    }
    set(key, value, expire) {
        let item = new Item();
        item.value = value;
        item.time = Date.now();
        if (!item.synced_nodes) {
            item.synced_nodes = [];
        }
        else {
            item.synced_nodes.length = 0;
        }
        item.synced_nodes.push(this.node_id);
        if (expire) {
            item.expire = Date.now() + expire;
        }
        this.items[key] = item;
    }
    get(key) {
        let item = this.items[key];
        if (!item)
            return null;
        return item.value;
    }
    aggregate(key, value, expire) {
        let aggregateKey = this.aggregateKey(key);
        let oldItem = this.items[aggregateKey];
        let newValue;
        if (oldItem) {
            newValue = parseFloat(oldItem.value) + value;
        }
        else {
            newValue = value;
        }
        this.set(aggregateKey, newValue, expire);
    }
    aggregateKey(key) {
        return this.aggregateKeyPrefix(key) + this.node_id;
    }
    aggregateKeyPrefix(key) {
        return key + '::';
    }
    getAggregated(key) {
        let aggregatedItemValue = 0;
        let shardsMessage = '';
        for (let itemKey in this.items) {
            if (!this.items.hasOwnProperty(itemKey))
                continue;
            if (itemKey.startsWith(key)) {
                let item = this.items[itemKey];
                if (item.value) {
                    shardsMessage += '\n- ' + itemKey + ' - ' + item.value;
                    aggregatedItemValue += parseFloat(item.value);
                }
            }
        }
        if (aggregatedItemValue) {
            let logMessage = 'aggregatedItemValue\nrequestedKey:' + key + ' - agg value - ' + aggregatedItemValue + shardsMessage;
            internode_1.InterNode.log(logMessage);
        }
        return aggregatedItemValue;
    }
    getDataStoreDiff(nodeId) {
        let diffItems = {};
        let diffItemCount = 0;
        let itemIndex = 0;
        //reset the index if we're done with all of the items
        if (this.nodeSyncIndex.get(nodeId) >= this.itemCount()) {
            this.nodeSyncIndex.set(nodeId, 0);
        }
        for (let key in this.items) {
            if (!this.items.hasOwnProperty(key))
                continue;
            if (this.nodeSyncIndex.get(nodeId) && itemIndex < this.nodeSyncIndex.get(nodeId)) {
                //if this index location was already synced to that domain, skip it
                itemIndex++;
                continue;
            }
            else {
                this.nodeSyncIndex.set(nodeId, itemIndex);
                itemIndex++;
            }
            let item = this.items[key];
            //delete item if expired
            if (!item.expire || item.expire < Date.now()) {
                delete this.items[key];
                continue;
            }
            if (item.synced_nodes.indexOf(nodeId) == -1) {
                diffItems[key] = item;
                item.synced_nodes.push(nodeId);
                diffItemCount++;
            }
            if (diffItemCount >= DataStore.ITEMS_TO_SYNC_EACH_TIME) {
                break;
            }
        }
        let dataStoreDiff = new DataStore(this.node_id);
        dataStoreDiff.items = diffItems;
        let logMessage = 'DataStore diff has ' + Object.keys(dataStoreDiff.items).length + ' items for ' + nodeId;
        internode_1.InterNode.log(logMessage);
        return dataStoreDiff;
    }
    receiveSync(parsedSyncData) {
        let remoteItems = parsedSyncData.items;
        let itemCount = Object.keys(remoteItems).length;
        if (itemCount) {
            internode_1.InterNode.log('Receiving ' + itemCount + ' items');
        }
        else {
            internode_1.InterNode.log('No items Received');
        }
        for (let remoteItemKey in remoteItems) {
            if (!remoteItems.hasOwnProperty(remoteItemKey))
                continue;
            let remoteItem = remoteItems[remoteItemKey];
            //get rid of corrupted items that don't have data in them
            if (!remoteItem.value)
                continue;
            let localItem = this.items[remoteItemKey];
            // let itemLog = 'from ' + parsedSyncData.node_id + ' : ' + remoteItemKey + ' NewItem: ' + JSON.stringify(remoteItem) + ' OldItem: ' + JSON.stringify(localItem);
            if (!localItem) {
                localItem = new Item();
                // InterNode.log('Adding item ' + itemLog);
            }
            if (!localItem.time || remoteItem.time > localItem.time) {
                // InterNode.log('Updating item ' + itemLog);
                localItem.time = remoteItem.time;
                localItem.value = remoteItem.value;
                localItem.expire = remoteItem.expire;
            }
            /*else {
             InterNode.log('Just Noting item synced nodes ' + itemLog);
             }*/
            let nodeSet = new Set(remoteItem.synced_nodes);
            nodeSet.add(internode_1.InterNode.nodeID);
            localItem.synced_nodes = Array.from(nodeSet);
            this.items[remoteItemKey] = localItem;
        }
    }
}
DataStore.ITEMS_TO_SYNC_EACH_TIME = 100;
exports.DataStore = DataStore;
//for serialization
class Item {
}
exports.Item = Item;
//# sourceMappingURL=datastore.js.map