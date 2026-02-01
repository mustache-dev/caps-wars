import type { World } from 'koota'
import {
  IsEnemy,
  Position,
  Velocity,
  Speed,
  MeshRef,
  Rotation,
  TargetVelocity,
  isSpawned,
  IsRangeEnemy,
  IsMeleeEnemy,
  ShootTimer,
  StunState,
} from './traits'
import { damp } from 'three/src/math/MathUtils.js'
import { eventBus, EVENTS } from '@/constants'
import { useGameStore } from '@/store'
import { checkCircleCollision, Layer } from '@/collision'

/** Damping factor for velocity smoothing (higher = snappier, lower = smoother) */
const VELOCITY_SMOOTHING = 3

/**
 * SYSTEMS - Update logic that runs each frame
 *
 * Systems query for entities with specific traits and update them.
 * Call these in useFrame() or a game loop.
 */

/**
 * Updates enemy positions based on velocity
 */
export function movementSystem(world: World, delta: number) {
  world.query(IsEnemy, Position, Velocity, Speed).updateEach(([pos, vel, speed]) => {
    pos.x += vel.x * speed.value * delta
    pos.y += vel.y * speed.value * delta
    pos.z += vel.z * speed.value * delta
  })
}

/**
 * Syncs ECS Position/Rotation/Scale to THREE.js mesh refs
 * Call this after movement systems to update visuals
 */
export function syncMeshSystem(world: World) {
  world.query(IsEnemy, Position, Rotation, MeshRef).forEach((entity) => {
    const pos = entity.get(Position)!
    const rot = entity.get(Rotation)!
    const meshRef = entity.get(MeshRef)!

    if (meshRef.current) {
      meshRef.current.position.set(pos.x, pos.y, pos.z)
      meshRef.current.rotation.set(rot.x, rot.y, rot.z)
    }
  })
}

/**
 * Simple wandering behavior - picks random target velocities (melee only)
 */
export function wanderSystem(world: World) {
  world.query(IsMeleeEnemy, TargetVelocity, StunState).forEach((entity) => {
    const targetVel = entity.get(TargetVelocity)!
    const stunState = entity.get(StunState)!

    // Don't move if stunned
    if (stunState.duration > 0) {
      entity.set(TargetVelocity, { x: 0, y: 0, z: 0 })
      return
    }

    if (Math.random() < 0.02) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.5 + Math.random() * 0.5

      entity.set(TargetVelocity, {
        x: Math.cos(angle) * speed,
        y: 0,
        z: Math.sin(angle) * speed,
      })
    }
  })
}

/**
 * Smoothly interpolates velocity toward target velocity using damp
 */
export function velocityDampingSystem(world: World, delta: number) {
  world.query(IsEnemy, Velocity, TargetVelocity).updateEach(([vel, targetVel]) => {
    vel.x = damp(vel.x, targetVel.x, VELOCITY_SMOOTHING, delta)
    vel.y = damp(vel.y, targetVel.y, VELOCITY_SMOOTHING, delta)
    vel.z = damp(vel.z, targetVel.z, VELOCITY_SMOOTHING, delta)
  })
}

/**
 * Bounds checking - keep enemies within a certain area
 */
export function boundsSystem(world: World, bounds: number = 10) {
  world.query(IsEnemy, Position, Velocity).updateEach(([pos, vel]) => {
    // Bounce off bounds
    if (Math.abs(pos.x) > bounds) {
      vel.x *= -1
      pos.x = Math.sign(pos.x) * bounds
    }
    if (Math.abs(pos.z) > bounds) {
      vel.z *= -1
      pos.z = Math.sign(pos.z) * bounds
    }
  })
}

/**
 * Rotation system - rotate enemies to face their movement direction
 */
export function faceMovementSystem(world: World) {
  world.query(IsEnemy, IsMeleeEnemy, Velocity, Rotation).updateEach(([vel, rot]) => {
    if (vel.x !== 0 || vel.z !== 0) {
      const rotationTarget = Math.atan2(vel.x, vel.z)
      rot.y = rotationTarget
    }
  })
}

/**
 * Range enemy behavior - look at player, move away, and shoot periodically
 */
export function rangeEnemyBehaviorSystem(world: World, delta: number) {
  const playerPosition = useGameStore.getState().playerPosition
  const now = Date.now()

  world
    .query(IsRangeEnemy, Position, TargetVelocity, Rotation, ShootTimer, StunState)
    .forEach((entity) => {
      const pos = entity.get(Position)!
      const rot = entity.get(Rotation)!
      const shootTimer = entity.get(ShootTimer)!
      const stunState = entity.get(StunState)!

      // Don't move or shoot if stunned
      if (stunState.duration > 0) {
        entity.set(TargetVelocity, { x: 0, y: 0, z: 0 })
        return
      }

      // Calculate vector from enemy to player
      const dx = playerPosition.x - pos.x
      const dz = playerPosition.z - pos.z
      const distanceToPlayer = Math.sqrt(dx * dx + dz * dz)

      // Look at player (rotate to face player)
      if (distanceToPlayer > 0.1) {
        const angleToPlayer = Math.atan2(dx, dz)
        // Update the rotation trait properly
        entity.set(Rotation, { x: rot.x, y: angleToPlayer, z: rot.z })
      }

      // Circle/strafe around player behavior
      const idealDistance = 8 // Ideal distance to maintain from player
      const strafeSpeed = 1.2 // Speed when circling
      const approachSpeed = 0.8 // Speed when adjusting distance

      if (distanceToPlayer > 0.1) {
        // Normalize direction to player
        const dirX = dx / distanceToPlayer
        const dirZ = dz / distanceToPlayer

        // Calculate perpendicular direction for strafing (tangent)
        const tangentX = -dirZ
        const tangentZ = dirX

        // Distance error (positive = too far, negative = too close)
        const distanceError = distanceToPlayer - idealDistance

        // Move towards/away from player to maintain ideal distance
        const radialVelX = dirX * distanceError * approachSpeed
        const radialVelZ = dirZ * distanceError * approachSpeed

        // Circle around player
        const tangentVelX = tangentX * strafeSpeed
        const tangentVelZ = tangentZ * strafeSpeed

        // Combine radial and tangent velocities
        entity.set(TargetVelocity, {
          x: radialVelX + tangentVelX,
          y: 0,
          z: radialVelZ + tangentVelZ,
        })
      } else {
        entity.set(TargetVelocity, { x: 0, y: 0, z: 0 })
      }

      // Shoot periodically
      if (now - shootTimer.lastShot >= shootTimer.nextShot) {
        // Trigger shoot event for this enemy
        eventBus.emit(EVENTS.ENEMY_ATTACK, entity.id())

        // Update timer with new random offset using entity.set()
        entity.set(ShootTimer, {
          lastShot: now,
          nextShot: 3000 + Math.random() * 2000, // 3-5 seconds
        })
      }
    })
}

/**
 * Stun decay system - reduces stun duration over time
 */
export function stunDecaySystem(world: World, delta: number) {
  world.query(IsEnemy, StunState).forEach((entity) => {
    const stunState = entity.get(StunState)!
    if (stunState.duration > 0) {
      entity.set(StunState, { duration: Math.max(0, stunState.duration - delta) })
    }
  })
}

/**
 * Enemy collision resolution - prevents enemies from overlapping
 */
const ENEMY_COLLISION_RADIUS = 0.5

export function enemyCollisionSystem(world: World) {
  world.query(IsEnemy, Position).forEach((entity) => {
    const pos = entity.get(Position)!
    const colliderId = `enemy-${entity.id()}`

    // Check collision with other enemies
    const collision = checkCircleCollision(
      pos.x,
      pos.z,
      ENEMY_COLLISION_RADIUS,
      colliderId,
      Layer.ENEMY
    )

    // Apply collision pushback if overlapping
    if (collision.hit) {
      entity.set(Position, {
        x: pos.x + collision.pushX,
        y: pos.y,
        z: pos.z + collision.pushZ,
      })
    }
  })
}

/**
 * Combined enemy update system - run all enemy systems in order
 */
export function updateEnemySystems(world: World, delta: number) {
  stunDecaySystem(world, delta)
  wanderSystem(world)
  rangeEnemyBehaviorSystem(world, delta)
  velocityDampingSystem(world, delta)
  movementSystem(world, delta)
  enemyCollisionSystem(world)
  boundsSystem(world, 100)
  faceMovementSystem(world)
  syncMeshSystem(world)
}
