import { Canvas } from '@react-three/fiber';
import Model from './Model';

type Props = {
  size?: number;
};

export default function Index({ size = 240 }: Props) {
  return (
    <Canvas gl={{ alpha: true }} className='scene'>
      <Model size={size} />
    </Canvas>
  );
}
