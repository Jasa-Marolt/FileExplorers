class CircuitSim {
    constructor() {
        this.source;
        this.tree = [];
        this.paths = [];
        this.activePaths = [];
        this.running_sim = false;
        this.nodeValues = [];
        this.equationList = [];
        this.negativeVoltage = false;
        this.autoRecalculate = true;
        this.recalculateInterval = null;
        this.lastComponentState = null;
    }

    findSource() {
        this.source = window.components.find(c => c.type === 'battery' && !c.componentObject.getData('isInPanel'));
        return this.source;
    }

    generate_tree() {   
        this.findSource();
        this.tree = [];
        
        if (!this.source) {
            return;
        }
        
        // Validate battery wiring: must have wires on opposite poles
        if (!this.validateBatteryWiring()) {
            console.error('Battery wiring error: wires must be connected to opposite poles (start and end nodes)');
            return;
        }
        
        const allPaths = [];
        this.collectAllPaths(this.source, this.source.end, new Set(), [this.source.id], allPaths);
        
        if (allPaths.length > 0) {
            this.paths = allPaths;
            // Check for negative voltage and reverse paths if needed
            this.checkNegativeVoltage();
        }
    }
    
    validateBatteryWiring() {
        if (!this.source) return false;
        
        const startHasWire = this.source.start.wire !== null && this.source.start.wire !== undefined;
        const endHasWire = this.source.end.wire !== null && this.source.end.wire !== undefined;
        
        // Check if both poles have wires
        if (!startHasWire || !endHasWire) {
            console.warn('Battery must have wires on both poles');
            return false;
        }
        
        // Check if wires are different (not the same wire)
        if (this.source.start.wire === this.source.end.wire) {
            console.warn('Battery poles cannot be connected by the same wire');
            return false;
        }
        
        return true;
    }
    
    collectAllPaths(currentComponent, currentNode, visited, path, allPaths) {
        visited.add(currentComponent.id);
        
        const nextNode = currentNode === currentComponent.start ? currentComponent.end : currentComponent.start;
        const adjacentComponents = this.getAdjacentComponents(nextNode, currentComponent);
        
        const batteryInAdjacent = adjacentComponents.find(comp => comp.id === this.source.id);
        
        if (batteryInAdjacent && currentComponent.id !== this.source.id) {
            const startingNode = this.source.start;
            const returningNode = nextNode;
            
            let batteryReturnNode = null;
            if (this.source.start.wire && returningNode.wire === this.source.start.wire) {
                batteryReturnNode = this.source.start;
            } else if (this.source.end.wire && returningNode.wire === this.source.end.wire) {
                batteryReturnNode = this.source.end;
            }
            
            if (batteryReturnNode !== startingNode) {
                allPaths.push([...path, this.source.id]);
            }
            
            visited.delete(currentComponent.id);
            return;
        }
        
        const unvisitedComponents = adjacentComponents.filter(comp => !visited.has(comp.id));
        
        for (const nextComponent of unvisitedComponents) {
            let nextComponentNode;
            if (nextNode.wire && nextComponent.start.wire === nextNode.wire) {
                nextComponentNode = nextComponent.start;
            } else if (nextNode.wire && nextComponent.end.wire === nextNode.wire) {
                nextComponentNode = nextComponent.end;
            } else {
                nextComponentNode = (nextComponent.start === nextNode || 
                    (nextComponent.start.x === nextNode.x && nextComponent.start.y === nextNode.y)) 
                                    ? nextComponent.start : nextComponent.end;
            }
            
            path.push(nextComponent.id);
            this.collectAllPaths(nextComponent, nextComponentNode, visited, path, allPaths);
            path.pop();
        }
        
        visited.delete(currentComponent.id);
    }
    
    getAdjacentComponents(node, excludeComponent) {
        if (!node.wire) {
            return [];
        }
        
        const adjacentComponents = [];
        
        for (const wireNode of node.wire.nodes) {
            if (wireNode.component) {
                if (wireNode.component.id !== excludeComponent.id) {
                    if (wireNode === wireNode.component.start || wireNode === wireNode.component.end) {
                        if (!adjacentComponents.find(c => c.id === wireNode.component.id)) {
                            adjacentComponents.push(wireNode.component);
                        }
                    }
                }
            }
        }
        
        return adjacentComponents;
    }

    init() {
        this.generate_tree();
        this.run_tick();
        
        // Start auto-recalculation if enabled
        if (this.autoRecalculate) {
            this.startAutoRecalculate();
        }
    }

    startAutoRecalculate(interval = 100) {
        // Stop any existing interval
        this.stopAutoRecalculate();
        
        console.log(`🔄 Starting auto-recalculation (every ${interval}ms)`);
        
        this.recalculateInterval = setInterval(() => {
            if (this.hasCircuitChanged()) {
                console.log('🔄 Circuit changed, recalculating...');
                this.generate_tree();
                this.run_tick();
            }
        }, interval);
    }

    stopAutoRecalculate() {
        if (this.recalculateInterval) {
            console.log('⏹ Stopping auto-recalculation');
            clearInterval(this.recalculateInterval);
            this.recalculateInterval = null;
        }
    }

    hasCircuitChanged() {
        // Check if components or their values have changed
        if (!window.components) return false;
        
        const currentState = JSON.stringify(window.components.map(c => ({
            id: c.id,
            type: c.type,
            values: c.values,
            is_on: c.is_on
        })));
        
        if (this.lastComponentState === null) {
            this.lastComponentState = currentState;
            return false;
        }
        
        if (currentState !== this.lastComponentState) {
            this.lastComponentState = currentState;
            return true;
        }
        
        return false;
    }

    recalculate() {
        console.log('🔄 Manual recalculation triggered');
        this.generate_tree();
        this.run_tick();
    }

    // Debounced recalculation to avoid too frequent updates
    scheduleRecalculation() {
        if (this._recalculateTimeout) {
            clearTimeout(this._recalculateTimeout);
        }
        
        this._recalculateTimeout = setTimeout(() => {
            this.recalculate();
            this._recalculateTimeout = null;
        }, 50); // 50ms debounce
    }

    // Method to be called when a component value changes
    onComponentValueChanged(componentId, property, value) {
        console.log(`📝 Component ${componentId}.${property} changed to ${value}`);
        this.scheduleRecalculation();
    }

    pickActivePaths() {
        this.activePaths = [];
        
        for (const path of this.paths) {
            let isActive = true;
            
            // Skip first (battery) - check only middle components
            for (let i = 1; i < path.length - 1; i++) {
                const componentId = path[i];
                const component = window.components.find(c => c.id === componentId);
                
                if (!component) {
                    isActive = false;
                    break;
                }
                
                // Check if there's an open switch in the path
                if (component.type === 'switch' && !component.is_on) {
                    isActive = false;
                    break;
                }
                
                const directionalTypes = ['battery', 'ampermeter', 'voltmeter', 'diode', 'led', 'bulb'];
                if (directionalTypes.includes(component.type)) {
                    const prevComponentId = path[i - 1];
                    const prevComponent = window.components.find(c => c.id === prevComponentId);
                    if (!directionalTypes.includes(prevComponent.type)) {break;}
                    // Check which node is shared between previous component and current component
                    let enteredFromStart = false;

                    if (prevComponent.type === 'battery') {
                        if (!this.negativeVoltage && prevComponent.start.wire && component.start.wire === prevComponent.start.wire) {
                            enteredFromStart = true;
                        } else if (this.negativeVoltage && prevComponent.end.wire && component.start.wire === prevComponent.end.wire) {
                            enteredFromStart = true;
                        }
                    } else if ((prevComponent.start.wire && component.start.wire === prevComponent.start.wire) || (prevComponent.end.wire && component.start.wire === prevComponent.end.wire)) {    
                        enteredFromStart = true;
                    }
                    
                    // If we entered from end node, current flows backwards - component blocks
                    if (!enteredFromStart) {
                        isActive = false;
                        break;
                    }
                }
            }
            
            if (isActive) {
                this.activePaths.push(path);
            }
        }
        
        return this.activePaths;
    }

    run_sim() {
        while (this.running_sim) {
            this.run_tick();
        }
    }

    checkNegativeVoltage() {
        if (!this.source || !this.source.values || this.source.values.voltage === undefined) {
            this.negativeVoltage = false;
            return false;
        }
        
        const batteryVoltage = typeof this.source.values.voltage === 'object' 
            ? this.source.values.voltage.value 
            : this.source.values.voltage;
        
        if (batteryVoltage < 0) {
            this.negativeVoltage = true;
            console.log('⚠ Battery voltage is negative, paths will be reversed');
            // Reverse all paths
            this.paths = this.paths.map(path => [...path].reverse());
            return true;
        }
        
        this.negativeVoltage = false;
        return false;
    }

    run_tick() {
        this.pickActivePaths();
        this.createTreeFromPaths();
        console.log(this.getTreeString());

        // Prefer deterministic resistive solving when possible.
        // Falls back to the equation-pool solver for puzzles with unknown resistances/values.
        const solvedByReduction = this.solveResistiveByTreeReduction();

        if (!solvedByReduction) {
            this.extractValues();
            console.log(this.getValuesSummary());
            this.poolEquations();
            this.solvePool();
        }

        this.updateComponents();
        console.log(this.getValuesSummary());
    }

    // -------------------------
    // Deterministic tree solver
    // -------------------------
    // Uses the already-built series/parallel tree structure to compute currents/voltages
    // for purely resistive networks. This avoids relying on battery "current" settings.
    solveResistiveByTreeReduction() {
        try {
            this.findSource();
            if (!this.source || !this.tree || this.tree.length === 0) return false;

            const vSourceRaw = (typeof this.source.values?.voltage === 'object' && this.source.values.voltage !== null)
                ? this.source.values.voltage.value
                : this.source.values?.voltage;

            if (typeof vSourceRaw !== 'number' || !isFinite(vSourceRaw)) return false;

            // Use magnitude for the solve; sign is handled when writing back.
            const vSource = Math.abs(vSourceRaw);
            if (vSource === 0) return false;

            const loadTree = this.stripSourceFromTree(this.tree);
            if (!loadTree || (Array.isArray(loadTree) && loadTree.length === 0)) return false;

            const rEq = this.computeEquivalentResistance(loadTree, 'series');
            if (typeof rEq !== 'number' || !isFinite(rEq) || rEq <= 0) return false;

            const iTotal = vSource / rEq;
            if (!isFinite(iTotal)) return false;

            const results = new Map();
            // Propagate through load (everything except the source itself)
            this.propagateSolve(loadTree, 'series', { voltage: vSource, current: iTotal }, results);

            // Build nodeValues in the same shape updateComponents expects.
            const values = [];

            // Battery entry
            values.push({
                id: this.source.id,
                name: this.source.values?.name || 'Battery',
                type: 'battery',
                voltage: vSource,
                current: iTotal,
                power: vSource * iTotal,
                resistance: rEq,
            });

            // All computed components
            for (const [id, solved] of results.entries()) {
                const component = window.components.find(c => c.id === id);
                if (!component || component.type === 'battery') continue;

                const r = this.getComponentResistance(component);
                const v = solved.voltage;
                const i = solved.current;
                values.push({
                    id,
                    name: component.values?.name || id,
                    type: component.type,
                    resistance: isFinite(r) ? r : undefined,
                    voltage: isFinite(v) ? v : undefined,
                    current: isFinite(i) ? i : undefined,
                    power: (isFinite(v) && isFinite(i)) ? v * i : undefined,
                });
            }

            this.nodeValues = values;
            return true;
        } catch (e) {
            console.warn('Resistive solve failed; falling back to equation solver.', e);
            return false;
        }
    }

    stripSourceFromTree(tree) {
        if (!tree) return tree;
        const sourceId = this.source?.id;
        const strip = (node) => {
            if (Array.isArray(node)) {
                const out = [];
                for (const item of node) {
                    const stripped = strip(item);
                    if (stripped === null) continue;
                    if (Array.isArray(stripped) && stripped.length === 0) continue;
                    out.push(stripped);
                }
                return out;
            }
            if (typeof node === 'string') {
                if (sourceId && node === sourceId) return null;
                return node;
            }
            return null;
        };
        return strip(tree);
    }

    getComponentResistance(component) {
        if (!component) return Infinity;

        // Types with near-zero resistance
        const nearZero = new Set(['wire', 'ampermeter']);
        if (nearZero.has(component.type)) return 1e-6;

        // Voltmeter is (almost) open circuit
        if (component.type === 'voltmeter') return 1e9;

        // Closed switch behaves like a wire; open switches are filtered out in activePaths.
        if (component.type === 'switch') {
            return component.is_on ? 1e-6 : Infinity;
        }

        // Prefer explicit numeric fields (used by import/export compatibility)
        if (typeof component.resistance === 'number' && isFinite(component.resistance) && component.resistance > 0) {
            return component.resistance;
        }

        // Resistor component historically uses `ohm`
        if (typeof component.ohm === 'number' && isFinite(component.ohm) && component.ohm > 0) {
            return component.ohm;
        }

        // Prefer values.resistance.value
        const vr = component.values?.resistance;
        if (vr && typeof vr === 'object' && typeof vr.value === 'number' && isFinite(vr.value) && vr.value > 0) {
            return vr.value;
        }
        if (typeof vr === 'number' && isFinite(vr) && vr > 0) {
            return vr;
        }

        // Default: unknown
        return Infinity;
    }

    computeEquivalentResistance(node, connectionType) {
        if (node === null || node === undefined) return Infinity;

        // Leaf component
        if (typeof node === 'string') {
            const component = window.components.find(c => c.id === node);
            if (!component || component.type === 'battery') return 0;
            return this.getComponentResistance(component);
        }

        if (!Array.isArray(node)) return Infinity;

        const childType = (connectionType === 'series') ? 'parallel' : 'series';

        if (connectionType === 'series') {
            let sum = 0;
            for (const item of node) {
                const r = this.computeEquivalentResistance(item, Array.isArray(item) ? childType : connectionType);
                if (!isFinite(r)) return Infinity;
                sum += r;
            }
            return sum;
        }

        // parallel
        let invSum = 0;
        let hasFinite = false;
        for (const branch of node) {
            const r = this.computeEquivalentResistance(branch, Array.isArray(branch) ? childType : connectionType);
            if (r === 0) {
                // Short in parallel -> equivalent is short
                return 0;
            }
            if (isFinite(r) && r > 0) {
                invSum += 1 / r;
                hasFinite = true;
            }
        }
        if (!hasFinite || invSum === 0) return Infinity;
        return 1 / invSum;
    }

    propagateSolve(node, connectionType, given, results) {
        if (node === null || node === undefined) return;

        // Leaf component
        if (typeof node === 'string') {
            const component = window.components.find(c => c.id === node);
            if (!component || component.type === 'battery') return;
            results.set(node, { voltage: given.voltage, current: given.current });
            return;
        }

        if (!Array.isArray(node)) return;

        const childType = (connectionType === 'series') ? 'parallel' : 'series';

        if (connectionType === 'series') {
            // Same current through all series elements.
            for (const item of node) {
                const rItem = this.computeEquivalentResistance(item, Array.isArray(item) ? childType : connectionType);
                const vItem = isFinite(rItem) ? given.current * rItem : 0;
                this.propagateSolve(item, Array.isArray(item) ? childType : connectionType, { voltage: vItem, current: given.current }, results);
            }
            return;
        }

        // parallel: same voltage across all branches, current splits
        for (const branch of node) {
            const rBranch = this.computeEquivalentResistance(branch, Array.isArray(branch) ? childType : connectionType);
            const iBranch = (isFinite(rBranch) && rBranch > 0) ? (given.voltage / rBranch) : 0;
            this.propagateSolve(branch, Array.isArray(branch) ? childType : connectionType, { voltage: given.voltage, current: iBranch }, results);
        }
    }

    // Extract values from all components in the tree
    extractValues(tree = this.tree) {
        const values = [];
        
        // Check if tree is empty or undefined
        if (!tree || (Array.isArray(tree) && tree.length === 0)) {
            return values;
        }
        
        const extractFromItem = (item) => {
            if (Array.isArray(item)) {
                // Recursively extract from array items
                item.forEach(subItem => extractFromItem(subItem));
            } else if (typeof item === 'string') {
                // It's a component ID
                const component = window.components.find(c => c.id === item);
                if (component && component.values && component.type != "battery") {
                    const componentValues = {
                        id: component.id,
                        name: component.values.name,
                        type: component.type,
                        resistance: this.extractValue(component.values.resistance),
                        voltage: this.extractValue(component.values.voltageDrop || component.values.voltage),
                        current: this.extractValue(component.values.current),
                        power: this.extractValue(component.values.power)
                    };
                    values.push(componentValues);
                } else if (component && component.type == "battery") {
                   const componentValues = {
                        id: component.id,
                        name: component.values.name,
                        type: component.type,
                        voltage: Math.abs(this.extractValue(component.values.voltageDrop || component.values.voltage)),
                        // Battery current/power should be derived from the solved circuit.
                        // Using component-stored values here makes the solver over-constrained
                        // (and often wrong), especially for AC sources.
                        current: undefined,
                        power: undefined
                    }; 
                    values.push(componentValues);
                }
            }
        };
        
        extractFromItem(tree);
        this.nodeValues = values;
        return values;
    }

    // Helper to extract value from both direct values and value objects
    extractValue(value) {
        if (value === undefined) {
            return undefined;
        }
        if (typeof value === 'object' && 'value' in value) {
            // If it's a value object with automatic flag, check if it's automatic
            if (value.automatic === true) {
                return undefined; // Treat automatic values as undefined (need to be calculated)
            }
            return value.value;
        }
        return value;
    }

    // List all undefined variables (resistance, voltage, current) in the tree
    listUndefinedVariables(tree = this.tree) {
        const values = this.extractValues(tree);
        const undefined_vars = [];

        values.forEach(comp => {
            
            if (comp.resistance === undefined) {
                undefined_vars.push(comp.id + "."+'resistance');
            }
            if (comp.voltage === undefined) {
                undefined_vars.push(comp.id + "."+'voltage');
            }
            if (comp.current === undefined) {
                undefined_vars.push(comp.id + "."+'current');
            }
            if (comp.power === undefined) {
                undefined_vars.push(comp.id + "."+'power');
            }
        });

        return undefined_vars;
    }

    getValuesSummary() {
        const values = this.nodeValues;
        
        if (!values || values.length === 0) {
            return '(no components)';
        }
        
        return values.map(v => {
            const r = v.resistance !== undefined ? `${v.resistance}Ω` : 'undefined';
            const volt = v.voltage !== undefined ? `${v.voltage}V` : 'undefined';
            const i = v.current !== undefined ? `${v.current}A` : 'undefined';
            const p = v.power !== undefined ? `${v.power}W` : 'undefined';
            return `${v.name} (${v.type}): R=${r}, V=${volt}, I=${i}, P=${p}`;
        }).join('\n');
    }

    getTreeString(tree = this.tree) {
        if (!tree) return '(empty)';
        
        if (Array.isArray(tree)) {
            const items = tree.map(item => {
                if (Array.isArray(item)) {
                    return `[${this.getTreeString(item)}]`;
                } else {
                    const component = window.components.find(c => c.id === item);
                    const type = component ? component.values.name : '???';
                    return `${type}`;
                }
            });
            return items.join(', ');
        } else {
            const component = window.components.find(c => c.id === tree);
            const type = component ? component.values.name : '???';
            return type;
        }
    }

    createTreeFromPaths() {
        if (this.activePaths.length === 0) {
            return [];
        }
        
        if (this.activePaths.length === 1) {
            this.tree = this.activePaths[0];
            return this.tree;
        }
        
        // Find the common prefix and suffix of all paths
        const paths = this.activePaths;
        
        // Find common prefix
        let prefixLength = 0;
        while (prefixLength < paths[0].length) {
            const componentId = paths[0][prefixLength];
            if (paths.every(path => path[prefixLength] === componentId)) {
                prefixLength++;
            } else {
                break;
            }
        }
        
        // Find common suffix
        let suffixLength = 0;
        while (suffixLength < paths[0].length - prefixLength) {
            const componentId = paths[0][paths[0].length - 1 - suffixLength];
            if (paths.every(path => path[path.length - 1 - suffixLength] === componentId)) {
                suffixLength++;
            } else {
                break;
            }
        }
        
        // Extract common prefix
        const prefix = paths[0].slice(0, prefixLength);
        
        // Extract common suffix
        const suffix = paths[0].slice(paths[0].length - suffixLength);
        
        // Extract middle parts (the parallel sections)
        const middles = paths.map(path => 
            path.slice(prefixLength, path.length - suffixLength)
        );
        
        // Recursively process middle sections if they have further branches
        const processedMiddles = this.mergeSimilarPaths(middles);
        
        // Build the final tree
        this.tree = [...prefix, processedMiddles, ...suffix];
        
        return this.tree;
    }
    
    mergeSimilarPaths(paths) {
        if (paths.length === 1) {
            return paths[0];
        }
        
        // Check if all paths are single components (no further branching)
        if (paths.every(path => path.length === 1)) {
            return paths.map(path => path[0]);
        }
        
        // Find common prefix in these paths
        let prefixLength = 0;
        while (prefixLength < paths[0].length) {
            const componentId = paths[0][prefixLength];
            if (paths.every(path => path[prefixLength] === componentId)) {
                prefixLength++;
            } else {
                break;
            }
        }
        
        // Find common suffix
        let suffixLength = 0;
        while (suffixLength < paths[0].length - prefixLength) {
            const componentId = paths[0][paths[0].length - 1 - suffixLength];
            if (paths.every(path => path[path.length - 1 - suffixLength] === componentId)) {
                suffixLength++;
            } else {
                break;
            }
        }
        
        if (prefixLength === 0 && suffixLength === 0) {
            // No common parts, these are truly parallel
            return paths.map(path => path.length === 1 ? path[0] : path);
        }
        
        // Extract parts
        const prefix = paths[0].slice(0, prefixLength);
        const suffix = paths[0].slice(paths[0].length - suffixLength);
        const middles = paths.map(path => 
            path.slice(prefixLength, path.length - suffixLength)
        );
        
        // Recursively process middles
        const processedMiddles = this.mergeSimilarPaths(middles);
        
        return [...prefix, processedMiddles, ...suffix];
    }

    poolEquations() {
        this.equationList = [];
        const undefinedVars = this.listUndefinedVariables();
        console.log('Undefined variables:', undefinedVars);
        
        // Generate equations for each component based on Ohm's law and power equations
        this.nodeValues.forEach(comp => {
            const prefix = `${comp.id}`;
            
            // For non-battery components, generate Ohm's law equations
            if (comp.type !== 'battery') {
                // V = I * R
                this.equationList.push({
                    type: 'ohms_law_v',
                    equation: `${prefix}.voltage = ${prefix}.current * ${prefix}.resistance`,
                    solve: (values) => {
                        if (values.current !== undefined && values.resistance !== undefined) {
                            return { voltage: values.current * values.resistance };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['current', 'resistance'],
                    solves: 'voltage'
                });
                
                // I = V / R
                this.equationList.push({
                    type: 'ohms_law_i',
                    equation: `${prefix}.current = ${prefix}.voltage / ${prefix}.resistance`,
                    solve: (values) => {
                        if (values.voltage !== undefined && values.resistance !== undefined && values.resistance !== 0) {
                            return { current: values.voltage / values.resistance };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['voltage', 'resistance'],
                    solves: 'current'
                });
                
                // R = V / I
                this.equationList.push({
                    type: 'ohms_law_r',
                    equation: `${prefix}.resistance = ${prefix}.voltage / ${prefix}.current`,
                    solve: (values) => {
                        if (values.voltage !== undefined && values.current !== undefined && values.current !== 0) {
                            return { resistance: values.voltage / values.current };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['voltage', 'current'],
                    solves: 'resistance'
                });
            }
            
            // P = V * I (for all components)
            this.equationList.push({
                type: 'power_vi',
                equation: `${prefix}.power = ${prefix}.voltage * ${prefix}.current`,
                solve: (values) => {
                    if (values.voltage !== undefined && values.current !== undefined) {
                        return { power: values.voltage * values.current };
                    }
                    return null;
                },
                component: comp.id,
                requires: ['voltage', 'current'],
                solves: 'power'
            });
            
            // I = P / V
            this.equationList.push({
                type: 'power_i',
                equation: `${prefix}.current = ${prefix}.power / ${prefix}.voltage`,
                solve: (values) => {
                    if (values.power !== undefined && values.voltage !== undefined && values.voltage !== 0) {
                        return { current: values.power / values.voltage };
                    }
                    return null;
                },
                component: comp.id,
                requires: ['power', 'voltage'],
                solves: 'current'
            });
            
            // V = P / I
            this.equationList.push({
                type: 'power_v',
                equation: `${prefix}.voltage = ${prefix}.power / ${prefix}.current`,
                solve: (values) => {
                    if (values.power !== undefined && values.current !== undefined && values.current !== 0) {
                        return { voltage: values.power / values.current };
                    }
                    return null;
                },
                component: comp.id,
                requires: ['power', 'current'],
                solves: 'voltage'
            });
            
            // Additional power equations using resistance (for non-battery components)
            if (comp.type !== 'battery') {
                // P = I² * R
                this.equationList.push({
                    type: 'power_i2r',
                    equation: `${prefix}.power = ${prefix}.current² * ${prefix}.resistance`,
                    solve: (values) => {
                        if (values.current !== undefined && values.resistance !== undefined) {
                            return { power: values.current * values.current * values.resistance };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['current', 'resistance'],
                    solves: 'power'
                });
                
                // P = V² / R
                this.equationList.push({
                    type: 'power_v2r',
                    equation: `${prefix}.power = ${prefix}.voltage² / ${prefix}.resistance`,
                    solve: (values) => {
                        if (values.voltage !== undefined && values.resistance !== undefined && values.resistance !== 0) {
                            return { power: (values.voltage * values.voltage) / values.resistance };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['voltage', 'resistance'],
                    solves: 'power'
                });
                
                // I = √(P / R)
                this.equationList.push({
                    type: 'power_i_from_pr',
                    equation: `${prefix}.current = √(${prefix}.power / ${prefix}.resistance)`,
                    solve: (values) => {
                        if (values.power !== undefined && values.resistance !== undefined && values.resistance !== 0 && values.power >= 0) {
                            return { current: Math.sqrt(values.power / values.resistance) };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['power', 'resistance'],
                    solves: 'current'
                });
                
                // V = √(P * R)
                this.equationList.push({
                    type: 'power_v_from_pr',
                    equation: `${prefix}.voltage = √(${prefix}.power * ${prefix}.resistance)`,
                    solve: (values) => {
                        if (values.power !== undefined && values.resistance !== undefined && values.power >= 0) {
                            return { voltage: Math.sqrt(values.power * values.resistance) };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['power', 'resistance'],
                    solves: 'voltage'
                });
                
                // R = P / I²
                this.equationList.push({
                    type: 'power_r_from_pi',
                    equation: `${prefix}.resistance = ${prefix}.power / ${prefix}.current²`,
                    solve: (values) => {
                        if (values.power !== undefined && values.current !== undefined && values.current !== 0) {
                            return { resistance: values.power / (values.current * values.current) };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['power', 'current'],
                    solves: 'resistance'
                });
                
                // R = V² / P
                this.equationList.push({
                    type: 'power_r_from_vp',
                    equation: `${prefix}.resistance = ${prefix}.voltage² / ${prefix}.power`,
                    solve: (values) => {
                        if (values.voltage !== undefined && values.power !== undefined && values.power !== 0) {
                            return { resistance: (values.voltage * values.voltage) / values.power };
                        }
                        return null;
                    },
                    component: comp.id,
                    requires: ['voltage', 'power'],
                    solves: 'resistance'
                });
            }
        });
        
        // Generate Kirchhoff equations for series and parallel circuits
        this.generateKirchhoffEquations(this.tree);
        
        // Generate parallel current sum equations based on active paths
        this.generateParallelCurrentSumEquations();
        
        console.log(`Generated ${this.equationList.length} equations`);
        return this.equationList;
    }
    
    generateKirchhoffEquations(tree /* unused now, kept for compatibility */) {
    // We build Kirchhoff constraints from activePaths because it accurately
    // represents the real loop(s) and parallel split/merge points.
    if (!this.activePaths || this.activePaths.length === 0) return;

    const battery = this.nodeValues.find(c => c.type === 'battery');
    const batteryId = battery ? battery.id : 'battery';

    // Helpers
    const isNonBattery = (id) => {
        const comp = this.nodeValues.find(c => c.id === id);
        return comp && comp.type !== 'battery';
    };

    const getComp = (id) => this.nodeValues.find(c => c.id === id);

    // -------------------------
    // 1) KVL (series) per path:
    //    Vbattery = sum(Vdrops along that path)
    //    This is what applyKVLSeries() expects: type 'kvl_series' + eq.components
    // -------------------------
    for (const path of this.activePaths) {
        // path looks like [battery, ..., battery]
        const comps = path.slice(1, -1).filter(isNonBattery);

        if (comps.length >= 2) {
            this.equationList.push({
                type: 'kvl_series',
                equation: `${batteryId}.voltage = ${comps.map(id => `${id}.voltage`).join(' + ')}`,
                components: comps
            });
        }
    }

    // -------------------------
    // 2) KCL (series) per path:
    //    Same current through all components on that path (excluding battery)
    // -------------------------
    for (const path of this.activePaths) {
        const comps = path.slice(1, -1).filter(isNonBattery);
        if (comps.length < 2) continue;

        // Use first component as reference for this path
        const refId = comps[0];

        for (let i = 1; i < comps.length; i++) {
            const targetId = comps[i];

            this.equationList.push({
                type: 'kcl_series',
                equation: `${targetId}.current = ${refId}.current`,
                solve: () => {
                    const ref = getComp(refId);
                    if (ref && ref.current !== undefined) return { current: ref.current };
                    return null;
                },
                component: targetId,
                solves: 'current',
                connectionType: 'series',
                relatedComponents: [refId]
            });
        }
    }

    // If there is no parallel section, we're done.
    if (this.activePaths.length < 2) return;

    // -------------------------
    // 3) KCL (parallel) at the split:
    //    I_total_before_split = sum(I_branch_starts)
    //    We generate solvable "one missing branch current" equations:
    //    I_branch_k = I_total - sum(other branches)
    // -------------------------

    // Find diverge & converge indices exactly like your other functions do
    let divergeIndex = 0;
    for (let i = 0; i < Math.min(...this.activePaths.map(p => p.length)); i++) {
        const first = this.activePaths[0][i];
        if (this.activePaths.every(p => p[i] === first)) divergeIndex = i + 1;
        else break;
    }

    let convergeIndex = this.activePaths[0].length;
    for (let i = 1; i <= Math.min(...this.activePaths.map(p => p.length)); i++) {
        const first = this.activePaths[0][this.activePaths[0].length - i];
        if (this.activePaths.every(p => p[p.length - i] === first)) convergeIndex = this.activePaths[0].length - i;
        else break;
    }

    // Must actually have a parallel section
    if (divergeIndex >= convergeIndex) return;

    // Total current reference is the component just BEFORE the split (if possible),
    // otherwise fall back to battery.current.
    const totalCurrentRefId =
        (divergeIndex - 1 >= 0 && isNonBattery(this.activePaths[0][divergeIndex - 1]))
            ? this.activePaths[0][divergeIndex - 1]
            : (battery ? battery.id : null);

    // First component of each branch at the diverge
    const branchStarts = [];
    for (const path of this.activePaths) {
        const id = path[divergeIndex];
        if (id && isNonBattery(id) && !branchStarts.includes(id)) branchStarts.push(id);
    }

    if (branchStarts.length >= 2 && totalCurrentRefId) {
        branchStarts.forEach((targetId) => {
            const otherIds = branchStarts.filter(id => id !== targetId);

            this.equationList.push({
                type: 'kcl_parallel',
                equation: `${targetId}.current = ${totalCurrentRefId}.current - (${otherIds.map(id => `${id}.current`).join(' + ')})`,
                solve: () => {
                    const totalRef = getComp(totalCurrentRefId);
                    if (!totalRef || totalRef.current === undefined) return null;

                    let sumOthers = 0;
                    for (const oid of otherIds) {
                        const oc = getComp(oid);
                        if (!oc || oc.current === undefined) return null;
                        sumOthers += oc.current;
                    }
                    return { current: totalRef.current - sumOthers };
                },
                component: targetId,
                solves: 'current',
                connectionType: 'parallel',
                isBranchLevel: true,
                relatedComponents: otherIds
            });
        });
    }

    // Note:
    // You already generate a "merge" equation in generateParallelCurrentSumEquations()
    // (current after parallel = sum(branch currents)), which complements this split KCL nicely.
}

    
    // Helper to flatten nested arrays and extract component IDs
    flattenComponentIds(item) {
        const ids = [];
        
        if (Array.isArray(item)) {
            item.forEach(subItem => {
                ids.push(...this.flattenComponentIds(subItem));
            });
        } else if (typeof item === 'string') {
            const comp = this.nodeValues.find(c => c.id === item);
            if (comp && comp.type !== 'battery') {
                ids.push(item);
            }
        }
        
        return ids;
    }

    // Generate equations that sum parallel branch currents and assign to next component
    generateParallelCurrentSumEquations() {
        if (this.activePaths.length < 2) return; // No parallel paths
        
        // Find where paths diverge (start of parallel section)
        let divergeIndex = 0;
        for (let i = 0; i < Math.min(...this.activePaths.map(p => p.length)); i++) {
            const firstPathComp = this.activePaths[0][i];
            if (this.activePaths.every(path => path[i] === firstPathComp)) {
                divergeIndex = i + 1;
            } else {
                break;
            }
        }
        
        // Find where paths converge (end of parallel section)
        let convergeIndex = this.activePaths[0].length;
        for (let i = 1; i <= Math.min(...this.activePaths.map(p => p.length)); i++) {
            const firstPathComp = this.activePaths[0][this.activePaths[0].length - i];
            if (this.activePaths.every(path => path[path.length - i] === firstPathComp)) {
                convergeIndex = this.activePaths[0].length - i;
            } else {
                break;
            }
        }
        
        // Check if there's actually a parallel section
        if (divergeIndex >= convergeIndex) return;
        
        // Get the component right after the parallel section (where currents merge)
        const componentAfterParallel = this.activePaths[0][convergeIndex];
        if (!componentAfterParallel) return;
        
        const afterComp = this.nodeValues.find(c => c.id === componentAfterParallel);
        if (!afterComp || afterComp.type === 'battery') return;
        
        // Collect first component from each parallel branch
        const branchComponents = [];
        for (const path of this.activePaths) {
            if (divergeIndex < path.length) {
                const branchCompId = path[divergeIndex];
                const branchComp = this.nodeValues.find(c => c.id === branchCompId);
                if (branchComp && branchComp.type !== 'battery') {
                    branchComponents.push(branchCompId);
                }
            }
        }
        
        if (branchComponents.length < 2) return;
        
        // Generate equation: current after parallel = sum of all branch currents
        this.equationList.push({
            type: 'kcl_parallel_sum',
            equation: `${componentAfterParallel}.current = ${branchComponents.map(id => `${id}.current`).join(' + ')}`,
            solve: (values) => {
                // Sum all branch currents
                let totalCurrent = 0;
                let hasAllCurrents = true;
                
                for (const branchId of branchComponents) {
                    const branchComp = this.nodeValues.find(c => c.id === branchId);
                    if (!branchComp || branchComp.current === undefined) {
                        hasAllCurrents = false;
                        break;
                    }
                    totalCurrent += branchComp.current;
                }
                
                if (hasAllCurrents) {
                    return { current: totalCurrent };
                }
                return null;
            },
            component: componentAfterParallel,
            requires: branchComponents.map(id => `${id}.current`),
            solves: 'current',
            branchComponents: branchComponents
        });
        
        console.log(`Generated parallel sum equation: ${afterComp.name}.current = sum of ${branchComponents.length} branches`);
    }

    solvePool() {
        let changesMade = true;
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops
        
        // Track defined variables
        const definedVariables = new Set();
        
        // Initialize with known values
        this.nodeValues.forEach(comp => {
            if (comp.resistance !== undefined) {
                definedVariables.add(`${comp.id}.resistance`);
            }
            if (comp.voltage !== undefined) {
                definedVariables.add(`${comp.id}.voltage`);
            }
            if (comp.current !== undefined) {
                definedVariables.add(`${comp.id}.current`);
            }
            if (comp.power !== undefined) {
                definedVariables.add(`${comp.id}.power`);
            }
        });
        
        console.log('Starting equation solver...');
        console.log('Initially defined variables:', Array.from(definedVariables));
        
        while (changesMade && iterations < maxIterations) {
            changesMade = false;
            iterations++;
            
            console.log(`\n--- Iteration ${iterations} ---`);
            
            // Try to solve each equation
            for (let eqIndex = 0; eqIndex < this.equationList.length; eqIndex++) {
                const eq = this.equationList[eqIndex];
                if (!eq.solve || !eq.component) continue;
                
                // Get the component's current values
                const comp = this.nodeValues.find(c => c.id === eq.component);
                if (!comp) continue;
                
                // Check if we already have the value this equation solves for
                const varName = `${comp.id}.${eq.solves}`;
                if (definedVariables.has(varName)) continue;
                
                // Try to solve the equation
                const result = eq.solve(comp);
                
                if (result) {
                    // Update the component with the solved value
                    Object.assign(comp, result);
                    
                    // Mark variable as defined
                    definedVariables.add(varName);
                    
                    console.log(`✓ Solved ${eq.type} (eq#${eqIndex}) for ${comp.name}: ${eq.solves} = ${result[eq.solves]}`);
                    console.log(`  Equation: ${eq.equation}`);
                    console.log(`  Defined: ${varName}`);
                    changesMade = true;
                }
            }
            
            // Apply Kirchhoff's laws (only KVL series needs special handling for reference voltage)
            const kirchhoffChanges = this.applyKVLSeries(definedVariables);
            changesMade = kirchhoffChanges || changesMade;
            
            // Try to calculate voltages directly from active paths
            const pathVoltageChanges = this.calculateVoltagesFromPaths(definedVariables);
            changesMade = pathVoltageChanges || changesMade;
        }
        
        console.log(`\nSolver completed in ${iterations} iterations`);
        console.log('All defined variables:', Array.from(definedVariables).sort());
        
        // Check which variables are still undefined by comparing with initial extraction
        const allPossibleVars = [];
        this.nodeValues.forEach(comp => {
            if (comp.type !== 'battery' && comp.resistance === undefined) {
                allPossibleVars.push(`${comp.id}.resistance`);
            }
            if (comp.voltage === undefined) {
                allPossibleVars.push(`${comp.id}.voltage`);
            }
            if (comp.current === undefined) {
                allPossibleVars.push(`${comp.id}.current`);
            }
            if (comp.power === undefined) {
                allPossibleVars.push(`${comp.id}.power`);
            }
        });
        
        const stillUndefined = allPossibleVars.filter(v => !definedVariables.has(v));
        if (stillUndefined.length > 0) {
            console.warn('Still undefined:', stillUndefined);
        } else {
            console.log('✓ All variables solved!');
        }
        
        // Cross-validate results
        this.crossValidate();
        
        return this.nodeValues;
    }
    
    applyKVLSeries(definedVariables) {
        // Special handling for KVL series: sum of voltages must equal reference voltage
        // This can't be expressed as a simple solve() function because it needs to find
        // the reference voltage (either battery or parallel sibling)
        let changesMade = false;
        
        const seriesEquations = this.equationList.filter(eq => eq.type === 'kvl_series');
        
        for (const eq of seriesEquations) {
            if (!eq.components) continue;
            
            // Find equation index for logging
            const eqIndex = this.equationList.indexOf(eq);
            
            const components = eq.components.map(id => 
                this.nodeValues.find(c => c.id === id)
            ).filter(c => c !== undefined);
            
            if (components.length < 2) continue;
            
            // Find reference voltage for this series group
            let referenceVoltage = null;
            let referenceSource = 'battery';
            
            // First, check if this series group is part of a parallel structure
            // If so, use the parallel sibling's voltage as reference
            const parallelSiblingVoltage = this.getParallelSiblingVoltageFromPaths(eq.components);
            if (parallelSiblingVoltage !== null) {
                referenceVoltage = parallelSiblingVoltage;
                referenceSource = 'parallel sibling';
            } else {
                // Otherwise, use battery voltage as reference for series calculations
                const battery = this.nodeValues.find(c => c.type === 'battery');
                if (battery && battery.voltage !== undefined) {
                    referenceVoltage = battery.voltage;
                    referenceSource = 'battery';
                }
            }
            
            if (referenceVoltage !== null) {
                const knownVoltages = components.filter(c => c.voltage !== undefined);
                const unknownVoltages = components.filter(c => c.voltage === undefined);
                
                // If only one unknown, calculate it
                if (unknownVoltages.length === 1 && knownVoltages.length > 0) {
                    // For each known component, check if it represents a nested parallel structure
                    // If it does, use the parallel section's total voltage instead
                    let sumKnown = 0;
                    
                    for (const knownComp of knownVoltages) {
                        // Check if this component is a representative of a parallel section
                        // by seeing if referenceSource is NOT 'parallel sibling' (meaning this is the outer series)
                        if (referenceSource !== 'parallel sibling') {
                            const nestedVoltage = this.getEffectiveVoltageFromPaths(knownComp.id);
                            sumKnown += nestedVoltage !== null ? nestedVoltage : knownComp.voltage;
                        } else {
                            // This is a series within a parallel section, just use the component's voltage
                            sumKnown += knownComp.voltage;
                        }
                    }
                    
                    const remaining = referenceVoltage - sumKnown;
                    const varName = `${unknownVoltages[0].id}.voltage`;
                    unknownVoltages[0].voltage = Math.max(0, remaining);
                    definedVariables.add(varName);
                    console.log(`✓ KVL Series (eq#${eqIndex}): ${unknownVoltages[0].name}.voltage = ${unknownVoltages[0].voltage}V (${referenceVoltage}V from ${referenceSource} - ${sumKnown}V)`);
                    console.log(`  Equation: ${eq.equation}`);
                    console.log(`  Defined: ${varName}`);
                    changesMade = true;
                }
            }
        }
        
        return changesMade;
    }
    
    // Calculate voltages for all components based on active paths
    calculateVoltagesFromPaths(definedVariables) {
        let changesMade = false;
        
        if (this.activePaths.length === 0) return false;
        
        // Get battery voltage as reference
        const battery = this.nodeValues.find(c => c.type === 'battery');
        if (!battery || battery.voltage === undefined) return false;
        
        const batteryVoltage = battery.voltage;
        
        // Find where paths diverge (start of parallel section)
        let divergeIndex = 0;
        if (this.activePaths.length > 1) {
            for (let i = 0; i < Math.min(...this.activePaths.map(p => p.length)); i++) {
                const firstPathComp = this.activePaths[0][i];
                if (this.activePaths.every(path => path[i] === firstPathComp)) {
                    divergeIndex = i + 1;
                } else {
                    break;
                }
            }
        }
        
        // Find where paths converge (end of parallel section)
        let convergeIndex = this.activePaths[0].length;
        if (this.activePaths.length > 1) {
            for (let i = 1; i <= Math.min(...this.activePaths.map(p => p.length)); i++) {
                const firstPathComp = this.activePaths[0][this.activePaths[0].length - i];
                if (this.activePaths.every(path => path[path.length - i] === firstPathComp)) {
                    convergeIndex = this.activePaths[0].length - i;
                } else {
                    break;
                }
            }
        }
        
        console.log(`[Path Voltage Calc] Diverge at index ${divergeIndex}, converge at index ${convergeIndex}`);
        
        // For each path, calculate voltages
        for (const path of this.activePaths) {
            // Skip battery at start and end
            let totalCalculatedVoltage = 0;
            const componentsToCalculate = [];
            
            for (let i = 1; i < path.length - 1; i++) {
                const compId = path[i];
                const comp = this.nodeValues.find(c => c.id === compId);
                if (!comp) continue;
                
                const varName = `${comp.id}.voltage`;
                
                // Check if in parallel section
                const isInParallelSection = (divergeIndex < convergeIndex) && (i >= divergeIndex && i < convergeIndex);
                
                if (comp.voltage !== undefined) {
                    totalCalculatedVoltage += comp.voltage;
                } else {
                    componentsToCalculate.push({ comp, varName, isInParallelSection });
                }
            }
            
            // If all components in path have voltage except one, calculate it
            if (componentsToCalculate.length === 1) {
                const { comp, varName, isInParallelSection } = componentsToCalculate[0];
                
                // Calculate remaining voltage
                let referenceVoltage = batteryVoltage;
                
                // If this is a parallel section, check sibling paths for reference
                if (isInParallelSection && this.activePaths.length > 1) {
                    for (const siblingPath of this.activePaths) {
                        if (siblingPath === path) continue;
                        
                        let siblingVoltage = 0;
                        let hasAllVoltages = true;
                        
                        for (let i = divergeIndex; i < convergeIndex && i < siblingPath.length; i++) {
                            const sibCompId = siblingPath[i];
                            const sibComp = this.nodeValues.find(c => c.id === sibCompId);
                            if (!sibComp || sibComp.voltage === undefined) {
                                hasAllVoltages = false;
                                break;
                            }
                            siblingVoltage += sibComp.voltage;
                        }
                        
                        if (hasAllVoltages) {
                            referenceVoltage = siblingVoltage;
                            console.log(`[Path Voltage Calc] Using sibling voltage ${siblingVoltage}V as reference for ${comp.name}`);
                            break;
                        }
                    }
                }
                
                const calculatedVoltage = Math.max(0, referenceVoltage - totalCalculatedVoltage);
                comp.voltage = calculatedVoltage;
                definedVariables.add(varName);
                console.log(`✓ Path Voltage Calc: ${comp.name}.voltage = ${calculatedVoltage}V (${referenceVoltage}V - ${totalCalculatedVoltage}V)`);
                console.log(`  Defined: ${varName}`);
                changesMade = true;
            }
        }
        
        return changesMade;
    }
    
    // Helper function to get the effective voltage for a component using activePaths
    // If the component is part of a parallel section, return the voltage across that section
    getEffectiveVoltageFromPaths(componentId) {
        // Find all paths that contain this component
        const pathsWithComponent = this.activePaths.filter(path => path.includes(componentId));
        
        if (pathsWithComponent.length === 0) return null;
        
        // If component appears in multiple paths, it's part of a parallel section
        if (pathsWithComponent.length > 1) {
            // Find the path containing this component
            const pathWithComp = pathsWithComponent[0];
            
            // Get the position of the component in its path
            const compIndex = pathWithComp.indexOf(componentId);
            
            // Find components in the same parallel section (same position in different paths)
            // by finding where paths diverge and converge
            
            // Find where parallel section starts (where paths diverge)
            let divergeIndex = 0;
            for (let i = 0; i < Math.min(...pathsWithComponent.map(p => p.length)); i++) {
                const firstPathComp = pathsWithComponent[0][i];
                if (pathsWithComponent.every(path => path[i] === firstPathComp)) {
                    divergeIndex = i + 1; // Diverge after this common component
                } else {
                    break;
                }
            }
            
            // Find where parallel section ends (where paths converge)
            let convergeIndex = pathWithComp.length;
            for (let i = 1; i <= Math.min(...pathsWithComponent.map(p => p.length)); i++) {
                const firstPathComp = pathsWithComponent[0][pathsWithComponent[0].length - i];
                if (pathsWithComponent.every(path => path[path.length - i] === firstPathComp)) {
                    convergeIndex = pathWithComp.length - i;
                } else {
                    break;
                }
            }
            
            // Check if our component is in the parallel section
            if (compIndex >= divergeIndex && compIndex < convergeIndex) {
                // Component is in a parallel section
                // Get the total voltage across this component's branch in the parallel section
                let branchVoltage = 0;
                let hasAllVoltages = true;
                
                for (let i = divergeIndex; i < convergeIndex; i++) {
                    const compId = pathWithComp[i];
                    const comp = this.nodeValues.find(c => c.id === compId);
                    if (!comp || comp.voltage === undefined) {
                        hasAllVoltages = false;
                        break;
                    }
                    branchVoltage += comp.voltage;
                }
                
                return hasAllVoltages ? branchVoltage : null;
            }
        }
        
        // Component is not in a parallel section, just return its voltage
        const comp = this.nodeValues.find(c => c.id === componentId);
        return comp && comp.voltage !== undefined ? comp.voltage : null;
    }
    
    // Helper function to find parallel sibling voltage using activePaths
    getParallelSiblingVoltageFromPaths(seriesComponentIds) {
        if (!seriesComponentIds || seriesComponentIds.length === 0) return null;
        
        // Find the path containing these series components (all of them must be in sequence)
        const pathWithComponents = this.activePaths.find(path => {
            // Check if all series components are in this path in sequence
            const firstIndex = path.indexOf(seriesComponentIds[0]);
            if (firstIndex === -1) return false;
            
            // Check if all components appear consecutively
            for (let i = 0; i < seriesComponentIds.length; i++) {
                if (path[firstIndex + i] !== seriesComponentIds[i]) {
                    return false;
                }
            }
            return true;
        });
        
        if (!pathWithComponents) return null;
        
        // Find all paths (potential parallel siblings)
        const allPaths = this.activePaths;
        
        if (allPaths.length < 2) return null; // No parallel paths
        
        // Get the position of the first series component in its path
        const firstCompIndex = pathWithComponents.indexOf(seriesComponentIds[0]);
        const lastCompIndex = firstCompIndex + seriesComponentIds.length - 1;
        
        // Find where parallel section starts (where paths diverge)
        let divergeIndex = 0;
        for (let i = 0; i < Math.min(...allPaths.map(p => p.length)); i++) {
            const firstPathComp = allPaths[0][i];
            if (allPaths.every(path => path[i] === firstPathComp)) {
                divergeIndex = i + 1;
            } else {
                break;
            }
        }
        
        // Find where parallel section ends (where paths converge)
        let convergeIndex = pathWithComponents.length;
        for (let i = 1; i <= Math.min(...allPaths.map(p => p.length)); i++) {
            const firstPathComp = allPaths[0][allPaths[0].length - i];
            if (allPaths.every(path => path[path.length - i] === firstPathComp)) {
                convergeIndex = pathWithComponents.length - i;
            } else {
                break;
            }
        }
        
        // Check if our components are in a parallel section
        if (firstCompIndex >= divergeIndex && lastCompIndex < convergeIndex) {
            // Find a sibling path (different path in the parallel section)
            for (const siblingPath of allPaths) {
                if (siblingPath === pathWithComponents) continue;
                
                // Calculate total voltage across the sibling branch
                let siblingVoltage = 0;
                let hasAllVoltages = true;
                
                for (let i = divergeIndex; i < convergeIndex && i < siblingPath.length; i++) {
                    const compId = siblingPath[i];
                    const comp = this.nodeValues.find(c => c.id === compId);
                    if (!comp || comp.voltage === undefined) {
                        hasAllVoltages = false;
                        break;
                    }
                    siblingVoltage += comp.voltage;
                }
                
                if (hasAllVoltages) {
                    return siblingVoltage;
                }
            }
        }
        
        return null;
    }
    
    crossValidate() {
        console.log('\n=== Cross-validation ===');
        let hasErrors = false;
        
        this.nodeValues.forEach(comp => {
            if (comp.type === 'battery') return;
            
            // Validate Ohm's law: V = I * R
            if (comp.voltage !== undefined && comp.current !== undefined && comp.resistance !== undefined) {
                const calculatedV = comp.current * comp.resistance;
                const error = Math.abs(comp.voltage - calculatedV);
                const tolerance = 0.001; // Allow small floating point errors
                
                if (error > tolerance) {
                    console.warn(`⚠ ${comp.name}: Ohm's law mismatch! V=${comp.voltage}V but I*R=${calculatedV}V (error: ${error}V)`);
                    hasErrors = true;
                } else {
                    console.log(`✓ ${comp.name}: Ohm's law validated`);
                }
            }
            
            // Validate Power: P = V * I
            if (comp.power !== undefined && comp.voltage !== undefined && comp.current !== undefined) {
                const calculatedP = comp.voltage * comp.current;
                const error = Math.abs(comp.power - calculatedP);
                const tolerance = 0.001;
                
                if (error > tolerance) {
                    console.warn(`⚠ ${comp.name}: Power mismatch! P=${comp.power}W but V*I=${calculatedP}W (error: ${error}W)`);
                    hasErrors = true;
                } else {
                    console.log(`✓ ${comp.name}: Power equation validated`);
                }
            }
        });
        
        if (!hasErrors) {
            console.log('✓ All values validated successfully!');
        }
    }

    updateComponents() {
        console.log('\n=== Updating component values ===');
        let updateCount = 0;

        const canWriteValueField = (field) => {
            if (field === undefined || field === null) return true;
            if (typeof field === 'object') {
                if (typeof field.automatic === 'boolean') return field.automatic === true;
                return true;
            }
            return true;
        };
        
        // First, propagate values from equivalent components back to original components
        this.nodeValues.forEach(equiv => {
            if (equiv.type === 'equivalent' && equiv.originalComponents) {
                if (equiv.connectionType === 'series') {
                    // Series: same current through all, voltages add up
                    if (equiv.current !== undefined) {
                        equiv.originalComponents.forEach(comp => {
                            comp.current = equiv.current;
                        });
                    }
                } else if (equiv.connectionType === 'parallel') {
                    // Parallel: same voltage across all, currents add up
                    if (equiv.voltage !== undefined) {
                        equiv.originalComponents.forEach(comp => {
                            comp.voltage = equiv.voltage;
                        });
                    }
                }
            }
        });
        
        // Update each component with solved values
        this.nodeValues.forEach(nodeValue => {
            // Skip equivalent components (they're virtual)
            if (nodeValue.type === 'equivalent') return;
            
            const component = window.components.find(c => c.id === nodeValue.id);
            
            if (!component || !component.values) {
                console.warn(`Component ${nodeValue.id} not found`);
                return;
            }
            
            let updatedFields = [];
            
            // Update resistance
            if (nodeValue.resistance !== undefined && component.type !== 'battery') {
                if (canWriteValueField(component.values.resistance)) {
                    if (typeof component.values.resistance === 'object') {
                        component.values.resistance.value = nodeValue.resistance;
                    } else {
                        component.values.resistance = nodeValue.resistance;
                    }
                    updatedFields.push('R');
                    updateCount++;
                }
            }
            
            // Update voltage (voltageDrop for most components, voltage for battery)
            if (nodeValue.voltage !== undefined) {
                // If battery voltage was originally negative, reverse all voltages
                const voltageValue = this.negativeVoltage ? -nodeValue.voltage : nodeValue.voltage;

                let wroteVoltage = false;
                
                if (component.type === 'battery') {
                    if (canWriteValueField(component.values.voltage)) {
                        if (typeof component.values.voltage === 'object') {
                            component.values.voltage.value = voltageValue;
                        } else {
                            component.values.voltage = voltageValue;
                        }
                        wroteVoltage = true;
                    }
                } else {
                    // For non-battery components, update voltageDrop or voltage
                    if (component.values.voltageDrop !== undefined) {
                        if (canWriteValueField(component.values.voltageDrop)) {
                            if (typeof component.values.voltageDrop === 'object') {
                                component.values.voltageDrop.value = voltageValue;
                            } else {
                                component.values.voltageDrop = voltageValue;
                            }
                            wroteVoltage = true;
                        }
                    } else if (component.values.voltage !== undefined) {
                        if (canWriteValueField(component.values.voltage)) {
                            if (typeof component.values.voltage === 'object') {
                                component.values.voltage.value = voltageValue;
                            } else {
                                component.values.voltage = voltageValue;
                            }
                            wroteVoltage = true;
                        }
                    }
                }

                if (wroteVoltage) {
                    updatedFields.push('V');
                    updateCount++;
                }
            }
            
            // Update current
            if (nodeValue.current !== undefined) {
                if (canWriteValueField(component.values.current)) {
                    if (typeof component.values.current === 'object') {
                        component.values.current.value = nodeValue.current;
                    } else {
                        component.values.current = nodeValue.current;
                    }
                    updatedFields.push('I');
                    updateCount++;
                }
            }
            
            // Update power
            if (nodeValue.power !== undefined) {
                if (canWriteValueField(component.values.power)) {
                    if (typeof component.values.power === 'object') {
                        component.values.power.value = nodeValue.power;
                    } else {
                        component.values.power = nodeValue.power;
                    }
                    updatedFields.push('P');
                    updateCount++;
                }
            }
            
            console.log(`✓ Updated ${component.values.name} [${updatedFields.join(', ')}]:`, {
                R: nodeValue.resistance !== undefined ? `${nodeValue.resistance}Ω` : '-',
                V: nodeValue.voltage !== undefined ? `${nodeValue.voltage}V` : '-',
                I: nodeValue.current !== undefined ? `${nodeValue.current}A` : '-',
                P: nodeValue.power !== undefined ? `${nodeValue.power}W` : '-'
            });
        });
        
        console.log(`\n✓ Updated ${updateCount} values across ${this.nodeValues.length} components`);
    }

    // Enable/disable auto-recalculation
    setAutoRecalculate(enabled, interval = 100) {
        this.autoRecalculate = enabled;
        
        if (enabled) {
            this.startAutoRecalculate(interval);
        } else {
            this.stopAutoRecalculate();
        }
    }

    // Get current simulation status
    getStatus() {
        return {
            autoRecalculate: this.autoRecalculate,
            isRunning: this.recalculateInterval !== null,
            hasSource: this.source !== null && this.source !== undefined,
            pathCount: this.paths.length,
            activePathCount: this.activePaths.length,
            componentCount: this.nodeValues.length
        };
    }
}

export { CircuitSim };