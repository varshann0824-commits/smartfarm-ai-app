import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { VoiceState } from './VoiceOrb';

/* ------------------------------------------------------------------ */
/* Aggressively optimized AI core:                                     */
/*  - low-poly geometry (icosahedron detail 1 + tiny particle spheres) */
/*  - capped DPR [1, 1.5], no shadows, no postprocessing               */
/*  - single lights pair, tiny scene graph                             */
/* ------------------------------------------------------------------ */

const PARTICLES = 12;
const PARTICLE_RADIUS = 0.045;

function Core({ state }: { state: VoiceState }) {
  const wire = useRef<THREE.Mesh>(null!);
  const inner = useRef<THREE.Mesh>(null!);
  const ring = useRef<THREE.Group>(null!);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    const spin =
      state === 'listening' ? 0.55 : state === 'thinking' ? 0.9 : state === 'speaking' ? 0.7 : 0.16;
    if (wire.current) {
      wire.current.rotation.y += delta * spin;
      wire.current.rotation.x += delta * spin * 0.35;
      const pulse =
        state === 'idle'
          ? 1 + Math.sin(t * 1.3) * 0.03
          : 1 + Math.sin(t * (state === 'speaking' ? 8 : 5.5)) * 0.08;
      wire.current.scale.setScalar(pulse);
    }
    if (inner.current) {
      const glow = state === 'idle' ? 0.35 : 0.85;
      const mat = inner.current.material as THREE.MeshBasicMaterial;
      mat.opacity += ((glow - 0.5) * 0.001 + (mat.opacity - glow) * -0.1);
      mat.opacity = THREE.MathUtils.clamp(
        mat.opacity + (glow - mat.opacity) * 0.08,
        0,
        1,
      );
    }
    if (ring.current) {
      ring.current.rotation.z += delta * (state === 'thinking' ? 1.5 : 0.45);
      ring.current.rotation.x = 0.5 + Math.sin(t * 0.4) * 0.12;
    }
  });

  const emissive =
    state === 'listening' ? '#f97316' : state === 'thinking' ? '#0e7490' : '#15803d';

  return (
    <group>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      {/* Wireframe shell */}
      <mesh ref={wire}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={0.45} wireframe transparent opacity={0.85} />
      </mesh>
      {/* Soft inner glow */}
      <mesh ref={inner} scale={0.62}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial color={emissive} transparent opacity={0.35} />
      </mesh>
      {/* Orbiting particles */}
      <group ref={ring}>
        {Array.from({ length: PARTICLES }, (_, i) => {
          const a = (i / PARTICLES) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.55, Math.sin(a * 2) * 0.16, Math.sin(a) * 1.55]}>
              <sphereGeometry args={[PARTICLE_RADIUS, 8, 8]} />
              <meshBasicMaterial color={i % 3 === 0 ? '#d97706' : i % 3 === 1 ? '#15803d' : '#0f766e'} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export default function VoiceCore3D({ state, height = 200 }: { state: VoiceState; height?: number }) {
  return (
    <div style={{ height }} className="w-full" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <Core state={state} />
      </Canvas>
    </div>
  );
}
