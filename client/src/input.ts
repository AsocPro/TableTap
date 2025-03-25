import { Unit } from "./unit";

export function handleInput(canvas: HTMLCanvasElement, units: Unit[]) {
    let selectedUnit: Unit | null = null;

    function startMove(event: MouseEvent | TouchEvent) {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = "touches" in event ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
        const y = "touches" in event ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

        for (const unit of units) {
            if (x >= unit.x && x <= unit.x + unit.size && y >= unit.y && y <= unit.y + unit.size) {
                selectedUnit = unit;
                document.addEventListener("mousemove", moveUnit);
                document.addEventListener("mouseup", stopMove);
                document.addEventListener("touchmove", moveUnit);
                document.addEventListener("touchend", stopMove);
                break;
            }
        }
    }

    function moveUnit(event: MouseEvent | TouchEvent) {
        if (!selectedUnit) return;
        const rect = canvas.getBoundingClientRect();
        const x = "touches" in event ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
        const y = "touches" in event ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

        selectedUnit.x = x - selectedUnit.size / 2;
        selectedUnit.y = y - selectedUnit.size / 2;
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

