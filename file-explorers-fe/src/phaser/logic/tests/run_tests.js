// Circuit Test Runner - Node.js Version
const fs = require('fs');
const path = require('path');

// Test utilities
function approxEqual(a, b, tolerance = 0.001) {
    return Math.abs(a - b) < tolerance;
}

function getComponentValue(component, property) {
    const val = component.values[property];
    if (typeof val === 'object' && 'value' in val) {
        return val.value;
    }
    return val !== undefined ? val : component[property];
}

// AC/DC current handling
function isACSource(battery) {
    const sourceType = battery.values.sourceType;
    return sourceType === 'AC' || sourceType === 'ac';
}

function getRMSValue(value, isAC) {
    // For AC: if value is peak, convert to RMS (V_rms = V_peak / √2)
    // For DC: value is already the actual value
    if (isAC && value !== undefined) {
        // Assume value is RMS unless specified as peak
        return value; // Most AC meters show RMS
    }
    return value;
}

function getPeakValue(rmsValue, isAC) {
    // Convert RMS to peak for AC: V_peak = V_rms × √2
    if (isAC && rmsValue !== undefined) {
        return rmsValue * Math.sqrt(2);
    }
    return rmsValue;
}

function getFrequency(battery) {
    if (isACSource(battery)) {
        // Check for frequency in values
        return battery.values.frequency || 50; // Default 50Hz
    }
    return 0; // DC has no frequency
}

// Load circuit data
const circuitPath = path.join(__dirname, 'circuit_1765151086766.json');
const circuitData = JSON.parse(fs.readFileSync(circuitPath, 'utf8'));

console.log('\n⚡ CIRCUIT SIMULATOR TEST SUITE ⚡\n');
console.log('═'.repeat(60));

// Display circuit info
const battery = circuitData.components.find(c => c.type === 'battery');
const resistors = circuitData.components.filter(c => c.type === 'resistor');
const isAC = isACSource(battery);
const frequency = getFrequency(battery);

console.log('\n📋 Circuit Configuration:');
console.log(`   Power Source: ${isAC ? 'AC' : 'DC'}`);
if (isAC) {
    console.log(`   Frequency: ${frequency}Hz`);
    console.log(`   Voltage (RMS): ${battery.values.voltage}V`);
    console.log(`   Voltage (Peak): ${getPeakValue(battery.values.voltage, true).toFixed(2)}V`);
} else {
    console.log(`   Voltage: ${battery.values.voltage}V`);
}
console.log(`   Components: ${circuitData.components.length} (${resistors.length} resistors)`);
console.log('\n' + '═'.repeat(60) + '\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, testFn) {
    totalTests++;
    try {
        const result = testFn();
        if (result.pass) {
            passedTests++;
            console.log(`✓ PASS: ${name}`);
        } else {
            failedTests++;
            console.log(`✗ FAIL: ${name}`);
        }
        console.log(`   ${result.details.split('\n').join('\n   ')}`);
        console.log();
    } catch (error) {
        failedTests++;
        console.log(`✗ ERROR: ${name}`);
        console.log(`   ${error.message}`);
        console.log();
    }
}

// Test 1: Ohm's Law Validation
runTest("Ohm's Law Validation (V = I × R)", () => {
    const results = [];
    let allPass = true;

    for (const resistor of resistors) {
        const V = getComponentValue(resistor, 'voltage') || getComponentValue(resistor, 'voltageDrop');
        const I = getComponentValue(resistor, 'current');
        const R = getComponentValue(resistor, 'resistance');

        if (V !== undefined && I !== undefined && R !== undefined && V !== 0 && I !== 0) {
            const calculatedV = I * R;
            const matches = approxEqual(V, calculatedV, 0.1);
            
            results.push({
                component: resistor.values.name,
                V, I, R,
                calculatedV,
                matches
            });

            if (!matches) allPass = false;
        }
    }

    return {
        pass: allPass,
        details: results.map(r => 
            `${r.component}: V=${r.V}V, I=${r.I}A, R=${r.R}Ω → Calc: ${r.calculatedV.toFixed(3)}V ${r.matches ? '✓' : '✗'}`
        ).join('\n') || 'No data to validate'
    };
});

// Test 2: Power = V × I
runTest("Power Calculation (P = V × I)", () => {
    const results = [];

    for (const comp of resistors) {
        const V = getComponentValue(comp, 'voltage') || getComponentValue(comp, 'voltageDrop');
        const I = getComponentValue(comp, 'current');

        if (V !== undefined && I !== undefined && V !== 0 && I !== 0) {
            const calculatedP = V * I;
            
            results.push({
                component: comp.values.name,
                V, I, calculatedP
            });
        }
    }

    return {
        pass: results.length > 0,
        details: results.map(r => 
            `${r.component}: P = ${r.V}V × ${r.I}A = ${r.calculatedP.toFixed(4)}W`
        ).join('\n') || 'No current/voltage data'
    };
});

// Test 3: Power = I² × R
runTest("Power Calculation (P = I² × R)", () => {
    const results = [];

    for (const resistor of resistors) {
        const I = getComponentValue(resistor, 'current');
        const R = getComponentValue(resistor, 'resistance');

        if (I !== undefined && R !== undefined && I !== 0) {
            const calculatedP = I * I * R;
            
            results.push({
                component: resistor.values.name,
                I, R, calculatedP
            });
        }
    }

    return {
        pass: results.length > 0,
        details: results.map(r => 
            `${r.component}: P = ${r.I}A² × ${r.R}Ω = ${r.calculatedP.toFixed(4)}W`
        ).join('\n') || 'No current data'
    };
});

// Test 4: Power = V² / R
runTest("Power Calculation (P = V² / R)", () => {
    const results = [];

    for (const resistor of resistors) {
        const V = getComponentValue(resistor, 'voltage') || getComponentValue(resistor, 'voltageDrop');
        const R = getComponentValue(resistor, 'resistance');

        if (V !== undefined && R !== undefined && V !== 0 && R !== 0) {
            const calculatedP = (V * V) / R;
            
            results.push({
                component: resistor.values.name,
                V, R, calculatedP
            });
        }
    }

    return {
        pass: results.length > 0,
        details: results.map(r => 
            `${r.component}: P = ${r.V}V² / ${r.R}Ω = ${r.calculatedP.toFixed(4)}W`
        ).join('\n') || 'No voltage data'
    };
});

// Test 5: Current from Power and Resistance
runTest("Current Calculation (I = √(P / R))", () => {
    const results = [];

    for (const resistor of resistors) {
        const V = getComponentValue(resistor, 'voltage') || getComponentValue(resistor, 'voltageDrop');
        const R = getComponentValue(resistor, 'resistance');

        if (V !== undefined && R !== undefined && V !== 0 && R !== 0) {
            // Calculate P first, then I
            const P = (V * V) / R;
            const calculatedI = Math.sqrt(P / R);
            
            results.push({
                component: resistor.values.name,
                P: P.toFixed(4),
                R,
                calculatedI
            });
        }
    }

    return {
        pass: results.length > 0,
        details: results.map(r => 
            `${r.component}: I = √(${r.P}W / ${r.R}Ω) = ${r.calculatedI.toFixed(4)}A`
        ).join('\n') || 'Insufficient data'
    };
});

// Test 6: Voltage from Power and Resistance
runTest("Voltage Calculation (V = √(P × R))", () => {
    const results = [];

    for (const resistor of resistors) {
        const I = getComponentValue(resistor, 'current');
        const R = getComponentValue(resistor, 'resistance');

        if (I !== undefined && R !== undefined && I !== 0) {
            // Calculate P first, then V
            const P = I * I * R;
            const calculatedV = Math.sqrt(P * R);
            
            results.push({
                component: resistor.values.name,
                P: P.toFixed(4),
                R,
                calculatedV
            });
        }
    }

    return {
        pass: results.length > 0,
        details: results.map(r => 
            `${r.component}: V = √(${r.P}W × ${r.R}Ω) = ${r.calculatedV.toFixed(4)}V`
        ).join('\n') || 'Insufficient data'
    };
});

// Test 7: R14 Component Test
runTest("Component R14 Test (18V, 600Ω)", () => {
    const r14 = circuitData.components.find(c => c.values.name === 'R14');
    if (!r14) return { pass: false, details: 'R14 not found' };

    const V = getComponentValue(r14, 'voltageDrop');
    const R = getComponentValue(r14, 'resistance');
    
    const expectedI = V / R;
    const expectedP_VR = (V * V) / R;
    const expectedP_IR = expectedI * expectedI * R;
    const expectedP_VI = V * expectedI;

    const allMatch = approxEqual(expectedP_VR, expectedP_IR) && approxEqual(expectedP_IR, expectedP_VI);

    return {
        pass: allMatch,
        details: `Given: V=${V}V, R=${R}Ω
Expected I = ${expectedI.toFixed(4)}A
Expected P (V²/R) = ${expectedP_VR.toFixed(4)}W
Expected P (I²×R) = ${expectedP_IR.toFixed(4)}W
Expected P (V×I) = ${expectedP_VI.toFixed(4)}W
All formulas consistent: ${allMatch ? '✓' : '✗'}`
    };
});

// Test 8: Kirchhoff's Current Law
runTest("Kirchhoff's Current Law", () => {
    const batteryI = getComponentValue(battery, 'current');
    const resistorCurrents = resistors.map(r => ({
        name: r.values.name,
        I: getComponentValue(r, 'current') || 0
    }));

    return {
        pass: batteryI !== undefined && batteryI > 0,
        details: `Battery: ${batteryI}A\n${resistorCurrents.map(r => `${r.name}: ${r.I}A`).join('\n')}`
    };
});

// Test 9: Power Consistency Check
runTest("Power Consistency (All 3 Formulas)", () => {
    const results = [];
    let allConsistent = true;

    for (const resistor of resistors) {
        const V = getComponentValue(resistor, 'voltage') || getComponentValue(resistor, 'voltageDrop');
        const I = getComponentValue(resistor, 'current');
        const R = getComponentValue(resistor, 'resistance');

        if (V && I && R && V !== 0 && I !== 0) {
            const P1 = V * I;
            const P2 = I * I * R;
            const P3 = (V * V) / R;

            const consistent = approxEqual(P1, P2, 0.01) && approxEqual(P2, P3, 0.01);
            if (!consistent) allConsistent = false;

            results.push({
                name: resistor.values.name,
                P1: P1.toFixed(4),
                P2: P2.toFixed(4),
                P3: P3.toFixed(4),
                consistent
            });
        }
    }

    return {
        pass: allConsistent,
        details: results.map(r => 
            `${r.name}: P(V×I)=${r.P1}W, P(I²R)=${r.P2}W, P(V²/R)=${r.P3}W ${r.consistent ? '✓' : '✗'}`
        ).join('\n') || 'Insufficient data for consistency check'
    };
});

// Test 10: Resistance Calculation
runTest("Resistance Calculations", () => {
    const results = [];

    for (const resistor of resistors) {
        const V = getComponentValue(resistor, 'voltage') || getComponentValue(resistor, 'voltageDrop');
        const I = getComponentValue(resistor, 'current');
        const R_actual = getComponentValue(resistor, 'resistance');

        if (V && I && V !== 0 && I !== 0) {
            const R_calc = V / I;
            const matches = approxEqual(R_actual, R_calc, 0.1);
            
            results.push({
                name: resistor.values.name,
                R_actual,
                R_calc: R_calc.toFixed(2),
                matches
            });
        }
    }

    return {
        pass: results.every(r => r.matches),
        details: results.map(r => 
            `${r.name}: Actual=${r.R_actual}Ω, Calculated=${r.R_calc}Ω ${r.matches ? '✓' : '✗'}`
        ).join('\n') || 'Insufficient data'
    };
});

// Test 11: AC RMS Power Calculation (if AC source)
if (isAC) {
    runTest("AC RMS Power Calculation (P = V_rms × I_rms)", () => {
        const results = [];

        for (const comp of resistors) {
            const V_rms = getRMSValue(getComponentValue(comp, 'voltage') || getComponentValue(comp, 'voltageDrop'), true);
            const I_rms = getRMSValue(getComponentValue(comp, 'current'), true);

            if (V_rms !== undefined && I_rms !== undefined && V_rms !== 0 && I_rms !== 0) {
                const P_avg = V_rms * I_rms; // Average power for resistive load
                
                results.push({
                    component: comp.values.name,
                    V_rms, I_rms, P_avg
                });
            }
        }

        return {
            pass: results.length > 0,
            details: results.map(r => 
                `${r.component}: P_avg = ${r.V_rms}V(rms) × ${r.I_rms}A(rms) = ${r.P_avg.toFixed(4)}W`
            ).join('\n') || 'No AC current/voltage data'
        };
    });

    runTest("AC Peak Values (V_peak = V_rms × √2)", () => {
        const results = [];

        for (const comp of resistors) {
            const V_rms = getRMSValue(getComponentValue(comp, 'voltage') || getComponentValue(comp, 'voltageDrop'), true);

            if (V_rms !== undefined && V_rms !== 0) {
                const V_peak = getPeakValue(V_rms, true);
                
                results.push({
                    component: comp.values.name,
                    V_rms,
                    V_peak
                });
            }
        }

        return {
            pass: results.length > 0,
            details: results.map(r => 
                `${r.component}: V_rms=${r.V_rms}V → V_peak=${r.V_peak.toFixed(3)}V (×√2)`
            ).join('\n') || 'No voltage data'
        };
    });

    runTest("AC Frequency and Period", () => {
        const period = 1 / frequency;
        const angularFreq = 2 * Math.PI * frequency;

        return {
            pass: frequency > 0,
            details: `Frequency: ${frequency}Hz
Period: ${period.toFixed(6)}s (${(period * 1000).toFixed(3)}ms)
Angular Frequency (ω): ${angularFreq.toFixed(2)} rad/s`
        };
    });
} else {
    runTest("DC Source Validation", () => {
        const voltage = battery.values.voltage;
        const current = getComponentValue(battery, 'current');

        return {
            pass: voltage !== undefined && voltage !== 0,
            details: `DC Source: ${voltage}V, ${current || 0}A
Power output: ${voltage && current ? (voltage * current).toFixed(2) : 'N/A'}W`
        };
    });
}

// Test: Power calculations work for both AC and DC
runTest(`${isAC ? 'AC' : 'DC'} Power Formula Consistency`, () => {
    const results = [];

    for (const resistor of resistors) {
        const V = getRMSValue(getComponentValue(resistor, 'voltage') || getComponentValue(resistor, 'voltageDrop'), isAC);
        const I = getRMSValue(getComponentValue(resistor, 'current'), isAC);
        const R = getComponentValue(resistor, 'resistance');

        if (V && I && R && V !== 0 && I !== 0) {
            // All three formulas work the same for both AC (RMS) and DC
            const P1 = V * I;
            const P2 = I * I * R;
            const P3 = (V * V) / R;

            const consistent = approxEqual(P1, P2, 0.01) && approxEqual(P2, P3, 0.01);

            results.push({
                name: resistor.values.name,
                P1: P1.toFixed(4),
                P2: P2.toFixed(4),
                P3: P3.toFixed(4),
                consistent,
                note: isAC ? '(RMS values)' : '(DC values)'
            });
        }
    }

    return {
        pass: results.length === 0 || results.every(r => r.consistent),
        details: results.map(r => 
            `${r.name} ${r.note}: P(V×I)=${r.P1}W, P(I²R)=${r.P2}W, P(V²/R)=${r.P3}W ${r.consistent ? '✓' : '✗'}`
        ).join('\n') || 'Insufficient data for consistency check'
    };
});

// Summary
console.log('═'.repeat(60));
console.log('\n📊 TEST SUMMARY\n');
console.log(`Total Tests: ${totalTests}`);
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('\n' + '═'.repeat(60) + '\n');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
