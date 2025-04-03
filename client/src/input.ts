import type { Unit } from "./module_bindings";
import { DbConnection } from './module_bindings';

export function handleInput(
    dbConnection: DbConnection,
    canvas: HTMLCanvasElement,
    units: Map<number, Unit>,
    isHistoricalView: () => boolean
) {
    let selectedUnit: Unit | null = null;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('mousedown', (e) => {
        if (isHistoricalView()) return; // Don't allow interaction in historical view
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if click is on a unit
        for (const unit of units.values()) {
            const centerX = unit.x + unit.size/2;
            const centerY = unit.y + unit.size/2;
            const distance = Math.sqrt(
                Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            );

            if (distance <= unit.size/2) {
                selectedUnit = unit;
                isDragging = true;
                startX = x - unit.x;
                startY = y - unit.y;
                break;
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isHistoricalView()) return; // Don't allow interaction in historical view
        
        if (isDragging && selectedUnit) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const newX = x - startX;
            const newY = y - startY;

            // Move the unit
            dbConnection.reducers.moveUnit(selectedUnit.id, newX, newY);
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (isHistoricalView()) return; // Don't allow interaction in historical view
        
        selectedUnit = null;
        isDragging = false;
    });
}

