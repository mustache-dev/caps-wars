import { VFXParticles } from 'r3f-vfx'
import { CapsuleGeometry } from 'three/webgpu'
import { PARTICLES } from './index'

export const Dodge = () => {
  return (
    <>
      <VFXParticles
        name={PARTICLES.DODGE}
        autoStart={false}
        geometry={new CapsuleGeometry(0.25, 0.5, 4, 15)}
        position={[0, 0, 0]}
        maxParticles={100}
        size={[2, 2]}
        fadeSize={[1, 1]}
        colorStart={['#63acff']}
        fadeOpacity={[0.01, 0]}
        lifetime={[0.3, 0.3]}
        friction={{
          intensity: 0,
          easing: 'linear',
        }}
        direction={[
          [-1, 1],
          [0, 1],
          [-1, 1],
        ]}
        appearance="gradient"
        blending={1}
        lighting="basic"
        emitterShape={1}
        emitterRadius={[0, 1]}
        emitterAngle={0.7853981633974483}
        emitterHeight={[0, 1]}
        emitterDirection={[0, 1, 0]}
      />
      <VFXParticles
        name={PARTICLES.DODGE_SPARKS}
        maxParticles={100}
        autoStart={false}
        position={[0, 0, 0]}
        intensity={4}
        size={[0.01, 0.07]}
        fadeSize={[1, 0]}
        colorStart={['#63acff']}
        fadeOpacity={[1, 0]}
        gravity={[0, -0.7, 0]}
        speed={[0, 2]}
        lifetime={[1, 2]}
        friction={{
          intensity: 0,
          easing: 'linear',
        }}
        direction={[
          [-1, 1],
          [0, 1],
          [-1, 1],
        ]}
        startPosition={[
          [-0.3, 0.3],
          [-1, 1],
          [-0.3, 0.3],
        ]}
        rotation={[0, 0]}
        rotationSpeed={[0, 0]}
        appearance="gradient"
        blending={2}
        lighting="basic"
        emitterShape={1}
        emitterRadius={[0, 1]}
        emitterAngle={0.7853981633974483}
        emitterHeight={[0, 1]}
        emitterDirection={[0, 1, 0]}
      />
    </>
  )
}
