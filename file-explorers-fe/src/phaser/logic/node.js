class Node {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.initX = x;
        this.initY = y;
        this.connected = new Set();
        this.bit_value = 0;
        this.wire = null;
        this.component = null;
    }
    setup(component) {
        this.component = component;
    }
    move() {
        if (this.wire) this.wire.draw();
    }
    destroyNode() {
        if (this.wire) this.wire.removeNode(this);
    }

    /**
     * Set the logical bit value for this node and propagate over the connected wire.
     * Also notifies the owning component so it can react to input changes.
     */
    setBit(value) {
        const intVal = value ? 1 : 0;
        if (this.bit_value === intVal) return;
        this.bit_value = intVal;

        // propagate over wire
        if (this.wire && this.wire.nodes) {
            for (const n of this.wire.nodes) {
                if (n !== this && n.bit_value !== intVal) {
                    n.bit_value = intVal;
                    // update circle colour if present
                    if (n._circle) n._circle.setFillStyle(intVal ? 0x00ff00 : 0xff0000);
                    if (n.component && typeof n.component.onNodeValueChanged === 'function') {
                        try { n.component.onNodeValueChanged(n); } catch (e) {}
                    }
                }
            }
        }

        // update own circle colour
        if (this._circle) this._circle.setFillStyle(intVal ? 0x00ff00 : 0xff0000);

        // notify owning component
        if (this.component && typeof this.component.onNodeValueChanged === 'function') {
            try {
                this.component.onNodeValueChanged(this);
            } catch (e) {}
        }
    }
}

export { Node };
