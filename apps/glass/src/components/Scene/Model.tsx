import { useEffect, useRef } from 'react';
import { MeshTransmissionMaterial, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCroppedBackground } from '../../hooks';
import type { Mesh } from 'three';

type Props = {
  size?: number;
  thickness?: number;
  roughness?: number;
  transmission?: number;
  ior?: number;
  chromaticAberration?: number;
};

export default function Model({
  size = 240,
  thickness = 0.5,
  roughness = 0,
  transmission = 1,
  ior = 1.1,
  chromaticAberration = 0.05,
}: Props) {
  const { nodes } = useGLTF('../cadball.glb');
  const pointer = useThree(state => state.pointer);
  const viewport = useThree(state => state.viewport);
  const torus = useRef<Mesh | null>(null);
  const glassMesh = nodes['scene(14)glb'] as Mesh | undefined;

  useEffect(() => {
    const target = torus.current;
    if (!target || !glassMesh || !glassMesh.geometry) return;

    const { geometry } = glassMesh;
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }

    const radius = geometry.boundingSphere?.radius ?? 1;
    const worldDiameter = Math.max(size, 1) / viewport.factor;
    const scale = worldDiameter / (radius * 2);

    target.scale.setScalar(scale);
  }, [glassMesh, size, viewport.factor]);

  useFrame(() => {
    const x = (pointer.x * viewport.width) / 2;
    const y = (pointer.y * viewport.height) / 2;
    torus.current?.position.set(x, y, 0);
  });

  const materialProps = {
    thickness,
    roughness,
    transmission,
    ior,
    chromaticAberration,
  };

  const croppedTexture = useCroppedBackground();

  return (
    <mesh ref={torus} {...nodes['scene(14)glb']}>
      <MeshTransmissionMaterial
        {...materialProps}
        {...(croppedTexture ? { background: croppedTexture } : {})}
      />
    </mesh>
  );
}
