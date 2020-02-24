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


    printPlaceholder() {
        const {
            placeholder: { open, close },
            printError: { maxPhLength, leftTailLength, rightTailLength, placeholder: { before, after } }
        } = this.parser.getRenderData().options;
        const layer = this.parser.getLayer();
        const layerName = this.parser.getLayerName();
        const correctedPhEnd = this.phEnd || layer.length;
        //const rightTailEnd =

        let result = `["${layerName}": ${this.phStart}...${correctedPhEnd - 1}] `
            + cutWithEllipsis(layer, 0, this.phStart - open.length, leftTailLength, false)
            + before + open
            + cutWithEllipsis(layer, this.phStart, correctedPhEnd, maxPhLength, true)
            + (this.phEnd
                 ? (
                   + close
                        + after
                        + cutWithEllipsis(layer, correctedPhEnd + close.length, layer.length, rightTailLength, true)
                )
                : after);

        return result;
    }
}


module.exports = PlaceholderBoundaries;
