import Phaser from "phaser";
import { Battery } from "./phaserComponents/battery";
import { Bulb } from "./phaserComponents/bulb";
import { Wire } from "./phaserComponents/wire";
import { CircuitGraph } from "./logic/circuit_graph";
import { Node } from "./logic/node";
import { Switch } from "./phaserComponents/switch";
import { Resistor } from "./phaserComponents/resistor";
import UIButton from "./UI/UIButton";
import Oscilloscope from "./UI/Oscilloscope";
import {
    createComponent,
    openComponentContextMenu,
} from "./phaserComponents/ComponentHelper";
import { CircuitSim } from "./logic/circuit_sim.js";
import router from '@/router';
import { loadSettings, folderColorMap, textColorMap } from '@/composables/useSettings';

// Asset imports (bundler will replace these with URLs)
import baterijaImg from './phaserComponents/battery.svg';
import resistorImg from './phaserComponents/resistor1.svg';
import diodeImg from './phaserComponents/diode.svg';
import switchOnImg from './phaserComponents/switch-on.svg';
import switchOffImg from './phaserComponents/switch-off.svg';
import wireImg from './phaserComponents/wire.png';
import ampermeterImg from './phaserComponents/ampermeter.svg';
import voltmeterImg from './phaserComponents/voltmeter.svg';

export default class WorkspaceScene extends Phaser.Scene {
    constructor() {
        super("WorkspaceScene");
        this.sim = new CircuitSim();
    }

    init() {
        const savedIndex = localStorage.getItem("currentChallengeIndex");
        this.currentChallengeIndex =
            savedIndex !== null ? parseInt(savedIndex) : 0;
        
        // Load color settings
        const settings = loadSettings();
        this.primaryColorHex = folderColorMap[settings.folderColor] || folderColorMap.default;
        this.primaryColor = parseInt(this.primaryColorHex.replace('#', '0x'), 16);
        this.textColorHex = textColorMap[settings.textColor] || textColorMap.default;
        
        // Calculate derived colors
        this.darken = (hex, percent) => {
            const num = parseInt(hex.replace('#', ''), 16);
            const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - percent)));
            const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - percent)));
            const b = Math.max(0, Math.floor((num & 0xff) * (1 - percent)));
            return (r << 16) | (g << 8) | b;
        };
        
        this.deskColor = this.darken(this.primaryColorHex, 0.4);
        this.gridColor = this.darken(this.primaryColorHex, 0.6);
    }

    preload() {
        this.graph = new CircuitGraph();
        // Use imported URLs so bundler resolves correct paths
        this.load.image("baterija", baterijaImg);
        this.load.image("upor", resistorImg);
        this.load.image("svetilka", diodeImg);
        this.load.image("stikalo-on", switchOnImg);
        this.load.image("stikalo-off", switchOffImg);
        this.load.image("žica", wireImg);
        this.load.image("ampermeter", ampermeterImg);
        this.load.image("voltmeter", voltmeterImg);
    }

    create() {
        const { width, height } = this.cameras.main;
        this.sim = new CircuitSim();
        this.clearAllComponents();

        // površje mize - use darker version of primary color
        const deskColor = this.deskColor || 0xe0c9a6;
        const desk = this.add
            .rectangle(0, 0, width, height, deskColor)
            .setOrigin(0);

        const gridGraphics = this.add.graphics();
        const gridColor = this.gridColor || 0x8b7355;
        gridGraphics.lineStyle(1, gridColor, 0.35);
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(x, 0);
            gridGraphics.lineTo(x, height);
            gridGraphics.strokePath();
        }
        for (let y = 0; y < height; y += gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(0, y);
            gridGraphics.lineTo(width, y);
            gridGraphics.strokePath();
        }

        this.infoWindow = this.add.container(0, 0);
        this.infoWindow.setDepth(1000);
        this.infoWindow.setVisible(false);
        // ozadje info okna
        const infoBox = this.add.rectangle(0, 0, 200, 80, 0x2c2c2c, 0.95);
        infoBox.setStrokeStyle(2, 0xffffff);
        const textColor = this.textColorHex || "#ffffff";
        const infoText = this.add
            .text(0, 0, "", {
                fontSize: "14px",
                color: textColor,
                align: "left",
                wordWrap: { width: 180 },
            })
            .setOrigin(0.5);

        this.infoWindow.add([infoBox, infoText]);
        this.infoText = infoText;

        // this.currentChallengeIndex = 0;

        this.checkText = this.add
            .text(width / 2, height - 70, "", {
                fontSize: "18px",
                color: "#cc0000",
                fontStyle: "bold",
                padding: { x: 15, y: 8 },
            })
            .setOrigin(0.5);

        // stranska vrstica na levi
        const panelWidth = 220;
        this.panelWidth = panelWidth;
        const panelColor = this.primaryColor || 0x294e26;
        this.add.rectangle(0, 0, panelWidth, height, panelColor).setOrigin(0);
        this.add
            .rectangle(0, 0, panelWidth, height, 0x000000, 0.2)
            .setOrigin(0);

        // Button colors
        const buttonHoverColor = this.darken(this.primaryColorHex, 0.8);

        // Back button with background style
        new UIButton(this, {
            x: panelWidth / 2,
            y: 30,
            text: "Nazaj",
            onClick: () => {
                this.placedComponents.forEach((comp) => comp.destroy());
                this.cameras.main.fade(300, 0, 0, 0);
                this.time.delayedCall(300, () => {
                    try {
                        router.push({ name: 'landing' });
                    } catch (e) {
                        window.location.href = '/';
                    }
                });
            },
            background: {
                width: 190,
                height: 35,
                color: this.primaryColor,
                hoverColor: buttonHoverColor,
            },
            style: {
                fontSize: "16px",
                color: this.textColorHex,
            },
        });

        // Buttons above component panel
        new UIButton(this, {
            x: panelWidth / 2,
            y: 75,
            text: "Simulacija",
            onClick: () => this.sim.init(),
            background: {
                width: 190,
                height: 35,
                color: this.primaryColor,
                hoverColor: buttonHoverColor,
            },
            style: {
                fontSize: "14px",
                color: this.textColorHex,
            },
        });
        window.sim = this.sim; // DEBUGGING PURPOSES

        new UIButton(this, {
            x: panelWidth / 2,
            y: 115,
            text: "Formule",
            onClick: () => this.showCalculationFormulas(),
            background: {
                width: 190,
                height: 35,
                color: this.primaryColor,
                hoverColor: buttonHoverColor,
            },
            style: {
                fontSize: "14px",
                color: this.textColorHex,
            },
        });

        new UIButton(this, {
            x: panelWidth / 2,
            y: 155,
            text: "Export",
            onClick: () => this.exportComponents(),
            background: {
                width: 190,
                height: 35,
                color: this.primaryColor,
                hoverColor: buttonHoverColor,
            },
            style: {
                fontSize: "14px",
                color: this.textColorHex,
            },
        });

        new UIButton(this, {
            x: panelWidth / 2,
            y: 195,
            text: "Import",
            onClick: () => this.importComponents(),
            background: {
                width: 190,
                height: 35,
                color: this.primaryColor,
                hoverColor: buttonHoverColor,
            },
            style: {
                fontSize: "14px",
                color: this.textColorHex,
            },
        });

        this.add
            .text(panelWidth / 2, 240, "Komponente", {
                fontSize: "18px",
                color: textColor,
                fontStyle: "bold",
            })
            .setOrigin(0.5);

        // Create scrollable area for components
        const componentStartY = 260;
        const componentAreaHeight = height - componentStartY;
        
        this.componentScrollOffset = 0;
        this.panelComponents = [];
        
        // Create mask for scrollable area
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, componentStartY, panelWidth, componentAreaHeight);
        const mask = maskShape.createGeometryMask();
        this.panelComponentMask = mask;
        
        // komponente v stranski vrstici with larger spacing
        const componentSpacing = 100;
        const components = [
            { y: componentStartY + 50, type: "baterija", color: 0xffcc00 },
            { y: componentStartY + 50 + componentSpacing, type: "upor", color: 0xff6600 },
            { y: componentStartY + 50 + componentSpacing * 2, type: "svetilka", color: 0xff0000 },
            { y: componentStartY + 50 + componentSpacing * 3, type: "stikalo-on", color: 0x666666 },
            { y: componentStartY + 50 + componentSpacing * 4, type: "ampermeter", color: 0x00cc66 },
            { y: componentStartY + 50 + componentSpacing * 5, type: "voltmeter", color: 0x00cc66 },
        ];
        
        components.forEach(comp => {
            const component = this.createNewComponent(panelWidth / 2, comp.y, comp.type, comp.color);
            if (component) {
                component.setMask(mask);
                component.setDepth(100); // Ensure components are above the scroll zone
                this.panelComponents.push({ obj: component, baseY: comp.y });
            }
        });
        
        // Add scroll functionality - zone should be below components
        const scrollZone = this.add.zone(panelWidth / 2, (componentStartY + height) / 2, panelWidth, componentAreaHeight);
        scrollZone.setDepth(-1); // Put zone below components so it doesn't block drag
        scrollZone.setInteractive();
        scrollZone.on('wheel', (pointer, deltaX, deltaY) => {
            const totalComponentHeight = componentSpacing * 6 + 100;
            const maxScroll = Math.max(0, totalComponentHeight - componentAreaHeight);
            
            this.componentScrollOffset = Phaser.Math.Clamp(
                this.componentScrollOffset + deltaY * 0.5,
                -maxScroll,
                0
            );
            
            // Update positions of panel components
            this.panelComponents.forEach(comp => {
                comp.obj.y = comp.baseY + this.componentScrollOffset;
            });
        });

        // shrani komponente na mizi
        this.placedComponents = [];
        this.gridSize = 40;

        // Listen for right-clicks on the scene and open menu when a component is under pointer
        this.input.on("pointerdown", (pointer) => {
            const isRightClick =
                (pointer.event && pointer.event.button === 2) ||
                (pointer.rightButtonDown && pointer.rightButtonDown()) ||
                (typeof pointer.buttons !== "undefined" &&
                    pointer.buttons === 2);

            if (!isRightClick) return;

            const objects = this.input.hitTestPointer(pointer);
            const target = objects.find(
                (o) => o && o.getData && o.getData("logicComponent")
            );
            if (target) {
                openComponentContextMenu(
                    this,
                    target,
                    pointer.worldX,
                    pointer.worldY,
                    this.textColorHex
                );
                try {
                    if (
                        pointer.event &&
                        typeof pointer.event.preventDefault === "function"
                    )
                        pointer.event.preventDefault();
                } catch (e) { }
            }
        });

   

        console.log(JSON.parse(localStorage.getItem("users")));
    }

    getComponentDetails(type) {
        const details = {
            baterija: "Napetost: 3.3 V\nVir električne energije",
            upor: "Uporabnost: omejuje tok\nMeri se v ohmih (Ω)",
            svetilka: "Pretvarja električno energijo v svetlobo",
            "stikalo-on": "Dovoljuje pretok toka",
            "stikalo-off": "Prepreči pretok toka",
            žica: "Povezuje komponente\nKlikni za obračanje",
            ampermeter: "Meri električni tok\nEnota: amperi (A)",
            voltmeter: "Meri električno napetost\nEnota: volti (V)",
        };
        return details[type] || "Komponenta";
    }

    createGrid() {
        const { width, height } = this.cameras.main;
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(2, 0x8b7355, 0.4);

        const gridSize = 40;
        const startX = 200;

        // vertikalne črte
        for (let x = startX; x < width; x += gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(x, 0);
            gridGraphics.lineTo(x, height);
            gridGraphics.strokePath();
        }

        // horizontalne črte
        for (let y = 0; y < height; y += gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(startX, y);
            gridGraphics.lineTo(width, y);
            gridGraphics.strokePath();
        }
    }

    snapToGrid(x, y) {
        const gridSize = this.gridSize;
        const startX = 200;

        // komponeta se postavi na presečišče
        const snappedX =
            Math.round((x - startX) / gridSize) * gridSize + startX;
        const snappedY = Math.round(y / gridSize) * gridSize;

        return { x: snappedX, y: snappedY };
    }

    getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }

    updateLogicNodePositions(component) {
        const comp = component.getData("logicComponent");
        if (!comp) return;
        console.log("Updating logic node positions for", comp.id);
        // derive local offsets: prefer comp-local offsets, else use half display
        const halfW = 40;
        const halfH = 40;

        const localStart = comp.localStart || { x: -halfW, y: 0 };
        const localEnd = comp.localEnd || { x: halfW, y: 0 };

        // get container angle in radians (Phaser keeps both .angle and .rotation)
        const theta =
            typeof component.rotation === "number" && component.rotation
                ? component.rotation
                : Phaser.Math.DegToRad(component.angle || 0);

        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const rotate = (p) => ({
            x: Math.round(p.x * cos - p.y * sin),
            y: Math.round(p.x * sin + p.y * cos),
        });

        const rStart = rotate(localStart);
        const rEnd = rotate(localEnd);

        const worldStart = {
            x: component.x + rStart.x,
            y: component.y + rStart.y,
        };
        const worldEnd = { x: component.x + rEnd.x, y: component.y + rEnd.y };

        const snappedStart = this.snapToGrid(worldStart.x, worldStart.y);
        const snappedEnd = this.snapToGrid(worldEnd.x, worldEnd.y);

        if (comp.start) {
            comp.start.x = snappedStart.x;
            comp.start.y = snappedStart.y;
            if (!comp.start.connected) comp.start.connected = new Set();
            this.graph.addNode(comp.start);
        }
        if (comp.end) {
            comp.end.x = snappedEnd.x;
            comp.end.y = snappedEnd.y;
            if (!comp.end.connected) comp.end.connected = new Set();
            this.graph.addNode(comp.end);
        }

        // debug dots are top-level objects (not children). update their positions
        const startDot = component.getData("startDot");
        const endDot = component.getData("endDot");
        if (startDot && comp.start) {
            startDot.x = comp.start.x;
            startDot.y = comp.start.y;
        }
        if (endDot && comp.end) {
            endDot.x = comp.end.x;
            endDot.y = comp.end.y;
        }
    }

    createNewComponent(x, y, type, color) {
        const component = createComponent(
            this,
            x,
            y,
            type,
            color,
            this.wireGraphics,
            this.textColorHex
        );
        if (!window.components) window.components = [];
        console.log("Created component:", component);
        window.components.push(component.getData("logicComponent"));
        return component;
    }

    showCalculationFormulas() {
        // Create modal background
        if (this.calculationModal) {
            this.calculationModal.destroy();
            this.calculationModal = null;
            return;
        }

        const width = this.scale.width;
        const height = this.scale.height;

        this.calculationModal = this.add.container(0, 0);

        // Semi-transparent background
        const bg = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.7
        );
        bg.setInteractive();
        bg.on("pointerdown", () => {
            this.calculationModal.destroy();
            this.calculationModal = null;
        });

        // Modal panel
        const panelWidth = 700;
        const panelHeight = 550;
        const panel = this.add.rectangle(
            width / 2,
            height / 2,
            panelWidth,
            panelHeight,
            0xffffff
        );
        panel.setStrokeStyle(3, 0x333333);

        // Title
        const title = this.add.text(
            width / 2,
            height / 2 - panelHeight / 2 + 30,
            "Formule za Izračune",
            {
                fontSize: "28px",
                fontStyle: "bold",
                color: this.textColorHex,
            }
        );
        title.setOrigin(0.5);

        // Create scrollable content area
        const contentX = width / 2 - panelWidth / 2 + 40;
        const contentStartY = height / 2 - panelHeight / 2 + 80;
        const contentAreaHeight = panelHeight - 150; // Space for title and close button
        const lineHeight = 35;

        // Create a container for scrollable content
        const scrollContainer = this.add.container(0, 0);
        let currentY = 0;

        const formulas = [
            {
                section: "Ohmov zakon:",
                style: {
                    fontSize: "20px",
                    fontStyle: "bold",
                    color: this.textColorHex,
                },
            },
            {
                text: "U = I × R    (Napetost = Tok × Upor)",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            {
                text: "I = U / R     (Tok = Napetost / Upor)",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            {
                text: "R = U / I     (Upor = Napetost / Tok)",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            { text: "", style: {} },

            {
                section: "Zaporedna vezava (serijska):",
                style: {
                    fontSize: "20px",
                    fontStyle: "bold",
                    color: this.textColorHex,
                },
            },
            {
                text: "R_skupni = R₁ + R₂ + R₃ + ...",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            {
                text: "I_skupni = I₁ = I₂ = I₃ = ... (enak tok)",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            {
                text: "U_skupni = U₁ + U₂ + U₃ + ...",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            { text: "", style: {} },

            {
                section: "Vzporedna vezava (paralelna):",
                style: {
                    fontSize: "20px",
                    fontStyle: "bold",
                    color: this.textColorHex,
                },
            },
            {
                text: "1/R_skupni = 1/R₁ + 1/R₂ + 1/R₃ + ...",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            {
                text: "U_skupni = U₁ = U₂ = U₃ = ...(enaka napetost)",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            {
                text: "I_skupni = I₁ + I₂ + I₃ + ...",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            { text: "", style: {} },

            {
                section: "Moč:",
                style: {
                    fontSize: "20px",
                    fontStyle: "bold",
                    color: this.textColorHex,
                },
            },
            {
                text: "P = U × I    (Moč = Napetost × Tok)",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            {
                text: "P = I² × R   (Moč = Tok² × Upor)",
                style: { fontSize: "16px", color: this.textColorHex },
            },
            {
                text: "P = U² / R   (Moč = Napetost² / Upor)",
                style: { fontSize: "16px", color: this.textColorHex },
            },
        ];

        formulas.forEach((formula) => {
            if (formula.section) {
                const sectionText = this.add.text(
                    0,
                    currentY,
                    formula.section,
                    formula.style
                );
                scrollContainer.add(sectionText);
                currentY += lineHeight;
            } else if (formula.text === "") {
                currentY += 15;
            } else {
                const formulaText = this.add.text(
                    20,
                    currentY,
                    formula.text,
                    formula.style
                );
                scrollContainer.add(formulaText);
                currentY += lineHeight - 5;
            }
        });

        const totalContentHeight = currentY;

        // Set initial position of scroll container
        scrollContainer.x = contentX;
        scrollContainer.y = contentStartY;

        // Create mask for scrollable area
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(
            contentX,
            contentStartY,
            panelWidth - 80,
            contentAreaHeight
        );
        const mask = maskShape.createGeometryMask();
        scrollContainer.setMask(mask);

        let scrollOffset = 0;

        // Scroll zone (invisible interactive area)
        const scrollZone = this.add.rectangle(
            width / 2,
            contentStartY + contentAreaHeight / 2,
            panelWidth - 40,
            contentAreaHeight,
            0xffffff,
            0
        );
        scrollZone.setInteractive();

        // Mouse wheel scrolling
        scrollZone.on("wheel", (pointer, deltaX, deltaY) => {
            scrollOffset += deltaY * 0.5;
            const maxScroll = Math.max(
                0,
                totalContentHeight - contentAreaHeight
            );
            scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
            scrollContainer.y = contentStartY - scrollOffset;
        });

        // Drag scrolling
        let isDragging = false;
        let dragStartY = 0;
        let dragStartScroll = 0;

        scrollZone.on("pointerdown", (pointer) => {
            isDragging = true;
            dragStartY = pointer.y;
            dragStartScroll = scrollOffset;
        });

        this.input.on("pointermove", (pointer) => {
            if (isDragging) {
                const deltaY = dragStartY - pointer.y;
                scrollOffset = dragStartScroll + deltaY;
                const maxScroll = Math.max(
                    0,
                    totalContentHeight - contentAreaHeight
                );
                scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
                scrollContainer.y = contentStartY - scrollOffset;
            }
        });

        this.input.on("pointerup", () => {
            isDragging = false;
        });

        // Close button
        const closeButton = this.add.rectangle(
            width / 2,
            height / 2 + panelHeight / 2 - 30,
            120,
            40,
            0x0066cc
        );
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on("pointerdown", () => {
            this.calculationModal.destroy();
            this.calculationModal = null;
        });
        closeButton.on("pointerover", () => closeButton.setFillStyle(0x0088ee));
        closeButton.on("pointerout", () => closeButton.setFillStyle(0x0066cc));

        const closeText = this.add.text(
            width / 2,
            height / 2 + panelHeight / 2 - 30,
            "Zapri",
            {
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff",
            }
        );
        closeText.setOrigin(0.5);

        // Add all elements to container (note: maskShape should NOT be added to avoid covering text)
        this.calculationModal.add([
            bg,
            panel,
            title,
            scrollContainer,
            scrollZone,
            closeButton,
            closeText,
        ]);
    }

    addPoints(points) {
        const user = localStorage.getItem("username");
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const userData = users.find((u) => u.username === user);
        if (userData) {
            userData.score = (userData.score || 0) + points;
        }
        localStorage.setItem("users", JSON.stringify(users));
    }
 


    /**
     * Test function to demonstrate oscilloscope with a sine wave
     */

    exportComponents() {
        if (!this.placedComponents || this.placedComponents.length === 0) {
            alert("Ni komponent za izvoz!");
            return;
        }

        const exportData = {
            version: "2.0",
            timestamp: new Date().toISOString(),
            components: [],
        };

        // Helper function to export a component
        const exportComponent = (visualContainer) => {
            const comp = visualContainer.getData("logicComponent");
            if (!comp || visualContainer.getData("isInPanel")) return null;

            const componentData = {
                id: comp.id,
                type: comp.type,
                name: comp.name,
                x: visualContainer.x,
                y: visualContainer.y,
                rotation: visualContainer.rotation || 0,
                start: {
                    id: comp.start.id,
                    x: comp.start.x,
                    y: comp.start.y,
                    wireId: comp.start.wire ? comp.start.wire.id : null,
                },
                end: {
                    id: comp.end.id,
                    x: comp.end.x,
                    y: comp.end.y,
                    wireId: comp.end.wire ? comp.end.wire.id : null,
                },
                // Export all component values
                values: {},
            };

            // Export component values (resistance, voltage, current, power, etc.)
            if (comp.values) {
                Object.keys(comp.values).forEach((key) => {
                    const value = comp.values[key];
                    // Handle both direct values and value objects {value, automatic}
                    if (
                        typeof value === "object" &&
                        value !== null &&
                        "value" in value
                    ) {
                        componentData.values[key] = {
                            value: value.value,
                            automatic:
                                value.automatic !== undefined
                                    ? value.automatic
                                    : false,
                        };
                    } else {
                        componentData.values[key] = value;
                    }
                });
            }

            // Backwards compatibility - keep old format for battery and resistor
            if (comp.type === "battery") {
                componentData.voltage =
                    comp.voltage ||
                    comp.values?.voltage?.value ||
                    comp.values?.maxVoltage?.value ||
                    comp.values?.maxVoltage ||
                    9;
            } else if (comp.type === "resistor") {
                componentData.resistance =
                    comp.resistance || comp.values?.resistance?.value || 100;
            }

            return componentData;
        };

        // First pass: Export battery first
        this.placedComponents.forEach((visualContainer) => {
            const comp = visualContainer.getData("logicComponent");
            const isInPanel = visualContainer.getData("isInPanel");

            if (comp && comp.type === "battery" && !isInPanel) {
                const componentData = exportComponent(visualContainer);
                if (componentData) {
                    exportData.components.push(componentData);
                }
            }
        });

        // Second pass: Export all other components
        this.placedComponents.forEach((visualContainer) => {
            const comp = visualContainer.getData("logicComponent");
            if (
                comp &&
                comp.type !== "battery" &&
                !visualContainer.getData("isInPanel")
            ) {
                const componentData = exportComponent(visualContainer);
                if (componentData) {
                    exportData.components.push(componentData);
                }
            }
        });

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `circuit_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert(`Izvoženo ${exportData.components.length} komponent!`);
    }

    importComponents() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importData = JSON.parse(event.target.result);

                    if (
                        !importData.components ||
                        !Array.isArray(importData.components)
                    ) {
                        throw new Error("Invalid file format");
                    }

                    this.clearAllComponents();

                    const nodeMap = new Map();
                    const wireMap = new Map();

                    // First pass: Find and load the battery first
                    const batteryData = importData.components.find(
                        (compData) => compData.type === "battery"
                    );
                    let batteryLogicComponent = null;

                    if (batteryData) {
                        const visualComponent = createComponent(
                            this,
                            batteryData.x,
                            batteryData.y,
                            "baterija",
                            0xffffff
                        );
                        batteryLogicComponent =
                            visualComponent.getData("logicComponent");

                        visualComponent.setData("isInPanel", false);

                        if (!window.components) window.components = [];
                        if (
                            !window.components.includes(batteryLogicComponent)
                        ) {
                            window.components.push(batteryLogicComponent);
                        }

                        this.placedComponents.push(visualComponent);

                        this.graph.addComponent(batteryLogicComponent);
                        if (batteryLogicComponent.start)
                            this.graph.addNode(batteryLogicComponent.start);
                        if (batteryLogicComponent.end)
                            this.graph.addNode(batteryLogicComponent.end);

                        if (batteryData.rotation) {
                            visualComponent.setRotation(batteryData.rotation);
                        }

                        this.updateLogicNodePositions(visualComponent);

                        // Import battery values BEFORE loading other components
                        if (batteryData.voltage) {
                            batteryLogicComponent.voltage = batteryData.voltage;
                            if (
                                batteryLogicComponent.values &&
                                batteryLogicComponent.values.voltage
                            ) {
                                if (
                                    typeof batteryLogicComponent.values
                                        .voltage === "object"
                                ) {
                                    batteryLogicComponent.values.voltage.value =
                                        batteryData.voltage;
                                } else {
                                    batteryLogicComponent.values.voltage =
                                        batteryData.voltage;
                                }
                            }
                        }

                        // Import all battery component values (new format)
                        if (
                            batteryData.values &&
                            batteryLogicComponent.values
                        ) {
                            Object.keys(batteryData.values).forEach((key) => {
                                const importedValue = batteryData.values[key];

                                // Handle value objects {value, automatic}
                                if (
                                    typeof importedValue === "object" &&
                                    importedValue !== null &&
                                    "value" in importedValue
                                ) {
                                    if (
                                        typeof batteryLogicComponent.values[
                                        key
                                        ] === "object" &&
                                        batteryLogicComponent.values[key] !==
                                        null
                                    ) {
                                        batteryLogicComponent.values[
                                            key
                                        ].value = importedValue.value;
                                        if (
                                            importedValue.automatic !==
                                            undefined
                                        ) {
                                            batteryLogicComponent.values[
                                                key
                                            ].automatic =
                                                importedValue.automatic;
                                        }
                                    } else {
                                        batteryLogicComponent.values[key] =
                                            importedValue.value;
                                    }
                                } else {
                                    // Direct value
                                    if (
                                        typeof batteryLogicComponent.values[
                                        key
                                        ] === "object" &&
                                        batteryLogicComponent.values[key] !==
                                        null &&
                                        "value" in
                                        batteryLogicComponent.values[key]
                                    ) {
                                        batteryLogicComponent.values[
                                            key
                                        ].value = importedValue;
                                    } else {
                                        batteryLogicComponent.values[key] =
                                            importedValue;
                                    }
                                }
                            });
                        }

                        const label = visualComponent.getData("displayLabel");
                        if (
                            label &&
                            batteryLogicComponent.values &&
                            batteryLogicComponent.values.name
                        ) {
                            label.setText(batteryLogicComponent.values.name);
                        }

                        nodeMap.set(
                            batteryData.start.id,
                            batteryLogicComponent.start
                        );
                        nodeMap.set(
                            batteryData.end.id,
                            batteryLogicComponent.end
                        );
                    }

                    // Second pass: Load all other components
                    importData.components.forEach((compData) => {
                        // Skip battery since we already loaded it
                        if (compData.type === "battery") return;

                        let visualType;
                        if (compData.type === "resistor") visualType = "upor";
                        else if (compData.type === "bulb")
                            visualType = "svetilka";
                        else if (compData.type === "switch")
                            visualType = "stikalo-on";
                        else if (
                            compData.type === "ammeter" ||
                            compData.type === "ampermeter"
                        )
                            visualType = "ampermeter";
                        else if (compData.type === "voltmeter")
                            visualType = "voltmeter";
                        else return;

                        const visualComponent = createComponent(
                            this,
                            compData.x,
                            compData.y,
                            visualType,
                            0xffffff
                        );
                        const logicComponent =
                            visualComponent.getData("logicComponent");

                        visualComponent.setData("isInPanel", false);

                        if (!window.components) window.components = [];
                        if (!window.components.includes(logicComponent)) {
                            window.components.push(logicComponent);
                        }

                        this.placedComponents.push(visualComponent);

                        this.graph.addComponent(logicComponent);
                        if (logicComponent.start)
                            this.graph.addNode(logicComponent.start);
                        if (logicComponent.end)
                            this.graph.addNode(logicComponent.end);

                        if (compData.rotation) {
                            visualComponent.setRotation(compData.rotation);
                        }

                        this.updateLogicNodePositions(visualComponent);

                        // Import component values - backwards compatibility for old format
                        if (
                            compData.type === "resistor" &&
                            compData.resistance
                        ) {
                            logicComponent.resistance = compData.resistance;
                            if (
                                logicComponent.values &&
                                logicComponent.values.resistance
                            ) {
                                if (
                                    typeof logicComponent.values.resistance ===
                                    "object"
                                ) {
                                    logicComponent.values.resistance.value =
                                        compData.resistance;
                                } else {
                                    logicComponent.values.resistance =
                                        compData.resistance;
                                }
                            }
                        }

                        // Import all component values (new format)
                        if (compData.values && logicComponent.values) {
                            Object.keys(compData.values).forEach((key) => {
                                const importedValue = compData.values[key];

                                // Handle value objects {value, automatic}
                                if (
                                    typeof importedValue === "object" &&
                                    importedValue !== null &&
                                    "value" in importedValue
                                ) {
                                    if (
                                        typeof logicComponent.values[key] ===
                                        "object" &&
                                        logicComponent.values[key] !== null
                                    ) {
                                        logicComponent.values[key].value =
                                            importedValue.value;
                                        if (
                                            importedValue.automatic !==
                                            undefined
                                        ) {
                                            logicComponent.values[
                                                key
                                            ].automatic =
                                                importedValue.automatic;
                                        }
                                    } else {
                                        logicComponent.values[key] =
                                            importedValue.value;
                                    }
                                } else {
                                    // Direct value
                                    if (
                                        typeof logicComponent.values[key] ===
                                        "object" &&
                                        logicComponent.values[key] !== null &&
                                        "value" in logicComponent.values[key]
                                    ) {
                                        logicComponent.values[key].value =
                                            importedValue;
                                    } else {
                                        logicComponent.values[key] =
                                            importedValue;
                                    }
                                }
                            });
                        }

                        const label = visualComponent.getData("displayLabel");
                        if (
                            label &&
                            logicComponent.values &&
                            logicComponent.values.name
                        ) {
                            label.setText(logicComponent.values.name);
                        }

                        nodeMap.set(compData.start.id, logicComponent.start);
                        nodeMap.set(compData.end.id, logicComponent.end);
                    });

                    const wireGroups = new Map();

                    importData.components.forEach((compData) => {
                        const startNode = nodeMap.get(compData.start.id);
                        const endNode = nodeMap.get(compData.end.id);

                        if (compData.start.wireId && startNode) {
                            if (!wireGroups.has(compData.start.wireId)) {
                                wireGroups.set(compData.start.wireId, []);
                            }
                            wireGroups
                                .get(compData.start.wireId)
                                .push(startNode);
                        }

                        if (compData.end.wireId && endNode) {
                            if (!wireGroups.has(compData.end.wireId)) {
                                wireGroups.set(compData.end.wireId, []);
                            }
                            wireGroups.get(compData.end.wireId).push(endNode);
                        }
                    });

                    wireGroups.forEach((nodes, wireId) => {
                        if (nodes.length < 2) return;

                        const wire = new Wire(nodes[0], nodes[1], this);

                        if (nodes.length > 2) {
                            for (let i = 2; i < nodes.length; i++) {
                                if (!nodes[i].wire) {
                                    wire.addNode(nodes[i]);
                                }
                            }
                        }

                        wireMap.set(wireId, wire);
                    });

                    //alert(`Uvoženo ${importData.components.length} komponent!`);
                } catch (error) {
                    console.error("Import failed:", error);
                    //alert('Napaka pri uvozu datoteke!');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    clearAllComponents() {
        const wiresToDestroy = new Set();

        if (this.placedComponents && this.placedComponents.length > 0) {
            const componentsToDestroy = [...this.placedComponents];

            componentsToDestroy.forEach((visualContainer) => {
                const comp = visualContainer.getData("logicComponent");
                if (!comp || visualContainer.getData("isInPanel")) return;

                if (comp.start && comp.start.wire) {
                    wiresToDestroy.add(comp.start.wire);
                }
                if (comp.end && comp.end.wire) {
                    wiresToDestroy.add(comp.end.wire);
                }

                if (comp.start && comp.start.graphics) {
                    comp.start.graphics.destroy();
                }

                if (comp.end && comp.end.graphics) {
                    comp.end.graphics.destroy();
                }

                if (this.graph) {
                    if (comp.start) this.graph.nodes.delete(comp.start);
                    if (comp.end) this.graph.nodes.delete(comp.end);
                    if (this.graph.components) {
                        const compIndex = this.graph.components.indexOf(comp);
                        if (compIndex > -1)
                            this.graph.components.splice(compIndex, 1);
                    }
                }

                visualContainer.destroy();

                if (comp.destroy) {
                    comp.destroy();
                }
            });
        }

        wiresToDestroy.forEach((wire) => {
            if (wire && wire.deleteWire) {
                wire.deleteWire();
            }
        });

        this.placedComponents = [];

        if (window.components) {
            window.components = window.components.filter((comp) => {
                const visualContainer = comp.componentObject;
                return visualContainer && visualContainer.getData("isInPanel");
            });
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    backgroundColor: "#f0f0f0",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [WorkspaceScene],
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
};
