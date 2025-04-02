use spacetimedb::{ReducerContext, Table};
use spacetimedb::rand::Rng;
use spacetimedb::Timestamp;
use spacetimedb::SpacetimeType;

#[spacetimedb::table(name = unit, public)]
pub struct Unit {
    #[primary_key]
    id: u64,
    x: i32,
    y: i32,
    size: i32,
    color: String
}

#[spacetimedb::table(name = obstacle, public)]
pub struct Obstacle {
    #[primary_key]
    id: u64,
    x: i32,
    y: i32,
    length: i32,
    height: i32
}

#[spacetimedb::table(name = terrain, public)]
pub struct Terrain {
    #[primary_key]
    id: u64,
    x: i32,
    y: i32,
    length: i32,
    height: i32
}

#[spacetimedb::table(name = action, public)]
pub struct Action {
    #[primary_key]
    timestamp: Timestamp,
    action_type: String,
    description: String,
    terrains: Option<Vec<Terrain>>,
    units: Option<Vec<Unit>>,
    obstacles: Option<Vec<Obstacle>>,
    created_at: Option<Timestamp>,
    updated_at: Option<Timestamp>
}

#[spacetimedb::table(name = underlay, public)]
pub struct Underlay {
    #[primary_key]
    id: u64,
    shape_type: ShapeType,
    size: u32,
    color: String,
    position: Vec<Vec2>,
    created_at: Option<Timestamp>,
    updated_at: Option<Timestamp>
}

#[spacetimedb::table(name = overlay, public)]
pub struct Overlay {
    #[primary_key]
    id: u64,
    shape_type: ShapeType,
    size: u32,
    color: String,
    position: Vec<Vec2>,
    created_at: Option<Timestamp>,
    updated_at: Option<Timestamp>
}

#[derive(SpacetimeType, Clone, Debug)]
pub struct Vec2 {
    x: u32,
    y: u32,
}
#[derive(SpacetimeType, Clone, Debug)]
pub enum ShapeType {
    Circle,
    Rectangle,
    Line,
    Polygon,
    Text,
}

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    // Called when the module is initially published
    _ctx.db.unit().insert(Unit { id: 1, x: 50, y: 50, size: 28, color: "blue".to_string() });
    _ctx.db.unit().insert(Unit { id: 2, x: 150, y: 50, size: 28, color: "red".to_string() });
    
    // Add some initial obstacles
    _ctx.db.obstacle().insert(Obstacle { id: 1, x: 100, y: 150, length: 200, height: 50 });
    _ctx.db.obstacle().insert(Obstacle { id: 2, x: 350, y: 200, length: 100, height: 100 });
    
    // Add some initial terrain (traversable)
    _ctx.db.terrain().insert(Terrain { id: 1, x: 200, y: 250, length: 150, height: 100 });
    _ctx.db.terrain().insert(Terrain { id: 2, x: 50, y: 100, length: 80, height: 80 });
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
        
        // Check collision with other units
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
        
        // Check collision with obstacles if no unit collision found
        if !will_collide {
            let unit_radius = unit.size / 2;
            let unit_center_x = new_x + unit_radius;
            let unit_center_y = new_y + unit_radius;
            
            for obstacle in ctx.db.obstacle().iter() {
                // Check if circle intersects with rectangle
                // Find closest point on rectangle to circle center
                let closest_x = unit_center_x.max(obstacle.x).min(obstacle.x + obstacle.length);
                let closest_y = unit_center_y.max(obstacle.y).min(obstacle.y + obstacle.height);
                
                // Calculate distance from closest point to circle center
                let dx = unit_center_x - closest_x;
                let dy = unit_center_y - closest_y;
                let distance_squared = dx * dx + dy * dy;
                
                if distance_squared < unit_radius * unit_radius {
                    will_collide = true;
                    break;
                }
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

#[spacetimedb::reducer]
pub fn add_obstacle(ctx: &ReducerContext, obstacle_id: u64, new_x: i32, new_y: i32, length: i32, height: i32) {
    let mut new_id = obstacle_id;
    while let Some(_obstacle) = ctx.db.obstacle().id().find(obstacle_id) {
        new_id = new_id + 1;
    }
    ctx.db.obstacle().insert(Obstacle { id: new_id, x: new_x, y: new_y, length, height });
}

#[spacetimedb::reducer]
pub fn add_terrain(ctx: &ReducerContext, terrain_id: u64, new_x: i32, new_y: i32, length: i32, height: i32) {
    let mut new_id = terrain_id;
    while let Some(_terrain) = ctx.db.terrain().id().find(terrain_id) {
        new_id = new_id + 1;
    }
    ctx.db.terrain().insert(Terrain { id: new_id, x: new_x, y: new_y, length, height });
}

#[spacetimedb::reducer]
pub fn delete_unit(ctx: &ReducerContext, unit_id: u64) {
    if let Some(_unit) = ctx.db.unit().id().find(unit_id) {
        ctx.db.unit().id().delete(unit_id);
    } else {
        log::error!("Failed to delete unit: ID {} not found", unit_id);
    }
}

#[spacetimedb::reducer]
pub fn delete_obstacle(ctx: &ReducerContext, obstacle_id: u64) {
    if let Some(_obstacle) = ctx.db.obstacle().id().find(obstacle_id) {
        ctx.db.obstacle().id().delete(obstacle_id);
    } else {
        log::error!("Failed to delete obstacle: ID {} not found", obstacle_id);
    }
}

#[spacetimedb::reducer]
pub fn delete_terrain(ctx: &ReducerContext, terrain_id: u64) {
    if let Some(_terrain) = ctx.db.terrain().id().find(terrain_id) {
        ctx.db.terrain().id().delete(terrain_id);
    } else {
        log::error!("Failed to delete terrain: ID {} not found", terrain_id);
    }
}

#[spacetimedb::reducer]
pub fn delete_at_coordinates(ctx: &ReducerContext, x: i32, y: i32) {
    // Check units
    for unit in ctx.db.unit().iter() {
        let center_x = unit.x + unit.size/2;
        let center_y = unit.y + unit.size/2;
        let distance = ((x - center_x).pow(2) + (y - center_y).pow(2)) as f64;
        
        if distance <= (unit.size/2).pow(2) as f64 {
            ctx.db.unit().id().delete(unit.id);
            return;
        }
    }
    
    // Check obstacles
    for obstacle in ctx.db.obstacle().iter() {
        if x >= obstacle.x && x <= obstacle.x + obstacle.length &&
           y >= obstacle.y && y <= obstacle.y + obstacle.height {
            ctx.db.obstacle().id().delete(obstacle.id);
            return;
        }
    }
    
    // Check terrain
    for terrain in ctx.db.terrain().iter() {
        if x >= terrain.x && x <= terrain.x + terrain.length &&
           y >= terrain.y && y <= terrain.y + terrain.height {
            ctx.db.terrain().id().delete(terrain.id);
            return;
        }
    }
}

#[spacetimedb::reducer]
pub fn delete_all(ctx: &ReducerContext) {
    // Delete all units
    for unit in ctx.db.unit().iter() {
        ctx.db.unit().id().delete(unit.id);
    }
    
    // Delete all obstacles
    for obstacle in ctx.db.obstacle().iter() {
        ctx.db.obstacle().id().delete(obstacle.id);
    }
    
    // Delete all terrain
    for terrain in ctx.db.terrain().iter() {
        ctx.db.terrain().id().delete(terrain.id);
    }
}

#[spacetimedb::reducer]
pub fn roll_dice(ctx: &ReducerContext) {
    // Generate a random number between 1 and 6
    let mut rng = ctx.rng();
    let dice_value = rng.gen_range(1..=6);
    
    // Create a description
    let description = format!("🎲 Dice Roll: {}", dice_value);
    
    // Add to actions table with direct collection of game objects
    ctx.db.action().insert(Action {
        timestamp: ctx.timestamp,
        action_type: "DICE_ROLL".to_string(),
        description: description,
        terrains: Some(ctx.db.terrain().iter().collect()),
        units: Some(ctx.db.unit().iter().collect()),
        obstacles: Some(ctx.db.obstacle().iter().collect()),
        created_at: Some(ctx.timestamp),
        updated_at: Some(ctx.timestamp)
    });
}

#[spacetimedb::reducer]
pub fn chat_message(ctx: &ReducerContext, message: String) {
    // Create a new action with the chat message
    ctx.db.action().insert(Action {
        action_type: "CHAT_MESSAGE".to_string(),
        description: message,
        timestamp: ctx.timestamp,
        terrains: None,
        units: None,
        obstacles: None,
        created_at: Some(ctx.timestamp),
        updated_at: Some(ctx.timestamp),
    });
}
