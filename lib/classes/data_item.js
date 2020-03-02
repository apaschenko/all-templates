/**
 * Lib "all-templates"
 * DataItem: a class for the representing of a single data node.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';


class DataItem {
    constructor(name, parent, dataPoint, node) {
        this.name      = name;
        this.parent    = parent;
        this.dataPoint = dataPoint;
        this.node      = node;
        return this;
    }

    getParent() {
        return this.parent;
    }

    getName() {
        return this.name;
    }

    getDataPoint() {
        return this.dataPoint;
    }

    getNode() {
        return this.node;
    }

}


module.exports = DataItem;
