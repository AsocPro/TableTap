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

    function startMove(event: MouseEvent | TouchEvent) {
        if (isHistoricalView()) return; // Don't allow interaction in historical view
        event.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        let x: number;
        let y: number;

        if ('touches' in event && event.touches.length > 0) {
            const touch = event.touches[0]!;
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else if (event instanceof MouseEvent) {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        } else {
            return;
        }

        // Check if click is on a unit
        for (const unit of units.values()) {
            const centerX = unit.x;
            const centerY = unit.y;
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
    }

    function moveUnit(event: MouseEvent | TouchEvent) {
        if (isHistoricalView()) return; // Don't allow interaction in historical view
        if (!selectedUnit) return;
        
        const rect = canvas.getBoundingClientRect();
        let x: number;
        let y: number;

        if ('touches' in event && event.touches.length > 0) {
            const touch = event.touches[0]!;
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else if (event instanceof MouseEvent) {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        } else {
            return;
        }

        const newX = x - startX;
        const newY = y - startY;

        // Move the unit
        dbConnection.reducers.moveUnit(selectedUnit.id, newX, newY);
    }

    function stopMove() {
        if (isHistoricalView()) return; // Don't allow interaction in historical view
        selectedUnit = null;
        isDragging = false;
    }

    // Mouse events
    canvas.addEventListener('mousedown', startMove);
    document.addEventListener('mousemove', moveUnit);
    document.addEventListener('mouseup', stopMove);

    // Touch events
    canvas.addEventListener('touchstart', startMove, { passive: false });
    document.addEventListener('touchmove', moveUnit, { passive: false });
    document.addEventListener('touchend', stopMove);
}

