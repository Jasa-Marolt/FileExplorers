import Phaser from 'phaser';
import router from '@/router';

// Asset imports (bundler-resolved)
import andGateImg from './phaserComponents/boolean/and_gate.svg';
import nandGateImg from './phaserComponents/boolean/nand_gate.svg';
import orGateImg from './phaserComponents/boolean/or_gate.svg';
import norGateImg from './phaserComponents/boolean/nor_gate.svg';
import xorGateImg from './phaserComponents/boolean/xor_gate.svg';
import nxorGateImg from './phaserComponents/boolean/nxor_gate.svg';
import notGateImg from './phaserComponents/boolean/not_gate.svg';
import switchOnImg from './phaserComponents/boolean/switch-on.svg';
import switchOffImg from './phaserComponents/boolean/switch-off.svg';
import BooleanGate from './phaserComponents/boolean/BooleanGate.js';
import { Wire } from './phaserComponents/wire.js';
import UIButton from './UI/UIButton.js';
import { createContextMenu } from './UI/ContextMenu.js';

export default class BoolWorkspaceScene extends Phaser.Scene {
    constructor() {
        super('BoolWorkspaceScene');
        this.placedComponents = [];
        this.gridSize = 40;
    }

    preload() {
        // Register assets using imported URLs
        this.load.image('and', andGateImg);
        this.load.image('nand', nandGateImg);
        this.load.image('or', orGateImg);
        this.load.image('nor', norGateImg);
        this.load.image('xor', xorGateImg);
        this.load.image('nxor', nxorGateImg);
        this.load.image('not', notGateImg);
        this.load.image('switch-on', switchOnImg);
        this.load.image('switch-off', switchOffImg);
    }

    create() {
        const { width, height } = this.cameras.main;
        this.createPanel();
        this.createGrid();

        // Disable browser context menu on the Phaser canvas
        try {
            if (this.input && this.input.mouse && typeof this.input.mouse.disableContextMenu === 'function') {
                this.input.mouse.disableContextMenu();
            }
        } catch (e) { }
        try {
            const canvas = this.game && this.game.canvas ? this.game.canvas : null;
            if (canvas && !canvas._rupsContextMenuListenerAdded) {
                canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
                canvas._rupsContextMenuListenerAdded = true;
            }
        } catch (e) { }

        // Listen for scene shutdown and cleanup
        this.events.once('shutdown', () => this.cleanup());
        this.events.once('destroy', () => this.cleanup());

        // Back button
        new UIButton(this, {
            x: 12,
            y: 10,
            text: '↩ Nazaj',
            onClick: () => {
                this.cameras.main.fade(300, 0, 0, 0);
                this.time.delayedCall(300, () => {
                    try {
                        router.push({ name: 'landing' });
                    } catch (e) {
                        window.location.href = '/';
                    }
                });
            },
            origin: [0, 0],
            style: {
                fontSize: '18px',
                color: '#387aff',
            },
        });

        // Right-click context menu for components
        this.input.on('pointerdown', (pointer) => {
            const isRightClick =
                (pointer.event && pointer.event.button === 2) ||
                (pointer.rightButtonDown && pointer.rightButtonDown()) ||
                (typeof pointer.buttons !== 'undefined' && pointer.buttons === 2);
            if (!isRightClick) return;
            // prevent browser context menu
            try { if (pointer && pointer.event && typeof pointer.event.preventDefault === 'function') pointer.event.preventDefault(); } catch (e) { }

            const objects = this.input.hitTestPointer(pointer);
            console.log('Right-click objects found:', objects.length);

            // Look for a container first, then check its children
            const target = objects.find((o) => {
                if (!o || !o.getData) return false;
                // Direct container hit
                if (o.getData('logicGate')) return true;
                // Node circle hit
                if (o.getData('logicNode')) return true;
                // Component container hit
                if (o.getData('component')) return true;
                return false;
            });

            let compContainer = null;
            if (!target) {
                console.log('No valid target found for right-click');
                return;
            }

            console.log('Right-click target found:', target);

            if (target.getData('logicGate')) {
                compContainer = target;
            } else if (target.getData('component')) {
                compContainer = target.getData('component');
            } else if (target.getData('logicNode') && target.getData('logicNode').componentObject) {
                compContainer = target.getData('logicNode').componentObject;
            }

            if (!compContainer) {
                console.log('Could not find component container');
                return;
            }

            console.log('Found component container for context menu');

            // Build context menu items
            const gate = compContainer.getData('logicGate');
            let items = [
                {
                    label: 'Rotate',
                    onClick: () => {
                        rotateComponent(compContainer);
                    },
                },
                {
                    label: 'Destroy',
                    onClick: () => {
                        // remove wires
                        const gate = compContainer.getData('logicGate');
                        if (gate) {
                            gate.inputs.forEach((n) => { if (n && n.wire) n.wire.deleteWire(); });
                            if (gate.output && gate.output.wire) gate.output.wire.deleteWire();
                        }
                        // remove from placedComponents
                        const idx = this.placedComponents.indexOf(compContainer);
                        if (idx > -1) this.placedComponents.splice(idx, 1);
                        compContainer.destroy();
                    },
                },
            ];

            // If this component is a switch, expose a Toggle action in the context menu
            if (gate && (gate.type === 'switch-on' || gate.type === 'switch-off' || (typeof gate.type === 'string' && gate.type.startsWith('switch')))) {
                items.unshift({
                    label: 'Toggle',
                    onClick: () => {
                        try {
                            const newVal = gate.toggle();
                            // find image child and update tint
                            const img = compContainer.list && compContainer.list.find((c) => c && c.texture && typeof c.setTint === 'function');
                            if (img) img.setTint(newVal ? 0xffffaa : 0xffffff);
                        } catch (e) {
                            console.error('Error toggling switch:', e);
                        }
                    },
                });
            }

            createContextMenu(this, pointer.worldX, pointer.worldY, items);
        });

        const rotateComponent = (container) => {
            console.log('Rotating component');
            const newAngle = (container.angle + 90) % 360;
            container.angle = newAngle;

            // Get the gate to update node positions
            const gate = container.getData('logicGate');
            if (!gate) return;

            if (gate) {
                gate.inputs.forEach((n) => {
                    if (n._circle) {
                        const mat = n._circle.getWorldTransformMatrix();
                        n.x = mat.tx; n.y = mat.ty;
                        if (n.wire) n.wire.draw();
                    }
                });
                if (gate.output && gate.output._circle) {
                    const mat = gate.output._circle.getWorldTransformMatrix();
                    gate.output.x = mat.tx; gate.output.y = mat.ty;
                    if (gate.output.wire) gate.output.wire.draw();
                }
            }


        };
    }

    createPanel() {
        const panelWidth = 150;
        const { height } = this.cameras.main;
        this.add.rectangle(0, 0, panelWidth, height, 0xc0c0c0).setOrigin(0);
        this.add.rectangle(0, 0, panelWidth, height, 0x000000, 0.12).setOrigin(0);

        this.add.text(panelWidth / 2, 40, 'Boolean Components', {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);

        const startY = 90;
        const gap = 70;
        const components = [
            { key: 'and', label: 'AND' },
            { key: 'or', label: 'OR' },
            { key: 'not', label: 'NOT' },
            { key: 'xor', label: 'XOR' },
            { key: 'nand', label: 'NAND' },
            { key: 'nor', label: 'NOR' },
            { key: 'nxor', label: 'NXOR' },
            { key: 'switch-on', label: 'SW ON' },
            { key: 'switch-off', label: 'SW OFF' },
        ];

        components.forEach((c, idx) => {
            const y = startY + idx * gap;
            const icon = this.add.image(panelWidth / 2, y, c.key).setOrigin(0.5);
            // Preserve aspect ratio and set desired width
            const desiredWidth = 48;
            try {
                const tex = this.textures.get(c.key);
                const src = tex && tex.getSourceImage ? tex.getSourceImage() : null;
                const naturalW = src ? src.width : icon.width;
                const naturalH = src ? src.height : icon.height;
                const desiredHeight = Math.max(1, Math.round(desiredWidth * (naturalH / naturalW)));
                icon.setDisplaySize(desiredWidth, desiredHeight);
            } catch (e) {
                // fallback to square size
                icon.setDisplaySize(48, 48);
            }

            // Make icon interactive and draggable to create new component while dragging
            icon.setInteractive({ useHandCursor: true });
            this.input.setDraggable(icon);

            // temporary ghost container while dragging from panel
            icon._ghost = null;

            icon.on('dragstart', (pointer) => {
                // create a new component at pointer world position
                const worldX = pointer.worldX || pointer.x;
                const worldY = pointer.worldY || pointer.y;
                const ghost = this.createNewBooleanComponent(worldX, worldY, c.key);
                ghost.setData('fromPanel', true);
                icon._ghost = ghost;
                // prevent the icon itself from moving
                icon.x = panelWidth / 2;
                icon.y = y;
            });

            icon.on('drag', (pointer, dragX, dragY) => {
                if (icon._ghost) {
                    icon._ghost.x = dragX;
                    icon._ghost.y = dragY;
                    // update any node world positions to keep wires reactive while dragging
                    const gate = icon._ghost.getData('logicGate');
                    if (gate) {
                        gate.inputs.forEach((n) => {
                            if (n._circle) {
                                const mat = n._circle.getWorldTransformMatrix();
                                n.x = mat.tx; n.y = mat.ty;
                                if (n.wire) n.wire.draw();
                            }
                        });
                        if (gate.output && gate.output._circle) {
                            const mat = gate.output._circle.getWorldTransformMatrix();
                            gate.output.x = mat.tx; gate.output.y = mat.ty;
                            if (gate.output.wire) gate.output.wire.draw();
                        }
                    }
                }
            });

            icon.on('dragend', (pointer) => {
                const ghost = icon._ghost;
                if (!ghost) return;
                // determine drop
                const isInPanel = ghost.x < panelWidth;
                if (isInPanel) {
                    ghost.destroy();
                } else {
                    // snap and finalize placement (same behavior as container dragend)
                    const snapped = this.snapToGrid(ghost.x, ghost.y);
                    ghost.x = snapped.x; ghost.y = snapped.y;

                    // Ensure the ghost component remains interactive and draggable
                    ghost.setInteractive(new Phaser.Geom.Rectangle(-50, -50, 100, 100), Phaser.Geom.Rectangle.Contains);
                    this.input.setDraggable(ghost);

                    // update node positions
                    const gate = ghost.getData('logicGate');
                    if (gate) {
                        gate.inputs.forEach((n) => {
                            if (n._circle) {
                                const mat = n._circle.getWorldTransformMatrix();
                                n.x = mat.tx; n.y = mat.ty; if (n.wire) n.wire.draw();
                            }
                        });
                        if (gate.output && gate.output._circle) {
                            const mat = gate.output._circle.getWorldTransformMatrix();
                            gate.output.x = mat.tx; gate.output.y = mat.ty; if (gate.output.wire) gate.output.wire.draw();
                        }
                    }
                    this.placedComponents.push(ghost);
                }
                icon._ghost = null;
                // ensure icon returns to original place
                icon.x = panelWidth / 2; icon.y = y;
            });
        });
    }

    createGrid() {
        const { width, height } = this.cameras.main;
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x8b7355, 0.35);
        for (let x = 150; x < width; x += this.gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(x, 0);
            gridGraphics.lineTo(x, height);
            gridGraphics.strokePath();
        }
        for (let y = 0; y < height; y += this.gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(150, y);
            gridGraphics.lineTo(width, y);
            gridGraphics.strokePath();
        }
    }

    snapToGrid(x, y) {
        const startX = 150;
        const snappedX = Math.round((x - startX) / this.gridSize) * this.gridSize + startX;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;
        return { x: snappedX, y: snappedY };
    }

    createNewBooleanComponent(x, y, key) {
        // Create a container that can be dragged
        const container = this.add.container(x, y);
        const img = this.add.image(0, 0, key).setOrigin(0.5);
        // Preserve aspect ratio for placed components
        const desiredWidth = 80;
        try {
            const tex = this.textures.get(key);
            const src = tex && tex.getSourceImage ? tex.getSourceImage() : null;
            const naturalW = src ? src.width : img.width;
            const naturalH = src ? src.height : img.height;
            const desiredHeight = Math.max(1, Math.round(desiredWidth * (naturalH / naturalW)));
            img.setDisplaySize(desiredWidth, desiredHeight);
        } catch (e) {
            img.setDisplaySize(80, 80);
        }

        // Don't make individual elements interactive - let container handle everything
        img.setData('isComponentImage', true);
        img.setData('component', container);

        container.add(img);

        const label = this.add.text(0, 40, key.toUpperCase(), { fontSize: '12px', color: '#fff', backgroundColor: '#00000088', padding: { x: 4, y: 2 } }).setOrigin(0.5);
        container.add(label);

        // make container draggable with a larger interactive area to ensure dragging works
        const interactiveArea = new Phaser.Geom.Rectangle(-50, -50, 100, 100);
        container.setInteractive(interactiveArea, Phaser.Geom.Rectangle.Contains);

        // Make the interactive area visible for debugging (reduced opacity)
        const debugRect = this.add.rectangle(0, 0, 100, 100, 0x00ff00, 0.1).setOrigin(0.5);
        debugRect.setStrokeStyle(1, 0x00ff00, 0.3);
        container.add(debugRect);

        this.input.setDraggable(container);
        container.setData('isDragging', false);
        container.setData('component', container); // self-reference for easier lookup

        // Add debug for container interactions and handle right-clicks
        container.on('pointerdown', (pointer) => {
            console.log('Container pointerdown:', pointer.button, 'leftButtonDown:', pointer.leftButtonDown());

            // Handle right-click for context menu
            const isRightClick = pointer.button === 2 ||
                (pointer.event && pointer.event.button === 2);

            if (isRightClick) {
                console.log('Right click detected on container');
                // Prevent default dragging for right-clicks
                pointer.preventDefault?.();
                // We'll let the scene's general right-click handler manage the context menu
            }
        });

        container.on('dragstart', () => {
            console.log('Container dragstart');
            container.setData('isDragging', true);
        });

        container.on('drag', (pointer, dragX, dragY) => {
            console.log('Container drag event triggered:', dragX, dragY, 'isDragging:', container.getData('isDragging'));
            container.x = dragX;
            container.y = dragY;
            // update node world positions
            gate.inputs.forEach((n) => {
                if (n._circle) {
                    const worldPoint = n._circle.getWorldTransformMatrix();
                    console.log('Drag event updating node position from rotation values to world transform values');
                    n.x = worldPoint.tx;
                    n.y = worldPoint.ty;
                    if (n.wire) n.wire.draw();
                }
            });
            if (gate.output._circle) {
                const worldPoint = gate.output._circle.getWorldTransformMatrix();
                console.log('Drag event updating output position from rotation values to world transform values');
                gate.output.x = worldPoint.tx;
                gate.output.y = worldPoint.ty;
                if (gate.output.wire) gate.output.wire.draw();
            }
        });

        container.on('dragend', () => {
            console.log('Container dragend');
            container.setData('isDragging', false);

            // Check if component was dragged from panel
            const fromPanel = container.getData('fromPanel');
            if (fromPanel) {
                const isInPanel = container.x < 150;
                if (isInPanel) {
                    // drop back: destroy temporary container and its nodes
                    container.destroy();
                    return;
                }
                // Remove the fromPanel flag as it's now being placed
                container.setData('fromPanel', false);
                // Add to placed components list
                if (!this.placedComponents.includes(container)) {
                    this.placedComponents.push(container);
                }
            }

            // Snap to grid
            const snapped = this.snapToGrid(container.x, container.y);
            container.x = snapped.x;
            container.y = snapped.y;

            // update node positions after snapping
            gate.inputs.forEach((n) => {
                if (n._circle) {
                    const worldPoint = n._circle.getWorldTransformMatrix();
                    n.x = worldPoint.tx;
                    n.y = worldPoint.ty;
                    if (n.wire) n.wire.draw();
                }
            });
            if (gate.output._circle) {
                const worldPoint = gate.output._circle.getWorldTransformMatrix();
                gate.output.x = worldPoint.tx;
                gate.output.y = worldPoint.ty;
                if (gate.output.wire) gate.output.wire.draw();
            }

            // Ensure the container remains draggable after placement
            if (!this.input.getDragState(container)) {
                this.input.setDraggable(container);
            }
        });

        // Create logic component and nodes
        const id = `${key}_${Math.floor(Math.random() * 100000)}`;
        const gate = new BooleanGate(key, id);

        // helper to create a circle UI for a node
        const createNodeCircle = (node, offsetX, offsetY, isOutput = false) => {
            const circle = this.add.circle(offsetX, offsetY, 6, isOutput ? 0x0000ff : 0xff0000).setOrigin(0.5);
            circle.setInteractive({ useHandCursor: true });
            circle.setData('logicNode', node);
            circle.setData('component', container);
            circle.setData('isOutput', isOutput);
            container.add(circle);

            // store reference for updates
            node.componentObject = container;
            node._circle = circle;
            // Initialize world coords for node
            node.x = container.x + circle.x;
            node.y = container.y + circle.y;
            node.initX = circle.x;
            node.initY = circle.y;

            // pointerdown to start wiring
            circle.on('pointerdown', (pointer) => {
                console.log('Circle pointerdown:', pointer.button, 'leftButtonDown:', pointer.leftButtonDown());

                // Only handle left clicks for wiring (button 0 is left click)
                if (pointer.button !== 0) {
                    console.log('Not left click, ignoring');
                    return;
                }

                console.log('Starting wire from node');

                // Temporarily disable dragging on the container during wiring
                const parentContainer = node.componentObject;
                if (parentContainer) {
                    parentContainer.disableInteractive();
                    console.log('Disabled container dragging for wiring');
                }

                // Stop event propagation to prevent container dragging during wiring
                if (pointer.event && pointer.event.stopPropagation) {
                    pointer.event.stopPropagation();
                }

                circle.setFillStyle(0x999999);
                let startNode = circle.getData('logicNode');

                // on pointerup try to connect to target node and re-enable container dragging
                this.input.once('pointerup', (pointer) => {
                    console.log('Wire connection attempt');

                    // Re-enable container dragging
                    if (parentContainer) {
                        const interactiveArea = new Phaser.Geom.Rectangle(-50, -50, 100, 100);
                        parentContainer.setInteractive(interactiveArea, Phaser.Geom.Rectangle.Contains);
                        console.log('Re-enabled container dragging after wiring');
                    }

                    const objects = this.input.hitTestPointer(pointer);
                    const target = objects.find((o) => o && o.getData && o.getData('logicNode'));
                    if (target) {
                        const targetNode = target.getData('logicNode');
                        if (targetNode && targetNode !== startNode) {
                            const startIsOut = circle.getData('isOutput');
                            const targetIsOut = target.getData('isOutput');
                            // Only allow connecting output to input (or vice-versa)
                            if (startIsOut === targetIsOut) {
                                console.log('Same direction connection, ignoring');
                                // same direction, ignore
                            } else {
                                console.log('Creating wire connection');
                                const wire = new Wire(startNode, targetNode, this);

                                // propagate current values across new wire
                                if (startNode.bit_value) targetNode.setBit(startNode.bit_value);
                                if (targetNode.bit_value) startNode.setBit(targetNode.bit_value);
                            }
                        }
                    }
                    circle.setFillStyle(isOutput ? 0x0000ff : 0xff0000);
                });
            });

            return circle;
        };

        // Position nodes: inputs on left, output on right
        const bboxW = img.displayWidth;
        const bboxH = img.displayHeight;

        // Position input nodes (if any)
        const inputsCount = gate.inputs.length;
        if (inputsCount > 0) {
            const inOffsets = [];
            if (inputsCount === 1) {
                inOffsets.push({ x: -bboxW / 2 , y: 0 });
            } else {
                inOffsets.push({ x: -bboxW / 2 , y: -9 });
                inOffsets.push({ x: -bboxW / 2 , y: 9 });
            }

            gate.inputs.forEach((node, idx) => {
                const off = inOffsets[idx] || { x: -bboxW / 2, y: idx * 12 };
                console.log(`Creating input ${idx} circle at offset:`, off.x, off.y);
                const circle = createNodeCircle(node, off.x, off.y, false);
                console.log(`Created input ${idx} circle at position:`, circle.x, circle.y);
            });
        }

        // output circle (always present)
        const outOff = { x: bboxW / 2 , y: 0 };
        console.log(`Creating output circle at offset:`, outOff.x, outOff.y);
        const outCircle = createNodeCircle(gate.output, outOff.x, outOff.y, true);
        console.log(`Created output circle at position:`, outCircle.x, outCircle.y);

        // store gate reference on container for cleanup and right-click detection
        container.setData('logicGate', gate);
        container.setData('component', container); // self-reference for easier lookup

        // Switch components: initialize visual state and disable click-to-toggle
        if (key === 'switch-on' || key === 'switch-off') {
            // Initialize visual state based on gate type and output
            const initialValue = key === 'switch-on' ? 1 : 0;
            gate.output.setBit(initialValue);
            img.setTint(initialValue ? 0xffffaa : 0xffffff);
            container.setData('isSwitch', true);
        }

        return container;
    }

    cleanup() {
        // Destroy all placed components
        if (this.placedComponents && this.placedComponents.length) {
            this.placedComponents.forEach((c) => {
                try {
                    // If it has a logic gate, clear node wires
                    const gate = c.getData && c.getData('logicGate');
                    if (gate) {
                        gate.inputs.forEach((n) => {
                            if (n && n.wire) n.wire.deleteWire();
                        });
                        if (gate.output && gate.output.wire) gate.output.wire.deleteWire();
                    }
                    if (c.destroy) c.destroy();
                } catch (e) { }
            });
            this.placedComponents = [];
        }
    }

}
