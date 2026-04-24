"use client";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Suspense } from "react";

function StarfieldScene() {
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
        speed={0.8}
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
      >
        <Suspense fallback={null}>
          <StarfieldScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
