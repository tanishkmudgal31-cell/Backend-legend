import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, PerspectiveCamera } from "@react-three/drei";
import { useRef } from "react";

function BankBuilding() {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;

    group.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
  });

  return (
    <group ref={group} position={[0, -0.9, 0]}>
      {/* Main platform */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.8, 0.35, 2.5]} />
        <meshStandardMaterial
          color="#07131c"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Blue platform glow */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[3.4, 0.12, 2.2]} />
        <meshStandardMaterial
          color="#071d2c"
          emissive="#00bfff"
          emissiveIntensity={1.8}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Bank base */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.8, 0.7, 1.7]} />
        <meshStandardMaterial
          color="#0a1925"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Columns */}
      {[-0.9, -0.3, 0.3, 0.9].map((x) => (
        <mesh key={x} position={[x, 1.65, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 1.7, 24]} />
          <meshStandardMaterial
            color="#1c394d"
            emissive="#008cff"
            emissiveIntensity={0.35}
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
      ))}

      {/* Roof */}
      <mesh position={[0, 2.65, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.05, 1.15, 4]} />
        <meshStandardMaterial
          color="#0b2638"
          emissive="#006cff"
          emissiveIntensity={0.35}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Bank sign */}
      <mesh position={[0, 2.15, 0.95]}>
        <boxGeometry args={[1.25, 0.45, 0.08]} />
        <meshStandardMaterial
          color="#07131c"
          emissive="#00cfff"
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
}

function TransactionNode({ position, color = "#00cfff" }) {
  return (
    <Float
      speed={1.5}
      rotationIntensity={0.2}
      floatIntensity={0.5}
    >
      <mesh position={position}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
        />
      </mesh>
    </Float>
  );
}

function NetworkLines() {
  return (
    <>
      <Line
        points={[
          [-2.7, 1.4, 0],
          [-1.2, 0.7, 0],
          [0, 1.5, 0],
        ]}
        color="#00cfff"
        lineWidth={1}
        transparent
        opacity={0.7}
      />

      <Line
        points={[
          [2.8, 2.3, 0],
          [1.2, 1.4, 0],
          [0, 1.5, 0],
        ]}
        color="#16a8ff"
        lineWidth={1}
        transparent
        opacity={0.7}
      />

      <Line
        points={[
          [-2.2, -0.8, 0],
          [-1.1, -0.3, 0],
          [0, -0.1, 0],
        ]}
        color="#00d4ff"
        lineWidth={1}
        transparent
        opacity={0.5}
      />

      <Line
        points={[
          [2.2, -0.5, 0],
          [1.2, -0.2, 0],
          [0, -0.1, 0],
        ]}
        color="#008cff"
        lineWidth={1}
        transparent
        opacity={0.5}
      />
    </>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 1.5, 8]}
        fov={45}
      />

      <ambientLight intensity={0.5} />

      <pointLight
        position={[0, 3, 3]}
        intensity={80}
        distance={10}
        color="#00cfff"
      />

      <pointLight
        position={[-4, 1, 2]}
        intensity={35}
        distance={8}
        color="#008cff"
      />

      <pointLight
        position={[4, 1, 2]}
        intensity={35}
        distance={8}
        color="#00bfff"
      />

      <BankBuilding />

      <NetworkLines />

      <TransactionNode
        position={[-2.7, 1.4, 0]}
        color="#ff5b5b"
      />

      <TransactionNode
        position={[2.8, 2.3, 0]}
        color="#22e6a8"
      />

      <TransactionNode
        position={[-2.2, -0.8, 0]}
        color="#00cfff"
      />

      <TransactionNode
        position={[2.2, -0.5, 0]}
        color="#4d9cff"
      />

      {/* Central transaction node */}
      <Float speed={1} floatIntensity={0.25}>
        <mesh position={[0, 3.25, 0]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshStandardMaterial
            color="#00d9ff"
            emissive="#00d9ff"
            emissiveIntensity={3}
          />
        </mesh>
      </Float>
    </>
  );
}

export default function FinancialCore3D() {
  return (
    <div className="financial-3d">
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}