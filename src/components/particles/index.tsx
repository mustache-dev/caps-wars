import { VFXParticles } from '../VFXParticles'
import { Dodge } from './dodge'
import { EnemyDeath } from './enemyDeath'
import { Energy } from './energy'
import { Impact } from './impact'
import { Slash } from './slash'
import { Spawn } from './spawn'
import { BoxGeometry } from 'three'
export const Particles = () => {
  return (
    <>
      <Slash />
      <Dodge />
      <Impact />
      <Spawn />
      <EnemyDeath />

    </>
  )
}
