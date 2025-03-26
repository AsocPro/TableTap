use spacetimedb::{ReducerContext, Table};

#[spacetimedb::table(name = unit, public)]
pub struct Unit {
    #[primary_key]
    id: u64,
    x: i32,
    y: i32,
    size: i32,
    color: String
}

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    // Called when the module is initially published
    _ctx.db.unit().insert(Unit { id: 1, x: 50, y: 50, size: 28, color: "blue".to_string() });
    _ctx.db.unit().insert(Unit { id: 2, x: 50, y: 50, size: 28, color: "red".to_string() });
}

#[spacetimedb::reducer(client_connected)]
pub fn identity_connected(_ctx: &ReducerContext) {
    // Called everytime a new client connects
}

#[spacetimedb::reducer(client_disconnected)]
pub fn identity_disconnected(_ctx: &ReducerContext) {
    // Called everytime a client disconnects
}

//#[spacetimedb::reducer]
//pub fn add(ctx: &ReducerContext, name: String) {
//    ctx.db.person().insert(Person { name });
//}
//
//#[spacetimedb::reducer]
//pub fn say_hello(ctx: &ReducerContext) {
//    for person in ctx.db.person().iter() {
//        log::info!("Hello, {}!", person.name);
//    }
//    log::info!("Hello, World!");
//}

#[spacetimedb::reducer]
pub fn add_unit(ctx: &ReducerContext, unit_id: u64, new_x: i32, new_y: i32, size: i32, color: String) {
    let mut new_id = unit_id;
    while let Some(_unit) = ctx.db.unit().id().find(unit_id) {
        new_id = new_id +1;

    }
    ctx.db.unit().insert(Unit { id: new_id, x: new_x, y: new_y, size: size, color: color });
}
#[spacetimedb::reducer]
pub fn move_unit(ctx: &ReducerContext, unit_id: u64, new_x: i32, new_y: i32) {
    if let Some(unit) = ctx.db.unit().id().find(unit_id) {
        // Check for collisions with other units
        let mut will_collide = false;
        for other_unit in ctx.db.unit().iter() {
            if other_unit.id == unit_id {
                continue;
            }

            // Calculate distance between centers of circles
            let unit_center_x = other_unit.x + other_unit.size/2;
            let unit_center_y = other_unit.y + other_unit.size/2;
            let new_center_x = new_x + unit.size/2;
            let new_center_y = new_y + unit.size/2;
            
            let dx = new_center_x - unit_center_x;
            let dy = new_center_y - unit_center_y;
            let distance_squared = dx * dx + dy * dy;
            
            // If distance is less than combined radii, there's a collision
            let min_distance = (unit.size + other_unit.size) / 2;
            if distance_squared < min_distance * min_distance {
                will_collide = true;
                break;
            }
        }

        // Only move if there's no collision
        if !will_collide {
            ctx.db.unit().id().update(Unit { x: new_x, y: new_y, ..unit });
        }
    } else { 
        log::error!("Failed to update unit: ID {} not found", unit_id)
    }
}
