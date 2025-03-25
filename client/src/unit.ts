export class Unit {
    x: number;
    y: number;
    size: number = 30; // 30px square

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    move(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }

    checkCollision(other: Unit): boolean {
        return !(this.x + this.size < other.x || 
                 this.x > other.x + other.size || 
                 this.y + this.size < other.y || 
                 this.y > other.y + other.size);
    }
}

