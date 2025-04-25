use spacetimedb::{ReducerContext, Table};
use spacetimedb::rand::Rng;
use spacetimedb::Timestamp;
use spacetimedb::SpacetimeType;
use rapier2d::prelude::*;

const BOARD_WIDTH: u32 = 600;
const BOARD_HEIGHT: u32 = 400;

fn border_terrain_lines(game_id: u64) -> Vec<Terrain> {
    vec![
        Terrain {
            id: 0,
            game_id,
            shape_type: ShapeType::Line,
            size: vec![1],
            color: "rgba(0,0,0,1)".to_string(),
            position: vec![Position { x: 0, y: 0 }, Position { x: BOARD_WIDTH, y: 0 }],
            traversable: false,
        },
        Terrain {
            id: 0,
            game_id,
            shape_type: ShapeType::Line,
            size: vec![1],
            color: "rgba(0,0,0,1)".to_string(),
            position: vec![Position { x: BOARD_WIDTH, y: 0 }, Position { x: BOARD_WIDTH, y: BOARD_HEIGHT }],
            traversable: false,
        },
        Terrain {
            id: 0,
            game_id,
            shape_type: ShapeType::Line,
            size: vec![1],
            color: "rgba(0,0,0,1)".to_string(),
            position: vec![Position { x: BOARD_WIDTH, y: BOARD_HEIGHT }, Position { x: 0, y: BOARD_HEIGHT }],
            traversable: false,
        },
        Terrain {
            id: 0,
            game_id,
            shape_type: ShapeType::Line,
            size: vec![1],
            color: "rgba(0,0,0,1)".to_string(),
            position: vec![Position { x: 0, y: BOARD_HEIGHT }, Position { x: 0, y: 0 }],
            traversable: false,
        },
    ]
}

trait Collidable {
    fn id(&self) -> u64;
    fn shape_type(&self) -> &ShapeType;
    fn position(&self) -> &Vec<Position>;
    fn size(&self) -> &Vec<u32>;
    fn traversable(&self) -> bool;
}

#[derive(Clone, Debug)]
#[spacetimedb::table(name = unit, public)]
pub struct Unit {
    #[auto_inc]
    #[primary_key]
    id: u64,
    #[index(btree)]
    game_id: u64,
    shape_type: ShapeType,
    size: Vec<u32>,
    color: String,
    position: Vec<Position>,
}

impl Collidable for Unit {
    fn id(&self) -> u64 { self.id }
    fn shape_type(&self) -> &ShapeType { &self.shape_type }
    fn position(&self) -> &Vec<Position> { &self.position }
    fn size(&self) -> &Vec<u32> { &self.size }
    fn traversable(&self) -> bool { false }
}

#[derive(Clone, Debug)]
#[spacetimedb::table(name = terrain, public)]
pub struct Terrain {
    #[auto_inc]
    #[primary_key]
    id: u64,
    #[index(btree)]
    game_id: u64,
    shape_type: ShapeType,
    size: Vec<u32>,
    color: String,
    position: Vec<Position>,
    traversable: bool,
}

impl Collidable for Terrain {
    fn id(&self) -> u64 { self.id }
    fn shape_type(&self) -> &ShapeType { &self.shape_type }
    fn position(&self) -> &Vec<Position> { &self.position }
    fn size(&self) -> &Vec<u32> { &self.size }
    fn traversable(&self) -> bool { self.traversable }
}

#[derive(SpacetimeType, Clone, Debug)]
pub struct GameState {
    pub terrains: Vec<Terrain>,
    pub units: Vec<Unit>,
    pub underlays: Vec<Underlay>,
    pub overlays: Vec<Overlay>,
    pub game_id: u64,
}

#[spacetimedb::table(name = action, public)]
pub struct Action {
    #[auto_inc]
    #[primary_key]
    id: u64,
    #[index(btree)]
    game_id: u64,
    timestamp: Timestamp,
    action_type: String,
    description: String,
    game_state: Option<GameState>,
}

#[spacetimedb::table(name = games, public)]
pub struct Game {
    #[auto_inc]
    #[primary_key]
    id: u64,
    name: String,
    description: String,
}

#[derive(Clone, Debug)]
#[spacetimedb::table(name = underlay, public)]
pub struct Underlay {
    #[auto_inc]
    #[primary_key]
    id: u64,
    #[index(btree)]
    game_id: u64,
    shape_type: ShapeType,
    size: Vec<u32>,
    color: String,
    position: Vec<Position>,
}

#[derive(Clone, Debug)]
#[spacetimedb::table(name = overlay, public)]
pub struct Overlay {
    #[auto_inc]
    #[primary_key]
    id: u64,
    #[index(btree)]
    game_id: u64,
    shape_type: ShapeType,
    size: Vec<u32>,
    color: String,
    position: Vec<Position>,
}

#[derive(SpacetimeType, Clone, Debug)]
pub struct Position {
    x: u32,
    y: u32,
}

#[derive(SpacetimeType, Copy, Clone, Debug)]
pub enum ShapeType {
    Circle,
    Rectangle,
    Line,
    Polygon,
    Text,
}

fn create_shape_obj(shape_type: &ShapeType, positions: &[Position], sizes: &[u32]) -> Option<SharedShape> {
    if positions.is_empty() {
        return None;
    }

    match shape_type {
        ShapeType::Circle => {
            if sizes.is_empty() {
                return None;
            }
            let radius = sizes[0] as f32 / 2.0;
            Some(SharedShape::ball(radius))
        },
        ShapeType::Rectangle => {
            if sizes.len() < 2 {
                return None;
            }
            Some(SharedShape::cuboid(sizes[0] as f32 / 2.0, sizes[1] as f32 / 2.0))
        },
        ShapeType::Polygon => {
            if positions.len() < 3 {
                return None; // Need at least 3 points for a polygon
            }
            
            let mut vertices = Vec::with_capacity(positions.len());
            for pos in positions {
                vertices.push(Point::new(pos.x as f32, pos.y as f32));
            }
            
            // Convert the vertices to a convex polygon shape
            match SharedShape::convex_polyline(vertices) {
                Some(shape) => Some(shape),
                None => None,
            }
        },
        ShapeType::Line => {
            if positions.len() < 2 {
                return None;
            }
            let p1 = Point::new(positions[0].x as f32, positions[0].y as f32);
            let p2 = Point::new(positions[1].x as f32, positions[1].y as f32);
            Some(SharedShape::segment(p1, p2))
        },
        _ => None, // Text shapes don't have collisions
    }
}

fn create_collider(
    shape_type: &ShapeType, 
    positions: &[Position], 
    sizes: &[u32]
) -> Option<(RigidBody, Collider)> {
    if positions.is_empty() {
        return None;
    }
    
    let shape = create_shape_obj(shape_type, positions, sizes)?;
    
    let position = match shape_type {
        ShapeType::Circle => {
            let x = positions[0].x as f32;
            let y = positions[0].y as f32;
            Isometry::translation(x, y)
        },
        ShapeType::Rectangle => {
            let x = positions[0].x as f32;
            let y = positions[0].y as f32;
            Isometry::translation(x, y)
        },
        ShapeType::Polygon | ShapeType::Line => {
            Isometry::identity()
        },
        _ => Isometry::identity(),
    };
    
    let rigid_body = RigidBodyBuilder::fixed()
        .position(position)
        .build();
        
    let collider = ColliderBuilder::new(shape).build();
    
    Some((rigid_body, collider))
}

fn check_shape_collision_items<T: Collidable>(
    moving_shape_type: &ShapeType,
    moving_pos: &[Position],
    moving_size: &[u32],
    items: &[T],
    skip_id: Option<u64>, // Optionally skip a unit (e.g. the moving one itself)
) -> bool {
    let (bodies, colliders, _) = build_colliders(items, true, skip_id);
    
    // Prepare the moving shape
    let moving_shape = match create_shape_obj(moving_shape_type, moving_pos, moving_size) {
        Some(s) => s,
        None => return false,
    };
    let moving_iso = Isometry::new(vector![moving_pos[0].x as f32, moving_pos[0].y as f32], 0.0);
    let mut pipeline = QueryPipeline::new();
    pipeline.update(&bodies, &colliders);
    let mut colliding = false;
    pipeline.intersections_with_shape(
        &bodies,
        &colliders,
        &moving_iso,
        &*moving_shape,
        QueryFilter::default(),
        |_| {
            colliding = true;
            false
        },
    );
    colliding
}

fn build_colliders<T: Collidable>(items: &[T], traversable_check: bool, skip_id: Option<u64>) -> (RigidBodySet, ColliderSet, std::collections::HashMap<rapier2d::prelude::ColliderHandle, u64>) {
    let mut bodies = RigidBodySet::new();
    let mut colliders = ColliderSet::new();
    let mut handle_to_id = std::collections::HashMap::new();
    for item in items {
        if let Some(skip_id) = skip_id {
            if item.id() == skip_id { continue; }
        }
        if traversable_check && item.traversable() {
            continue;
        }
        if let Some((rb, col)) = create_collider(&item.shape_type(), &item.position(), &item.size()) {
            let body_handle = bodies.insert(rb);
            let col_handle = colliders.insert_with_parent(col, body_handle, &mut bodies);
            handle_to_id.insert(col_handle, item.id());
        }
    }
    (bodies, colliders, handle_to_id)
}

fn find_item_at_point<T: Collidable>(items: &[T], x: u32, y: u32) -> Option<u64> {
    let (bodies, colliders, handle_to_id) = build_colliders(items, false, None);
    let mut pipeline = QueryPipeline::new();
    pipeline.update(&bodies, &colliders);
    let click_point = Point::new(x as f32, y as f32);
    let mut found_item_id = None;
    pipeline.intersections_with_point(
        &bodies,
        &colliders,
        &click_point,
        QueryFilter::default(),
        |handle| {
            if let Some(&item_id) = handle_to_id.get(&handle) {
                found_item_id = Some(item_id);
                false
            } else {
                true
            }
        },
    );
    found_item_id
}

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    _ctx.db.games().insert(Game { 
        id: 0,
        name: "Game 1".to_string(),
        description: "Description 1".to_string(),
    });
    _ctx.db.games().insert(Game { 
        id: 0,
        name: "Game 2".to_string(),
        description: "Description 2".to_string(),
    });
   // for game1 and grame2 setup a game state
    for  game_id in 0..2 {
        _ctx.db.unit().insert(Unit { 
            id: 0, 
            game_id,
            shape_type: ShapeType::Circle,
            size: vec![28], 
            color: "blue".to_string(),
            position: vec![Position { x: 50, y: 50 }],
        });
    
        _ctx.db.unit().insert(Unit { 
            id: 0, 
            game_id,
            shape_type: ShapeType::Circle,
            size: vec![28], 
            color: "red".to_string(),
            position: vec![Position { x: 150, y: 50 }],
        });
        _ctx.db.unit().insert(Unit { 
            id: 0, 
            game_id,
            shape_type: ShapeType::Rectangle,
            size: vec![30, 30],
            color: "yellow".to_string(),
            position: vec![Position { x: 100, y: 100 }],
        });
        
        _ctx.db.terrain().insert(Terrain { 
            id: 0, 
            game_id,
            shape_type: ShapeType::Rectangle,
            size: vec![150, 100],
            color: "#8fbc8f".to_string(),
            position: vec![Position { x: 200, y: 250 }, Position { x: 350, y: 350 }],
            traversable: true,
        });
        
        _ctx.db.terrain().insert(Terrain { 
            id: 0, 
            game_id,
            shape_type: ShapeType::Rectangle,
            size: vec![80, 80],
            color: "#8fbc8f".to_string(),
            position: vec![Position { x: 50, y: 100 }, Position { x: 130, y: 180 }],
            traversable: true,
        });
    
        _ctx.db.terrain().insert(Terrain { 
            id: 0, 
            game_id,
            shape_type: ShapeType::Rectangle,
            size: vec![120, 60],
            color: "#8b4513".to_string(),  
            position: vec![Position { x: 400, y: 150 }, Position { x: 520, y: 210 }],
            traversable: false,
        });
        
        _ctx.db.terrain().insert(Terrain { 
            id: 0, 
            game_id,
            shape_type: ShapeType::Circle,
            size: vec![50],  
            color: "#8b4513".to_string(),  
            position: vec![Position { x: 100, y: 300 }],
            traversable: false,
        });
        
        _ctx.db.terrain().insert(Terrain {
            id: 0,
            game_id,
            shape_type: ShapeType::Line,
            size: vec![3],
            color: "rgba(255, 0, 0, 0.8)".to_string(),
            position: vec![Position { x: 50, y: 50 }, Position { x: 550, y: 350 }],
            traversable: false,
        });
    
        _ctx.db.underlay().insert(Underlay {
            id: 0,
            game_id,
            shape_type: ShapeType::Circle,
            size: vec![100],
            color: "rgba(0, 255, 0, 0.2)".to_string(),
            position: vec![Position { x: 300, y: 300 }],
        });
    
        _ctx.db.underlay().insert(Underlay {
            id: 0,
            game_id,
            shape_type: ShapeType::Rectangle,
            size: vec![100, 100],
            color: "rgba(255, 165, 0, 0.2)".to_string(),
            position: vec![Position { x: 100, y: 100 }, Position { x: 200, y: 200 }],
        });
    
        _ctx.db.overlay().insert(Overlay {
            id: 0,
            game_id,
            shape_type: ShapeType::Line,
            size: vec![3],
            color: "rgba(255, 0, 0, 0.8)".to_string(),
            position: vec![Position { x: 50, y: 50 }, Position { x: 550, y: 350 }],
        });
    
        _ctx.db.overlay().insert(Overlay {
            id: 0,
            game_id,
            shape_type: ShapeType::Polygon,
            size: vec![0],
            color: "rgba(0, 0, 255, 0.3)".to_string(),
            position: vec![
                Position { x: 400, y: 100 },
                Position { x: 500, y: 100 },
                Position { x: 500, y: 200 },
                Position { x: 400, y: 200 }
            ],
        });
    
        _ctx.db.overlay().insert(Overlay {
            id: 0,
            game_id,
            shape_type: ShapeType::Text,
            size: vec![24],
            color: "rgba(0, 0, 0, 1.0)".to_string(),
            position: vec![Position { x: 250, y: 50 }],
        });
    
        for t in border_terrain_lines(game_id) {
            _ctx.db.terrain().insert(t);
        }
    }
}

#[spacetimedb::reducer(client_connected)]
pub fn identity_connected(_ctx: &ReducerContext) {
}

#[spacetimedb::reducer(client_disconnected)]
pub fn identity_disconnected(_ctx: &ReducerContext) {
}

#[spacetimedb::reducer]
pub fn add_unit(ctx: &ReducerContext, game_id: u64, shape_type: ShapeType, size: Vec<u32>, color: String, position: Vec<Position>) {
    ctx.db.unit().insert(Unit { 
        id: 0, 
        game_id,
        shape_type, 
        size, 
        color, 
        position,
    });
}

#[spacetimedb::reducer]
pub fn add_terrain(ctx: &ReducerContext, game_id: u64, shape_type: ShapeType, size: Vec<u32>, color: String, position: Vec<Position>, traversable: bool) {
    ctx.db.terrain().insert(Terrain { 
        id: 0,
        game_id,
        shape_type, 
        size, 
        color, 
        position,
        traversable,
    });
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
pub fn delete_terrain(ctx: &ReducerContext, terrain_id: u64) {
    if let Some(_terrain) = ctx.db.terrain().id().find(terrain_id) {
        ctx.db.terrain().id().delete(terrain_id);
    } else {
        log::error!("Failed to delete terrain: ID {} not found", terrain_id);
    }
}

#[spacetimedb::reducer]
pub fn delete_at_coordinates(ctx: &ReducerContext, game_id: u64, x: u32, y: u32) {
    let units: Vec<Unit> = ctx.db.unit().game_id().filter(&game_id).collect();
    if let Some(unit_id) = find_item_at_point(&units, x, y) {
        ctx.db.unit().id().delete(unit_id);
        return;
    }
    let terrains: Vec<Terrain> = ctx.db.terrain().game_id().filter(&game_id).collect();
    if let Some(terrain_id) = find_item_at_point(&terrains, x, y) {
        ctx.db.terrain().id().delete(terrain_id);
        return;
    }
}

#[spacetimedb::reducer]
pub fn delete_all(ctx: &ReducerContext, game_id: u64) {
    for unit in ctx.db.unit().game_id().filter(&game_id) {
        ctx.db.unit().id().delete(unit.id);
    }
    for terrain in ctx.db.terrain().game_id().filter(&game_id) {
        ctx.db.terrain().id().delete(terrain.id);
    }
}

#[spacetimedb::reducer]
pub fn roll_dice(ctx: &ReducerContext, game_id: u64) {
    let mut rng = ctx.rng();
    let dice_value = rng.gen_range(1..=6);
    
    let description = format!("🎲 Dice Roll: {}", dice_value);
    
    ctx.db.action().insert(Action {
        id: 0,
        game_id,
        timestamp: ctx.timestamp,
        action_type: "DICE_ROLL".to_string(),
        description: description,
        game_state: Some(GameState {
            terrains: ctx.db.terrain().game_id().filter(&game_id).collect(),
            units: ctx.db.unit().game_id().filter(&game_id).collect(),
            underlays: ctx.db.underlay().game_id().filter(&game_id).collect(),
            overlays: ctx.db.overlay().game_id().filter(&game_id).collect(),
            game_id,
        }),
    });
}

#[spacetimedb::reducer]
pub fn chat_message(ctx: &ReducerContext, game_id: u64, message: String) {
    ctx.db.action().insert(Action {
        id: 0,
        game_id,
        timestamp: ctx.timestamp,
        action_type: "CHAT_MESSAGE".to_string(),
        description: message,
        game_state: None,
    });
}

#[spacetimedb::reducer]
pub fn add_underlay(ctx: &ReducerContext, game_id: u64, shape_type: ShapeType, size: Vec<u32>, color: String, position: Vec<Position>) {
    ctx.db.underlay().insert(Underlay { 
        id: 0, 
        game_id,
        shape_type, 
        size, 
        color, 
        position,
    });
}

#[spacetimedb::reducer]
pub fn add_overlay(ctx: &ReducerContext, game_id: u64, shape_type: ShapeType, size: Vec<u32>, color: String, position: Vec<Position>) {
    ctx.db.overlay().insert(Overlay { 
        id: 0, 
        game_id,
        shape_type, 
        size, 
        color, 
        position,
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
pub fn handle_mouse_event(ctx: &ReducerContext, game_id: u64, event_type: String, x: u32, y: u32, offset_x: u32, offset_y: u32) {
    match event_type.as_str() {
        "mousedown" => {
            let units: Vec<Unit> = ctx.db.unit().game_id().filter(&game_id).collect();
            if let Some(unit_id) = find_item_at_point(&units, x, y) {
                ctx.db.selected_unit().insert(SelectedUnit { 
                    id: unit_id,
                    game_id,
                    start_x: x,
                    start_y: y,
                    offset_x: 0,
                    offset_y: 0,
                });
            }
        }
        "mousemove" => {
            if let Some(selected) = ctx.db.selected_unit().game_id().filter(&game_id).next() {
                if let Some(unit) = ctx.db.unit().id().find(selected.id) {
                    let new_x = unit.position[0].x + offset_x;
                    let new_y = unit.position[0].y + offset_y;
                    
                    let new_pos = vec![Position { x: new_x, y: new_y }];
                    let units: Vec<Unit> = ctx.db.unit().game_id().filter(&game_id).collect();
                    let terrains: Vec<Terrain> = ctx.db.terrain().game_id().filter(&game_id).collect();
                    let will_collide = check_shape_collision_items(
                        &unit.shape_type,
                        &new_pos,
                        &unit.size,
                        &units,
                        Some(unit.id),
                    );

                    if !will_collide {
                        let will_collide_terrains = check_shape_collision_items(
                            &unit.shape_type,
                            &new_pos,
                            &unit.size,
                            &terrains,
                            None,
                        );
                        if !will_collide_terrains {
                            ctx.db.unit().id().update(Unit { 
                        id: unit.id,
                        game_id,
                        shape_type: unit.shape_type,
                        size: unit.size,
                        color: unit.color,
                        position: new_pos,
                    });
                        }
                    }
                }
            }
        }
        "mouseup" => {
            for selected in ctx.db.selected_unit().game_id().filter(&game_id) {
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
    #[index(btree)]
    game_id: u64,
    start_x: u32,
    start_y: u32,
    offset_x: u32,
    offset_y: u32,
}
