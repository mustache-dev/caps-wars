import { Dodge } from './dodge'
import { EnemyDeath } from './enemyDeath'
import { Energy } from './energy'
import { Impact } from './impact'
import { Slash } from './slash'
import { Spawn } from './spawn'
import { BoxGeometry } from 'three'
import { useVFXEmitter as useVFXEmitterOriginal, VFXEmitter as VFXEmitterOriginal } from 'r3f-vfx'
import type { VFXEmitterProps as VFXEmitterPropsOriginal } from 'r3f-vfx'

export const PARTICLES = {
  SLASH: 'slash',
  SPARKS: 'sparks',
  DODGE: 'dodge',
  DODGE_SPARKS: 'dodge-sparks',
  IMPACT: 'impact',
  IMPACT_FLARE: 'impact-flare',
  SPAWN: 'spawn',
  DEATH: 'death',
  DEATH_2: 'death-2',
  ENERGY: 'energy',
} as const

export type ParticleType = (typeof PARTICLES)[keyof typeof PARTICLES]

/**
 * Type-safe VFX emitter hook
 * @example
 * const { start, stop, emit } = useVFXEmitter(PARTICLES.ENERGY)
 */
export const useVFXEmitter = (name: ParticleType) => {
  return useVFXEmitterOriginal(name)
}

export type VFXEmitterProps = Omit<VFXEmitterPropsOriginal, 'name'> & {
  name: ParticleType
}

/**
 * Type-safe VFX emitter component
 * @example
 * <VFXEmitter name={PARTICLES.SLASH} ref={slashEmitterRef} />
 */
export const VFXEmitter = VFXEmitterOriginal as React.ForwardRefExoticComponent<
  VFXEmitterProps & React.RefAttributes<{ emit: (overrides?: Record<string, unknown>) => void }>
>

export const Particles = () => {
  return (
    <>
      <Slash />
      <Dodge />
      <Impact />
      <Spawn />
      <EnemyDeath />
      <Energy />
    </>
  )
}
