import type { Unit } from "./module_bindings";
import { DbConnection } from './module_bindings';

export function handleInput(dbConnection: DbConnection, canvas: HTMLCanvasElement, units: Unit[]) {
    let selectedUnit: Unit | null = null;

    function startMove(event: MouseEvent | TouchEvent) {
	    console.log(startMove);
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = "touches" in event ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
        const y = "touches" in event ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

        units.forEach((unit, id) => {
	    console.log(unit);
            if (x >= unit.x && x <= unit.x + 28 && y >= unit.y && y <= unit.y + 28) {
                selectedUnit = unit;
	    console.log(selectedUnit);
                document.addEventListener("mousemove", moveUnit);
                document.addEventListener("mouseup", stopMove);
                document.addEventListener("touchmove", moveUnit);
                document.addEventListener("touchend", stopMove);
		//TODO probably need to optimize a break or something here to not loop all units every time
            }
        });
    }

    function moveUnit(event: MouseEvent | TouchEvent) {
        if (!selectedUnit) return;
        const rect = canvas.getBoundingClientRect();
        const x = "touches" in event ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
        const y = "touches" in event ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

	
        selectedUnit.x = x - 14;
        selectedUnit.y = y - 14;
	dbConnection.reducers.moveUnit(selectedUnit.id, x - 14, y - 14);
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

