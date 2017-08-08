import {InterNode} from "./internode";

/**
 * Created by oded on 6/5/17.
 */

//for serialization
export class DataStore {
    node_id: string;
    items: any;
    private static ITEMS_TO_SYNC_EACH_TIME = 100;

    //Where did each sync stop when trying to send data to each node
    //This is to make sure that nodes have all the items before they update an old item
    private nodeSyncIndex: Map<string, number>;

    constructor(nodeID: string) {
        this.items = {};
        this.node_id = nodeID;
        this.nodeSyncIndex = new Map();
    }

    itemCount() {
        return Object.keys(this.items).length;
    }

    set(key: string, value: any, expire: number): void {
        let item = new Item();
        item.value = value;
        item.time = Date.now();
        if (!item.synced_nodes) {
            item.synced_nodes = [];
        } else {
            item.synced_nodes.length = 0;
        }
        item.synced_nodes.push(this.node_id);

        if (expire) {
            item.expire = Date.now() + expire;
        }

        this.items[key] = item;
    }

    get(key: string): any {
        let item = this.items[key];
        if (!item) return null;
        return item.value;
    }

    aggregate(key: string, value: number, expire: number): void {
        let aggregateKey = this.aggregateKey(key);
        let oldItem: Item = this.items[aggregateKey];
        let newValue: number;
        if (oldItem) {
            newValue = parseFloat(oldItem.value) + value;
        } else {
            newValue = value;
        }
        this.set(aggregateKey, newValue, expire)
    }

    private aggregateKey(key: string): string {
        return this.aggregateKeyPrefix(key) + this.node_id;
    }


    private aggregateKeyPrefix(key: string): string {
        return key + '::';
    }

    getAggregated(key: string): number {
        let aggregatedItemValue: number = 0;
        let shardsMessage = '';
        for (let itemKey in this.items) {
            if (!this.items.hasOwnProperty(itemKey)) continue;

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
            InterNode.log(logMessage);
        }
        return aggregatedItemValue;
    }

    getDataStoreDiff(nodeId: string): any {
        let diffItems: any = {};
        let diffItemCount = 0;
        let itemIndex = 0;


        //reset the index if we're done with all of the items
        if (this.nodeSyncIndex.get(nodeId) >= this.itemCount()) {
            this.nodeSyncIndex.set(nodeId, 0);
        }

        for (let key in this.items) {
            if (!this.items.hasOwnProperty(key)) continue;

            if (this.nodeSyncIndex.get(nodeId) && itemIndex < this.nodeSyncIndex.get(nodeId)) {
                //if this index location was already synced to that domain, skip it
                itemIndex++;
                continue;
            } else {
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
        InterNode.log(logMessage);
        return dataStoreDiff;
    }

    receiveSync(parsedSyncData: DataStore) {

        let remoteItems = parsedSyncData.items;

        let itemCount = Object.keys(remoteItems).length;
        if (itemCount) {
            InterNode.log('Receiving ' + itemCount + ' items');
        } else {
            InterNode.log('No items Received');
        }

        for (let remoteItemKey in remoteItems) {
            if (!remoteItems.hasOwnProperty(remoteItemKey)) continue;

            let remoteItem = remoteItems[remoteItemKey];

            //get rid of corrupted items that don't have data in them
            if (!remoteItem.value) continue;

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
            nodeSet.add(InterNode.nodeID);
            localItem.synced_nodes = Array.from(nodeSet);
            this.items[remoteItemKey] = localItem;
        }
    }
}

//for serialization
export class Item {
    synced_nodes: string[];
    time: number;
    value: any;
    expire: number;
}