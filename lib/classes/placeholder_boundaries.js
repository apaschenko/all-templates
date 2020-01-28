/**
 * Lib "all-templates"
 * PlaceholderBoundaries: a class for the saving placeholder begin and end positions.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';


class PlaceholderBoundaries {
    constructor(position, renderData, layer) {
        this.phStart    = position;
        this.renderData = renderData;
        this.layer      = layer;
        return this;
    }

    setPhEnd(position) {
        this.phEnd = position;
    }

    getBoundaries() {
        return {
            start: this.phStart,
            end  : this.phEnd
        };
    }

    getPlaceholder() {
        const { placeholder: {close}, printError: {maxPhLength} } = this.renderData.options;
        let result = `[pos. in the layer: ${this.phStart}] `;
        if (this.phEnd && (this.phEnd - this.phStart) <= maxPhLength) {
            result += this.layer.substring(this.phStart, this.phEnd + 1);
        } else {
            result += `${this.layer.substring(this.phStart, this.phStart + maxPhLength + 1)} ... ${close}`;
        }
        return result;
    }
}


module.exports = PlaceholderBoundaries;
