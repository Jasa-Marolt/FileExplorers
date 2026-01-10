import { Node } from '../../logic/node.js';
import { ComponentDirection } from '../ComponentDirection.js';

export default class BooleanGate {
    constructor(type, id, inputCount = 2) {
        this.type = type; // 'and','or','not', etc
        this.id = id;
        this.inputs = [];
        this.output = null;
        this.direction = ComponentDirection.HORIZONTAL; // Boolean gates use horizontal layout (inputs left, output right)

        // create placeholder nodes; positions will be set by scene when placing
        let inCount = inputCount;
        if (type === 'not') {
            inCount = 1;
        } else if (type === 'switch-on' || type === 'switch-off' || (typeof type === 'string' && type.startsWith('switch'))) {
            inCount = 0; // switches have no inputs
        }
        
        for (let i = 0; i < inCount; i++) {
            const n = new Node(`${id}_in${i}`, 0, 0);
            n.setup(this);
            this.inputs.push(n);
        }
        this.output = new Node(`${id}_out`, 0, 0);
        this.output.setup(this);
        
        // For switches, set initial value based on type
        if (type === 'switch-on' || type === 'switch-off' || (typeof type === 'string' && type.startsWith('switch'))) {
            // Normalize the type to just 'switch' since we'll track state via output value
            this.type = 'switch';
            this.output.setBit(type === 'switch-on' ? 1 : 0);
        } else {
            // For all non-switch components, perform initial evaluation
            // This ensures the output is calculated when first placed
            const initialOutput = this.evaluate();
            this.output.setBit(initialOutput);
        }
    }

    onNodeValueChanged(node) 
    {
        // When an input changes, evaluate and update output
        if (this.inputs.includes(node)) {
            const newOut = this.evaluate();
            if (this.output.bit_value !== newOut) {
                this.output.setBit(newOut);
            }
        } else if (node === this.output) {
            // output changed externally (wired into other components); nothing to do
        }
    }

    evaluate() {
        // Switches don't need to evaluate based on inputs - they maintain their own state
        if (this.type === 'switch' || this.type === 'switch-on' || this.type === 'switch-off' || (typeof this.type === 'string' && this.type.startsWith('switch'))) {
            return this.output.bit_value || 0;
        }
        
        // Read current input bit values - treat unconnected inputs as 0
        const vals = this.inputs.map((n) => {
            // If node has no wire connection, treat as 0 (off)
            if (!n.wire) return 0;
            return n.bit_value || 0;
        });
        let out = 0;
        switch (this.type) {
            case 'and':
                out = vals.every((v) => v === 1) ? 1 : 0;
                break;
            case 'or':
                out = vals.some((v) => v === 1) ? 1 : 0;
                break;
            case 'not':
                out = (vals[0] || 0) ? 0 : 1;
                break;
            case 'xor':
                out = vals.reduce((a, b) => (a ^ b), 0);
                break;
            case 'nand':
                out = vals.every((v) => v === 1) ? 0 : 1;
                break;
            case 'nor':
                out = vals.some((v) => v === 1) ? 0 : 1;
                break;
            case 'nxor':
                out = vals.reduce((a, b) => (a ^ b), 0) ? 0 : 1;
                break;
            default:
                out = 0;
        }
        return out;
    }
    
    toggle() {
        // Only works for switches
        if (this.type === 'switch' || this.type === 'switch-on' || this.type === 'switch-off' || (typeof this.type === 'string' && this.type.startsWith('switch'))) {
            const newVal = this.output.bit_value ? 0 : 1;
            this.output.setBit(newVal);
            return newVal;
        }
        return this.output.bit_value || 0;
    }
}
