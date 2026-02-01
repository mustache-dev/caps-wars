import { useEffect, useMemo, useRef } from 'react'
import { MeshBasicNodeMaterial, Quaternion, Vector3 } from 'three/webgpu'
import { Instances as InstancedMesh, type InstancesRef } from './instanceEcs'
import { useGLTF } from '@react-three/drei'
import {
  color,
  dot,
  normalView,
  positionLocal,
  positionViewDirection,
  pow,
  uv,
  vec4,
  float,
} from 'three/tsl'
import { eventBus, EVENTS } from '@/constants'
import { useFrame } from '@react-three/fiber'
import { PARTICLES, useVFXEmitter } from './particles'

export const Bullets = () => {
  const { nodes, materials } = useGLTF('/projectile-transformed.glb')
  const { emit } = useVFXEmitter(PARTICLES.BULLET_SPARKS)
  const ref = useRef<InstancesRef>(null!)
  const col = color('#ff8426')
  const speed = 15
  const geometry = nodes.Sphere.geometry
  const { emit: emitFlare } = useVFXEmitter(PARTICLES.BULLET_FLARE)
  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial()
    mat.transparent = true
    const fresnel = pow(dot(positionViewDirection, normalView).abs(), 10)

    mat.colorNode = vec4(col.mul(4), fresnel)
    return mat
  }, [])

  useEffect(() => {
    eventBus.on(EVENTS.SHOOT, (pos, quat) => {
      const zRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)
      const dir = new Vector3(0, 0, 1).applyQuaternion(quat).negate().normalize()
      emitFlare(pos, 5)
      ref.current.addInstances(1, (obj) => {
        obj.position.set(pos.x, pos.y, pos.z)
        obj.quaternion.copy(quat).multiply(zRotation)
        obj.scale.set(0.3, 0.3, 0.3)
        obj.direction = dir
        obj.lifetime = 0
      })
    })
  }, [])

  useFrame(({ delta }) => {
    if (ref.current) {
      ref.current.updateInstances((obj: any) => {
        obj.position.addScaledVector(obj.direction, speed * delta)
        emit(obj.position, 1, {
          emitterShape: 2,
          emitterRadius: [0, 0.01],
        })

        obj.lifetime += delta
        if (obj.lifetime > 5) obj.remove()
      })
    }
  })

  return <InstancedMesh ref={ref} args={[geometry, material, 2000]} />
}
