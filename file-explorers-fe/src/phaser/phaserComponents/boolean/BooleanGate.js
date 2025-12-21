import { Node } from '../../logic/node.js';

export default class BooleanGate {
    constructor(type, id, inputCount = 2) {
        this.type = type; // 'and','or','not', etc
        this.id = id;
        this.inputs = [];
        this.output = null;

        // create placeholder nodes; positions will be set by scene when placing
        const inCount = type === 'not' ? 1 : inputCount;
        for (let i = 0; i < inCount; i++) {
            const n = new Node(`${id}_in${i}`, 0, 0);
            n.setup(this);
            this.inputs.push(n);
        }
        this.output = new Node(`${id}_out`, 0, 0);
        this.output.setup(this);
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
        // Read current input bit values
        const vals = this.inputs.map((n) => n.bit_value || 0);
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
}
