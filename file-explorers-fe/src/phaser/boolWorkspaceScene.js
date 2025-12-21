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

        // Listen for scene shutdown and cleanup
        this.events.once('shutdown', () => this.cleanup());
        this.events.once('destroy', () => this.cleanup());

        // Back button
        new (require('./UI/UIButton').default)(this, {
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

            // Make icon interactive: click to add copy to workspace
            icon.setInteractive({ useHandCursor: true });
            icon.on('pointerdown', () => {
                this.createNewBooleanComponent(panelWidth + 120, y, c.key);
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
        container.setInteractive({ draggable: true, useHandCursor: true });
        this.input.setDraggable(container);

        container.on('drag', (pointer, dragX, dragY) => {
            container.x = dragX;
            container.y = dragY;
        });

        container.on('dragend', () => {
            const isInPanel = container.x < 150;
            if (isInPanel) {
                // drop back: destroy temporary container
                container.destroy();
                return;
            }
            // Snap to grid
            const snapped = this.snapToGrid(container.x, container.y);
            container.x = snapped.x;
            container.y = snapped.y;

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
                    if (c.destroy) c.destroy();
                } catch (e) {}
            });
            this.placedComponents = [];
        }
    }

}
