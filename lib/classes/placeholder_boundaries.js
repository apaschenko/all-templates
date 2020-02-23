/**
 * Lib "all-templates"
 * PlaceholderBoundaries: a class for the saving placeholder begin and end positions.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const { cutWithEllipsis } = require('../utils/general');

class PlaceholderBoundaries {
    constructor(parser, position) {
        this.parser  = parser;
        this.phStart = position;
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

    printPlaceholder() {
        const { placeholder: { open, close }, printError: { maxPhLength, leftTailLength, rightTailLength } }
            = this.parser.getRenderData().options;
        const layer = this.parser.getLayer();
        const layerName = this.parser.getLayerName();
        const correctedPhEnd = this.phEnd || layer.length;

        let result = `["${layerName}": ${this.phStart}...${correctedPhEnd - 1}] `
            + cutWithEllipsis(layer, 0, this.phStart - open.length, leftTailLength, false)
            + open
            + cutWithEllipsis(layer, this.phStart, correctedPhEnd, maxPhLength, true)
            + close
            + cutWithEllipsis(layer, correctedPhEnd, layer.length, rightTailLength, true);

        return result;
    }
}


module.exports = PlaceholderBoundaries;
