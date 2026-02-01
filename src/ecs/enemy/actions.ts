import { createActions } from 'koota'
import {
  IsEnemy,
  IsMeleeEnemy,
  IsRangeEnemy,
  Position,
  Velocity,
  TargetVelocity,
  Rotation,
  Scale,
  Health,
  Speed,
  Color,
  MeshRef,
  isSpawned,
  ShootTimer,
  StunState,
} from './traits'
import { eventBus, EVENTS } from '@/constants'

export type EnemyType = 'melee' | 'range'

/**
 * ACTIONS - Factory functions for creating/destroying enemies
 *
 * Actions are bound to the world and provide a clean API
 * for spawning and managing entities.
 */

export type SpawnEnemyOptions = {
  position?: { x: number; y: number; z: number }
  velocity?: { x: number; y: number; z: number }
  health?: number
  speed?: number
  color?: { r: number; g: number; b: number }
  scale?: number
  type?: EnemyType
}

export const enemyActions = createActions((world) => ({
  /**
   * Spawn an enemy with configurable options
   */
  spawnEnemy: (options: SpawnEnemyOptions = {}) => {
    const {
      position = { x: 0, y: 0, z: 0 },
      velocity = { x: 0, y: 0, z: 0 },
      health = 100,
      speed = 1,
      color = { r: 1, g: 0.2, b: 0.2 },
      scale = 1,
      type = 'melee',
    } = options

    // Choose type tag based on enemy type
    const typeTag = type === 'melee' ? IsMeleeEnemy : IsRangeEnemy

    // Base traits common to all enemies
    const baseTraits = [
      // Tags
      IsEnemy,
      typeTag,
      // Transform
      Position(position),
      Velocity(velocity),
      TargetVelocity(velocity), // Smooth steering target
      Rotation({ x: 0, y: 0, z: 0 }),
      Scale({ x: scale, y: scale, z: scale }),
      // Gameplay
      Health({ current: health, max: health }),
      Speed({ value: speed }),
      StunState({ duration: 0 }),
      isSpawned({ value: false }),
      // Visuals
      Color(color),
      MeshRef,
    ]

    // Add ShootTimer for range enemies
    if (type === 'range') {
      baseTraits.push(ShootTimer())
    }

    const entity = world.spawn(...baseTraits)

    return entity
  },

  /**
   * Spawn multiple enemies in a pattern with random types
   */
  spawnEnemyWave: (count: number, radius: number = 5) => {
    const entities = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const type: EnemyType = 'range'
      const typeTag = type === 'melee' ? IsMeleeEnemy : IsRangeEnemy

      const baseTraits = [
        IsEnemy,
        typeTag,
        Position({
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius,
        }),
        Velocity({ x: 0, y: 0, z: 0 }),
        TargetVelocity({ x: 0, y: 0, z: 0 }),
        Rotation({ x: 0, y: 0, z: 0 }),
        Scale({ x: 1, y: 1, z: 1 }),
        Health({ current: 100, max: 100 }),
        Speed({ value: 1 }),
        StunState({ duration: 0 }),
        Color({ r: 1, g: 0.2, b: 0.2 }),
        MeshRef,
      ]

      // Add ShootTimer for range enemies
      if (type === 'range') {
        baseTraits.push(ShootTimer())
      }

      const entity = world.spawn(...baseTraits)
      entities.push(entity)
    }
    return entities
  },

  /**
   * Destroy a specific enemy
   */
  destroyEnemy: (entity: ReturnType<typeof world.spawn>) => {
    if (entity.has(IsEnemy)) {
      entity.destroy()
    }
  },

  /**
   * Destroy all enemies
   */
  destroyAllEnemies: () => {
    world.query(IsEnemy).forEach((entity) => {
      entity.destroy()
    })
  },

  /**
   * Damage an enemy, destroy if health <= 0
   */
  damageEnemy: (entity: ReturnType<typeof world.spawn>, amount: number) => {
    if (!entity.has(Health)) return

    const health = entity.get(Health)!
    const newHealth = Math.max(0, health.current - amount)

    entity.set(Health, { current: newHealth, max: health.max })
    const meshRef = entity.get(MeshRef)!

    if (newHealth <= 0) {
      entity.destroy()
      eventBus.emit(EVENTS.ENEMY_DEAD, meshRef?.current?.position)
    }
  },
}))
