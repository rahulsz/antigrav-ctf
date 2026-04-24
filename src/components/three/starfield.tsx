"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { Timer } from "three";

function StarfieldScene() {
  const timer = useRef(new Timer());

  useFrame((state) => {
    timer.current.update();
    // Slow rotation for subtle movement
    state.scene.rotation.y = timer.current.getElapsed() * 0.02;
  });

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <Stars
        radius={100}
        depth={60}
        count={4000}
        factor={4}
        saturation={0}
        fade
        speed={0}
      />
      <ambientLight intensity={0.1} />
    </>
  );
}

export default function Starfield() {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 1] }}
        style={{ background: "transparent" }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <StarfieldScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
