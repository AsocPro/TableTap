import type { Unit } from "./module_bindings";
import { DbConnection } from './module_bindings';

export function handleInput(dbConnection: DbConnection, canvas: HTMLCanvasElement, units: Map<number, Unit>) {
    let selectedUnit: Unit | null = null;

    function startMove(event: MouseEvent | TouchEvent) {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = "touches" in event ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
        const y = "touches" in event ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

        units.forEach((unit) => {
            // Calculate distance from click to center of circle
            const centerX = unit.x + unit.size/2;
            const centerY = unit.y + unit.size/2;
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            if (distance <= unit.size/2) {
                selectedUnit = unit;
                document.addEventListener("mousemove", moveUnit);
                document.addEventListener("mouseup", stopMove);
                document.addEventListener("touchmove", moveUnit);
                document.addEventListener("touchend", stopMove);
            }
        });
    }

    function moveUnit(event: MouseEvent | TouchEvent) {
        if (!selectedUnit) return;
        const rect = canvas.getBoundingClientRect();
        const x = "touches" in event ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
        const y = "touches" in event ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

        // Calculate proposed new position
        const newX = x - selectedUnit.size / 2;
        const newY = y - selectedUnit.size / 2;

        // Only update locally after the reducer processes the move
        // The reducer will handle collision detection server-side
        dbConnection.reducers.moveUnit(selectedUnit.id, newX, newY);
    }

    function stopMove() {
        selectedUnit = null;
        document.removeEventListener("mousemove", moveUnit);
        document.removeEventListener("mouseup", stopMove);
        document.removeEventListener("touchmove", moveUnit);
        document.removeEventListener("touchend", stopMove);
    }

    canvas.addEventListener("mousedown", startMove);
    canvas.addEventListener("touchstart", startMove, { passive: false });
}

