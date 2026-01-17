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

        // Update visual appearance if circle exists
        this.updateVisualState();

        // propagate over wire
        if (this.wire && this.wire.nodes) {
            for (const n of this.wire.nodes) {
                if (n !== this && n.bit_value !== intVal) {
                    n.bit_value = intVal;
                    // Update visual state for other nodes too
                    n.updateVisualState();
                    if (n.component && typeof n.component.onNodeValueChanged === 'function') {
                        try { n.component.onNodeValueChanged(n); } catch (e) {}
                    }
                }
            }
            // Redraw wire with new colors
            this.wire.draw();
        }

        // notify owning component
        if (this.component && typeof this.component.onNodeValueChanged === 'function') {
            try {
                this.component.onNodeValueChanged(this);
            } catch (e) {}
        }
    }

    /**
     * Update the visual state of the node circle based on bit_value
     */
    updateVisualState() {
        if (this._circle) {
            const activeColor = 0x005500;   // Green for active (1)
            const inactiveColor = 0x101010; // Gray for inactive (0)
            this._circle.setFillStyle(this.bit_value ? activeColor : inactiveColor);
        }
    }
}

export { Node };
