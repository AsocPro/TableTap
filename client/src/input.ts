import type { Unit } from "./module_bindings";
import { DbConnection } from './module_bindings';

export function handleInput(
    dbConnection: DbConnection,
    canvas: HTMLCanvasElement,
    isHistoricalView: () => boolean
) {
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;

    function startMove(event: MouseEvent | TouchEvent) {
        if (isHistoricalView()) return;
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

        startX = x;
        startY = y;
        lastX = x;
        lastY = y;

        // Send mousedown event to server
        dbConnection.reducers.handleMouseEvent("mousedown", x, y, 0, 0);
    }

    function moveUnit(event: MouseEvent | TouchEvent) {
        if (isHistoricalView()) return;
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

        // Calculate offset from last position
        const offsetX = x - lastX;
        const offsetY = y - lastY;
        lastX = x;
        lastY = y;

        // Send mousemove event to server
        dbConnection.reducers.handleMouseEvent("mousemove", x, y, offsetX, offsetY);
    }

    function stopMove() {
        if (isHistoricalView()) return;
        
        // Send mouseup event to server
        dbConnection.reducers.handleMouseEvent("mouseup", lastX, lastY, 0, 0);
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

