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

export const Bullets = () => {
  const { nodes, materials } = useGLTF('/projectile-transformed.glb')
  const ref = useRef<InstancesRef>(null!)
  const col = color('#ff8426')
  const speed = 15
  const geometry = nodes.Sphere.geometry
  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial()
    mat.transparent = true
    const fresnel = pow(dot(positionViewDirection, normalView).abs(), 5)

    mat.colorNode = vec4(col.mul(4), fresnel)
    return mat
  }, [])

  useEffect(() => {
    eventBus.on(EVENTS.SHOOT, (pos, quat) => {
      const zRotation = new Quaternion().setFromAxisAngle(new Vector3(-1, 0, 0), Math.PI / 2)
      const dir = new Vector3(0, 0, 1).applyQuaternion(quat).normalize()
      ref.current.addInstances(1, (obj) => {
        obj.position.set(pos.x, pos.y, pos.z)
        obj.quaternion.copy(quat).multiply(zRotation)
        obj.direction = dir
        obj.lifetime = 0
      })
    })
  }, [])

  useFrame(({ delta }) => {
    if (ref.current) {
      ref.current.updateInstances((obj: any) => {
        obj.position.addScaledVector(obj.direction, speed * delta)
        // emit(obj.position, 1)

        obj.lifetime += delta
        if (obj.lifetime > 5) obj.remove()
      })
    }
  })

  return <InstancedMesh ref={ref} args={[geometry, material, 2000]} />
}
