"use client";
import dynamic from "next/dynamic";

const StarfieldCanvas = dynamic(
  () => import("@/components/three/starfield"),
  { ssr: false }
);

export function StarfieldWrapper() {
  return <StarfieldCanvas />;
}
