use spacetimedb::{ReducerContext, Table};
use spacetimedb::rand::Rng;
use spacetimedb::Timestamp;
use spacetimedb::SpacetimeType;

#[derive(Clone, Debug)]
#[spacetimedb::table(name = unit, public)]
pub struct Unit {
    #[primary_key]
    id: u64,
    x: i32,
    y: i32,
    size: i32,
    color: String
}

#[derive(Clone, Debug)]
#[spacetimedb::table(name = obstacle, public)]
pub struct Obstacle {
    #[primary_key]
    id: u64,
    x: i32,
    y: i32,
    length: i32,
    height: i32
}

#[derive(Clone, Debug)]
#[spacetimedb::table(name = terrain, public)]
pub struct Terrain {
    #[primary_key]
    id: u64,
    x: i32,
    y: i32,
    length: i32,
    height: i32
}

#[derive(SpacetimeType, Clone, Debug)]
pub struct GameState {
    pub terrains: Vec<Terrain>,
    pub units: Vec<Unit>,
    pub obstacles: Vec<Obstacle>,
    pub underlays: Vec<Underlay>,
    pub overlays: Vec<Overlay>
}

#[spacetimedb::table(name = action, public)]
pub struct Action {
    #[primary_key]
    timestamp: Timestamp,
    action_type: String,
    description: String,
    game_state: Option<GameState>,
    created_at: Option<Timestamp>,
    updated_at: Option<Timestamp>
}

#[derive(Clone, Debug)]
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

#[derive(Clone, Debug)]
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

    // Add example underlays
    _ctx.db.underlay().insert(Underlay {
        id: 1,
        shape_type: ShapeType::Circle,
        size: 100,
        color: "rgba(0, 255, 0, 0.2)".to_string(),
        position: vec![Vec2 { x: 300, y: 300 }],
        created_at: Some(_ctx.timestamp),
        updated_at: Some(_ctx.timestamp)
    });

    _ctx.db.underlay().insert(Underlay {
        id: 2,
        shape_type: ShapeType::Rectangle,
        size: 0,
        color: "rgba(255, 165, 0, 0.2)".to_string(),
        position: vec![
            Vec2 { x: 100, y: 100 },
            Vec2 { x: 200, y: 200 }
        ],
        created_at: Some(_ctx.timestamp),
        updated_at: Some(_ctx.timestamp)
    });

    // Add example overlays
    _ctx.db.overlay().insert(Overlay {
        id: 1,
        shape_type: ShapeType::Line,
        size: 3,
        color: "rgba(255, 0, 0, 0.8)".to_string(),
        position: vec![
            Vec2 { x: 50, y: 50 },
            Vec2 { x: 550, y: 350 }
        ],
        created_at: Some(_ctx.timestamp),
        updated_at: Some(_ctx.timestamp)
    });

    _ctx.db.overlay().insert(Overlay {
        id: 2,
        shape_type: ShapeType::Polygon,
        size: 0,
        color: "rgba(0, 0, 255, 0.3)".to_string(),
        position: vec![
            Vec2 { x: 400, y: 100 },
            Vec2 { x: 500, y: 100 },
            Vec2 { x: 500, y: 200 },
            Vec2 { x: 400, y: 200 }
        ],
        created_at: Some(_ctx.timestamp),
        updated_at: Some(_ctx.timestamp)
    });

    _ctx.db.overlay().insert(Overlay {
        id: 3,
        shape_type: ShapeType::Text,
        size: 24,
        color: "rgba(0, 0, 0, 1.0)".to_string(),
        position: vec![Vec2 { x: 250, y: 50 }],
        created_at: Some(_ctx.timestamp),
        updated_at: Some(_ctx.timestamp)
    });
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
        // Check for collisions with canvas boundaries
        let unit_radius = unit.size / 2;
        let canvas_width = 600; // Match your canvas width
        let canvas_height = 400; // Match your canvas height
        
        // Check if unit would go outside canvas boundaries
        if new_x < unit_radius || new_x > canvas_width - unit_radius ||
           new_y < unit_radius || new_y > canvas_height - unit_radius {
            return; // Don't move if it would go outside canvas
        }

        // Check for collisions with other units
        let mut will_collide = false;
        
        // Check collision with other units
        for other_unit in ctx.db.unit().iter() {
            if other_unit.id == unit_id {
                continue;
            }

            // Calculate distance between centers of circles
            let unit_center_x = other_unit.x;
            let unit_center_y = other_unit.y;
            let new_center_x = new_x;
            let new_center_y = new_y;
            
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
            let unit_center_x = new_x;
            let unit_center_y = new_y;
            
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
    
    // Add to actions table with game state
    ctx.db.action().insert(Action {
        timestamp: ctx.timestamp,
        action_type: "DICE_ROLL".to_string(),
        description: description,
        game_state: Some(GameState {
            terrains: ctx.db.terrain().iter().collect(),
            units: ctx.db.unit().iter().collect(),
            obstacles: ctx.db.obstacle().iter().collect(),
            underlays: ctx.db.underlay().iter().collect(),
            overlays: ctx.db.overlay().iter().collect()
        }),
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
        game_state: None,
        created_at: Some(ctx.timestamp),
        updated_at: Some(ctx.timestamp),
    });
}

#[spacetimedb::reducer]
pub fn add_underlay(ctx: &ReducerContext, underlay_id: u64, shape_type: ShapeType, size: u32, color: String, position: Vec<Vec2>) {
    let mut new_id = underlay_id;
    while let Some(_underlay) = ctx.db.underlay().id().find(underlay_id) {
        new_id = new_id + 1;
    }
    ctx.db.underlay().insert(Underlay { 
        id: new_id, 
        shape_type, 
        size, 
        color, 
        position,
        created_at: Some(ctx.timestamp),
        updated_at: Some(ctx.timestamp)
    });
}

#[spacetimedb::reducer]
pub fn add_overlay(ctx: &ReducerContext, overlay_id: u64, shape_type: ShapeType, size: u32, color: String, position: Vec<Vec2>) {
    let mut new_id = overlay_id;
    while let Some(_overlay) = ctx.db.overlay().id().find(overlay_id) {
        new_id = new_id + 1;
    }
    ctx.db.overlay().insert(Overlay { 
        id: new_id, 
        shape_type, 
        size, 
        color, 
        position,
        created_at: Some(ctx.timestamp),
        updated_at: Some(ctx.timestamp)
    });
}

#[spacetimedb::reducer]
pub fn delete_underlay(ctx: &ReducerContext, underlay_id: u64) {
    if let Some(_underlay) = ctx.db.underlay().id().find(underlay_id) {
        ctx.db.underlay().id().delete(underlay_id);
    } else {
        log::error!("Failed to delete underlay: ID {} not found", underlay_id);
    }
}

#[spacetimedb::reducer]
pub fn delete_overlay(ctx: &ReducerContext, overlay_id: u64) {
    if let Some(_overlay) = ctx.db.overlay().id().find(overlay_id) {
        ctx.db.overlay().id().delete(overlay_id);
    } else {
        log::error!("Failed to delete overlay: ID {} not found", overlay_id);
    }
}

#[spacetimedb::reducer]
pub fn handle_mouse_event(ctx: &ReducerContext, event_type: String, x: i32, y: i32, offset_x: i32, offset_y: i32) {
    match event_type.as_str() {
        "mousedown" => {
            // Find unit under cursor
            for unit in ctx.db.unit().iter() {
                let center_x = unit.x;
                let center_y = unit.y;
                let distance = ((x - center_x).pow(2) + (y - center_y).pow(2)) as f64;
                
                if distance <= (unit.size/2).pow(2) as f64 {
                    // Store selected unit in a new table
                    ctx.db.selected_unit().insert(SelectedUnit { 
                        id: unit.id,
                        start_x: x,
                        start_y: y,
                        offset_x: 0,
                        offset_y: 0
                    });
                    break;
                }
            }
        }
        "mousemove" => {
            if let Some(selected) = ctx.db.selected_unit().iter().next() {
                if let Some(unit) = ctx.db.unit().id().find(selected.id) {
                    // Calculate new position based on offset
                    let new_x = unit.x + offset_x;
                    let new_y = unit.y + offset_y;
                    
                    // Check for collisions with canvas boundaries
                    let unit_radius = unit.size / 2;
                    let canvas_width = 600;
                    let canvas_height = 400;
                    
                    if new_x >= unit_radius && new_x <= canvas_width - unit_radius &&
                       new_y >= unit_radius && new_y <= canvas_height - unit_radius {
                        // Check for collisions with other units
                        let mut will_collide = false;
                        
                        for other_unit in ctx.db.unit().iter() {
                            if other_unit.id == unit.id {
                                continue;
                            }

                            let dx = new_x - other_unit.x;
                            let dy = new_y - other_unit.y;
                            let distance_squared = dx * dx + dy * dy;
                            
                            let min_distance = (unit.size + other_unit.size) / 2;
                            if distance_squared < min_distance * min_distance {
                                will_collide = true;
                                break;
                            }
                        }
                        
                        // Check collision with obstacles if no unit collision found
                        if !will_collide {
                            let unit_center_x = new_x;
                            let unit_center_y = new_y;
                            
                            for obstacle in ctx.db.obstacle().iter() {
                                let closest_x = unit_center_x.max(obstacle.x).min(obstacle.x + obstacle.length);
                                let closest_y = unit_center_y.max(obstacle.y).min(obstacle.y + obstacle.height);
                                
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
                    }
                }
            }
        }
        "mouseup" => {
            // Clear selected unit
            for selected in ctx.db.selected_unit().iter() {
                ctx.db.selected_unit().id().delete(selected.id);
            }
        }
        _ => {}
    }
}

#[spacetimedb::table(name = selected_unit, public)]
pub struct SelectedUnit {
    #[primary_key]
    id: u64,
    start_x: i32,
    start_y: i32,
    offset_x: i32,
    offset_y: i32
}
