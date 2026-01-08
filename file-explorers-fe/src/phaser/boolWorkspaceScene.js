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
        } catch (e) {}
        try {
            const canvas = this.game && this.game.canvas ? this.game.canvas : null;
            if (canvas && !canvas._rupsContextMenuListenerAdded) {
                canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
                canvas._rupsContextMenuListenerAdded = true;
            }
        } catch (e) {}

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
            try { if (pointer && pointer.event && typeof pointer.event.preventDefault === 'function') pointer.event.preventDefault(); } catch (e) {}

            const objects = this.input.hitTestPointer(pointer);
            const target = objects.find((o) => o && o.getData && (o.getData('logicNode') || o.getData('component') || (o.parentContainer && o.parentContainer.getData && o.parentContainer.getData('logicGate'))));
            let compContainer = null;
            if (!target) return;
            if (target.getData('component')) compContainer = target.getData('component');
            else if (target.parentContainer && target.parentContainer.getData && target.parentContainer.getData('logicGate')) compContainer = target.parentContainer;
            else if (target.getData('logicNode') && target.getData('logicNode').componentObject) compContainer = target.getData('logicNode').componentObject;

            if (!compContainer) return;

            // Build context menu items; add switch-specific toggle option when applicable
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
                            const newVal = gate.output.bit_value ? 0 : 1;
                            gate.output.setBit(newVal);
                            // find image child and update tint
                            const img = compContainer.list && compContainer.list.find((c) => c && c.texture && typeof c.setTint === 'function');
                            if (img) img.setTint(newVal ? 0xffffaa : 0xffffff);
                        } catch (e) {}
                    },
                });
            }

            createContextMenu(this, pointer.worldX, pointer.worldY, items);
        });

        const rotateComponent = (container) => {
            const newAngle = (container.angle + 90) % 360;
            container.angle = newAngle;
            // update circles positions according to rotated coords
            const gate = container.getData('logicGate');
            if (!gate) return;
            // For each node, recompute position based on its initial offsets (initX/initY)
            gate.inputs.forEach((n) => {
                if (n._circle) {
                    const ox = n.initX || n._circle.x;
                    const oy = n.initY || n._circle.y;
                    // rotate (ox,oy) by +90 deg: (x,y)->(y,-x)
                    const rx = oy;
                    const ry = -ox;
                    n._circle.x = rx; n._circle.y = ry;
                }
            });
            if (gate.output && gate.output._circle) {
                const ox = gate.output.initX || gate.output._circle.x;
                const oy = gate.output.initY || gate.output._circle.y;
                gate.output._circle.x = oy; gate.output._circle.y = -ox;
            }

            // After moving circles, update world node positions
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
        container.add(img);

        const label = this.add.text(0, 40, key.toUpperCase(), { fontSize: '12px', color: '#fff', backgroundColor: '#00000088', padding: { x: 4, y: 2 } }).setOrigin(0.5);
        container.add(label);

        container.setSize(80, 100);
        // make container draggable by using a bounding rectangle interactive region
        container.setInteractive(new Phaser.Geom.Rectangle(-img.displayWidth / 2, -img.displayHeight / 2, img.displayWidth, img.displayHeight), Phaser.Geom.Rectangle.Contains);
        this.input.setDraggable(container);
        container.setData('isDragging', false);
        container.on('dragstart', () => { container.setData('isDragging', true); });

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
                circle.setFillStyle(0x999999);
                let startNode = circle.getData('logicNode');
                // on pointerup try to connect to target node
                this.input.once('pointerup', (pointer) => {
                    const objects = this.input.hitTestPointer(pointer);
                    const target = objects.find((o) => o && o.getData && o.getData('logicNode'));
                    if (target) {
                        const targetNode = target.getData('logicNode');
                        if (targetNode && targetNode !== startNode) {
                            const startIsOut = circle.getData('isOutput');
                            const targetIsOut = target.getData('isOutput');
                            // Only allow connecting output to input (or vice-versa)
                            if (startIsOut === targetIsOut) {
                                // same direction, ignore
                            } else {
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
        const inOffsets = [];
        const inputsCount = gate.inputs.length;
        if (inputsCount === 1) {
            inOffsets.push({ x: -bboxW / 2 - 10, y: 0 });
        } else {
            inOffsets.push({ x: -bboxW / 2 - 10, y: -12 });
            inOffsets.push({ x: -bboxW / 2 - 10, y: 12 });
        }

        gate.inputs.forEach((node, idx) => {
            const off = inOffsets[idx] || { x: -bboxW / 2 - 10, y: idx * 12 };
            const circle = createNodeCircle(node, off.x, off.y, false);
        });

        // output circle
        const outOff = { x: bboxW / 2 + 10, y: 0 };
        const outCircle = createNodeCircle(gate.output, outOff.x, outOff.y, true);

        // store gate reference on container for cleanup
        container.setData('logicGate', gate);

        // Switch components: do not toggle on click. Use context menu 'Toggle' instead.
        if (key === 'switch-on' || key === 'switch-off') {
            img.setInteractive({ useHandCursor: true });
            // initialize visual state based on current output
            try { img.setTint(gate.output.bit_value ? 0xffffaa : 0xffffff); } catch (e) {}
            container.setData('isSwitch', true);
        }

        container.on('drag', (pointer, dragX, dragY) => {
            container.x = dragX;
            container.y = dragY;
            // update node world positions
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
        });

        container.on('dragend', () => {
            container.setData('isDragging', false);
            const isInPanel = container.x < 150;
            if (isInPanel) {
                // drop back: destroy temporary container and its nodes
                container.destroy();
                return;
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

            // mark as placed and keep for cleanup
            this.placedComponents.push(container);
        });

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
                } catch (e) {}
            });
            this.placedComponents = [];
        }
    }

}
