import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { useTexture, OrthographicCamera, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useWarpStore } from '../hooks/useWarpStore';

const DeformablePlane: React.FC = () => {
  const { imageUrl, resolution, warpIntensity, controlPoints, heightScale, pathOffset, setPathOffset, imageLengthRatio } = useWarpStore();
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useTexture(imageUrl || 'https://picsum.photos/1024/1024');
  const planeHeight = 2 * heightScale;
  
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startPoint: new THREE.Vector3(), startOffset: 0, startT: 0 });

  const intersectionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  const originalPositions = useMemo(() => {
    const plane = new THREE.PlaneGeometry(2, planeHeight, resolution, 1);
    const positions = plane.attributes.position.clone();
    plane.dispose();
    return positions;
  }, [resolution, planeHeight]);

  const curve = useMemo(() => {
    if (controlPoints.length < 2) return null;
    return new THREE.CatmullRomCurve3(controlPoints.map(p => p.clone()), false, 'catmullrom', 0.5);
  }, [controlPoints]);

  const curveLength = useMemo(() => curve?.getLength() ?? 1, [curve]);

  useEffect(() => {
    document.body.style.cursor = isDragging ? 'grabbing' : 'auto';
  }, [isDragging]);

  useFrame(() => {
    if (!meshRef.current || !curve) return;

    const geom = meshRef.current.geometry;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < pos.count; i++) {
      const x = originalPositions.getX(i);
      const y = originalPositions.getY(i);

      const u = (x + 1) / 2;
      const t = pathOffset + u * imageLengthRatio;
      const clampedT = Math.max(0, Math.min(1, t));

      const pointOnPath = curve.getPointAt(clampedT);
      const tangent = curve.getTangentAt(clampedT).normalize();

      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
      const offsetVector = new THREE.Vector3().copy(normal).multiplyScalar(y * warpIntensity);
      const newPos = pointOnPath.add(offsetVector);
      
      pos.setXYZ(i, newPos.x, newPos.y, newPos.z);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
  });
  
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.uv || !curve) return;

    setIsDragging(true);

    const startPointOnPlane = new THREE.Vector3();
    if (!e.ray.intersectPlane(intersectionPlane, startPointOnPlane)) {
      console.error("Ray did not intersect the drag plane on pointer down.");
      setIsDragging(false);
      return;
    }

    const startT = pathOffset + e.uv.x * imageLengthRatio;
    
    dragStartRef.current = { 
      startPoint: startPointOnPlane,
      startOffset: pathOffset,
      startT: Math.max(0, Math.min(1, startT)),
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
     (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !curve) return;
    e.stopPropagation();
    
    const currentPointOnPlane = new THREE.Vector3();
    if (!e.ray.intersectPlane(intersectionPlane, currentPointOnPlane)) {
      return;
    }
    
    const moveVector = currentPointOnPlane.clone().sub(dragStartRef.current.startPoint);
    const tangent = curve.getTangentAt(dragStartRef.current.startT).normalize();
    const distanceAlongCurve = moveVector.dot(tangent);
    const deltaOffset = distanceAlongCurve / curveLength;
    const newOffset = dragStartRef.current.startOffset + deltaOffset;
    
    setPathOffset(newOffset);
  };
  
  return (
    <mesh 
      ref={meshRef}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerUp}
    >
      <planeGeometry args={[2, planeHeight, resolution, 1]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        map-anisotropy={16}
      />
    </mesh>
  );
};

const DraggablePoint: React.FC<{ index: number }> = ({ index }) => {
    const { controlPoints, updateControlPoint } = useWarpStore();
    const meshRef = useRef<THREE.Mesh>(null!);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const intersectionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
    const intersectionPoint = useMemo(() => new THREE.Vector3(), []);

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.position.copy(controlPoints[index]);
        }
    }, [controlPoints, index]);
    
    useEffect(() => {
      document.body.style.cursor = isDragging || isHovered ? 'grab' : 'auto';
      if (isDragging) document.body.style.cursor = 'grabbing';
      return () => { document.body.style.cursor = 'auto' };
    }, [isDragging, isHovered]);

    const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging) return;
        e.stopPropagation();
        if (e.ray.intersectPlane(intersectionPlane, intersectionPoint)) {
            updateControlPoint(index, intersectionPoint);
        }
    };

    return (
        <mesh
            ref={meshRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerMove={onPointerMove}
            onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setIsHovered(false); }}
        >
            <sphereGeometry args={[0.05, 32, 32]} />
            <meshBasicMaterial
                color={isDragging ? 'hotpink' : 'white'}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
};

const ControlPointDraggers = () => {
    const { controlPoints } = useWarpStore();
    return (
        <group>
            {controlPoints.map((_, i) => (
                <DraggablePoint key={i} index={i} />
            ))}
        </group>
    );
};

const CurvePath = () => {
    const { controlPoints } = useWarpStore();
    const curve = useMemo(() => new THREE.CatmullRomCurve3(controlPoints.map(p => p.clone()), false, 'catmullrom', 0.5), [controlPoints]);
    const points = useMemo(() => curve.getPoints(100), [curve]);
    
    return <Line points={points} color="white" lineWidth={1} transparent opacity={0.5} />;
};

const Scene: React.FC = () => {
    const { saveTrigger } = useWarpStore();
    const { gl, scene, camera } = useThree();
  
    useEffect(() => {
      if (saveTrigger > 0) {
        gl.render(scene, camera);
        const dataURL = gl.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'warped-image.png';
        link.href = dataURL;
        link.click();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveTrigger]);
  
    return (
      <>
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 0, 5]} intensity={1} />
        <CurvePath />
        <DeformablePlane />
        <ControlPointDraggers />
        <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={100} near={0.1} far={1000} />
      </>
    );
  };
  

const WarpCanvas: React.FC = () => {
  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      dpr={[1, 2]}
    >
      <Scene />
    </Canvas>
  );
};

export default WarpCanvas;
