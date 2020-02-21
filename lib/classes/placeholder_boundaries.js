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
        const { placeholder: { open, close }, printError: { maxPhLength, leftTailLength, rightTailLength } }
            = this.renderData.options;

        const lastIndex = this.layer.length - 1;
        let result = `[pos: ${this.phStart}...${this.phEnd || (this.layer.length - 1)}] `;

        const leftTailPresents = leftTailLength ? (this.phStart > 0) : false;
        const phDelimitersLength = open.length + close.length;
        const phLength = Math.max((maxPhLength || 1) - phDelimitersLength, phDelimitersLength + 1);

        const endRightTail  = rightTailLength ? Math.min(this.phEnd + rightTailLength, this.layer.length) : null;

        //(startLeftTail > 0) ? '\u2026' : '';

        if (leftTailPresents) {
            const leftTailStartedAt = Math.max(this.phStart - leftTailLength, 0);
            result += (leftTailStartedAt > 0)
                ? '\u2026' + this.layer.substring(leftTailStartedAt + 1, this.phStart)
                : this.layer.substring(leftTailStartedAt, this.phStart);
        }

        if (this.phEnd && (this.phEnd - this.phStart) <= maxPhLength) {
            result += this.layer.substring(this.phStart, this.phEnd + 1);
        } else {
            result += `${this.layer.substring(this.phStart, this.phStart + maxPhLength + 1)} ... ${close}`;
        }
        return result;
    }
}


module.exports = PlaceholderBoundaries;
