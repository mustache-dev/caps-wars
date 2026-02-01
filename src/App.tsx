import { Canvas } from '@react-three/fiber'
import { Lights } from './components/lights'
import { Html, KeyboardControls, Preload } from '@react-three/drei'
import { PostProcessing } from './components/postprocessing'
import { Floor } from './components/floor'
import { HalfFloatType } from 'three'
import { PlayerController } from './PlayerController'
import { Particles } from './components/particles'
import { Suspense } from 'react'
import { EnemySystem } from './ecs/enemy'
import { Bullets } from './components/bullets'

function App() {
  const keyboardMap = [
    { name: 'up', keys: ['KeyW', 'ArrowUp'] },
    { name: 'down', keys: ['KeyS', 'ArrowDown'] },
    { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
    { name: 'right', keys: ['KeyD', 'ArrowRight'] },
    { name: 'dash', keys: ['ShiftLeft'] },
  ]
  return (
    <>
      <Canvas
        flat
        shadows
        // shadows="soft"
        renderer={{
          antialias: false,
          depth: false,
          stencil: false,
          alpha: false,
          forceWebGL: false,
          outputType: HalfFloatType,
        }}
      >
        {/* <WobblySphere/>
      <WobblySphere2/> */}
        <Suspense fallback={<Html>loading...</Html>}>
          <Floor />
          <Lights />
          <PostProcessing />
          <Particles />
          {/*<OrbitControls /> */}
          <KeyboardControls map={keyboardMap}>
            <PlayerController />
          </KeyboardControls>
          <Bullets />

          <EnemySystem initialCount={3} spawnRadius={6} />
          <Preload all />
        </Suspense>
      </Canvas>
    </>
  )
}

export default App
