import { useEffect, useRef } from 'react'
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const waveVertexShader = `
precision highp float;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;
}
`

const ditherWaveFragmentShader = `
precision highp float;

uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform float colorNum;
uniform float pixelSize;
uniform vec2 mousePos;
uniform int enableMouseInteraction;
uniform float mouseRadius;

vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

const int OCTAVES = 4;

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = waveFrequency;

  for (int i = 0; i < OCTAVES; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= waveAmplitude;
  }

  return value;
}

float pattern(vec2 p) {
  vec2 p2 = p - time * waveSpeed;
  return fbm(p + fbm(p2));
}

float bayerThreshold(vec2 coord) {
  int x = int(mod(coord.x, 8.0));
  int y = int(mod(coord.y, 8.0));
  int index = y * 8 + x;

  float matrix[64];
  matrix[0] = 0.0 / 64.0; matrix[1] = 48.0 / 64.0; matrix[2] = 12.0 / 64.0; matrix[3] = 60.0 / 64.0;
  matrix[4] = 3.0 / 64.0; matrix[5] = 51.0 / 64.0; matrix[6] = 15.0 / 64.0; matrix[7] = 63.0 / 64.0;
  matrix[8] = 32.0 / 64.0; matrix[9] = 16.0 / 64.0; matrix[10] = 44.0 / 64.0; matrix[11] = 28.0 / 64.0;
  matrix[12] = 35.0 / 64.0; matrix[13] = 19.0 / 64.0; matrix[14] = 47.0 / 64.0; matrix[15] = 31.0 / 64.0;
  matrix[16] = 8.0 / 64.0; matrix[17] = 56.0 / 64.0; matrix[18] = 4.0 / 64.0; matrix[19] = 52.0 / 64.0;
  matrix[20] = 11.0 / 64.0; matrix[21] = 59.0 / 64.0; matrix[22] = 7.0 / 64.0; matrix[23] = 55.0 / 64.0;
  matrix[24] = 40.0 / 64.0; matrix[25] = 24.0 / 64.0; matrix[26] = 36.0 / 64.0; matrix[27] = 20.0 / 64.0;
  matrix[28] = 43.0 / 64.0; matrix[29] = 27.0 / 64.0; matrix[30] = 39.0 / 64.0; matrix[31] = 23.0 / 64.0;
  matrix[32] = 2.0 / 64.0; matrix[33] = 50.0 / 64.0; matrix[34] = 14.0 / 64.0; matrix[35] = 62.0 / 64.0;
  matrix[36] = 1.0 / 64.0; matrix[37] = 49.0 / 64.0; matrix[38] = 13.0 / 64.0; matrix[39] = 61.0 / 64.0;
  matrix[40] = 34.0 / 64.0; matrix[41] = 18.0 / 64.0; matrix[42] = 46.0 / 64.0; matrix[43] = 30.0 / 64.0;
  matrix[44] = 33.0 / 64.0; matrix[45] = 17.0 / 64.0; matrix[46] = 45.0 / 64.0; matrix[47] = 29.0 / 64.0;
  matrix[48] = 10.0 / 64.0; matrix[49] = 58.0 / 64.0; matrix[50] = 6.0 / 64.0; matrix[51] = 54.0 / 64.0;
  matrix[52] = 9.0 / 64.0; matrix[53] = 57.0 / 64.0; matrix[54] = 5.0 / 64.0; matrix[55] = 53.0 / 64.0;
  matrix[56] = 42.0 / 64.0; matrix[57] = 26.0 / 64.0; matrix[58] = 38.0 / 64.0; matrix[59] = 22.0 / 64.0;
  matrix[60] = 41.0 / 64.0; matrix[61] = 25.0 / 64.0; matrix[62] = 37.0 / 64.0; matrix[63] = 21.0 / 64.0;

  return matrix[index] - 0.25;
}

vec3 dither(vec2 uv, vec3 color) {
  vec2 scaledCoord = floor(uv * resolution / pixelSize);
  float threshold = bayerThreshold(scaledCoord);
  float stepSize = 1.0 / (colorNum - 1.0);
  color += threshold * stepSize;
  color = clamp(color - 0.16, 0.0, 1.0);
  return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 centeredUv = uv - 0.5;
  centeredUv.x *= resolution.x / resolution.y;

  float f = pattern(centeredUv);

  if (enableMouseInteraction == 1) {
    vec2 mouseNdc = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
    mouseNdc.x *= resolution.x / resolution.y;
    float dist = length(centeredUv - mouseNdc);
    float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
    f -= 0.5 * effect;
  }

  vec3 color = mix(vec3(0.0), waveColor, f);
  gl_FragColor = vec4(dither(uv, color), 1.0);
}
`

type WaveUniforms = {
  time: THREE.Uniform<number>
  resolution: THREE.Uniform<THREE.Vector2>
  waveSpeed: THREE.Uniform<number>
  waveFrequency: THREE.Uniform<number>
  waveAmplitude: THREE.Uniform<number>
  waveColor: THREE.Uniform<THREE.Color>
  colorNum: THREE.Uniform<number>
  pixelSize: THREE.Uniform<number>
  mousePos: THREE.Uniform<THREE.Vector2>
  enableMouseInteraction: THREE.Uniform<number>
  mouseRadius: THREE.Uniform<number>
}

type DitheredWavesProps = Required<DitherProps>

function DitheredWaves({
  waveSpeed,
  waveFrequency,
  waveAmplitude,
  waveColor,
  colorNum,
  pixelSize,
  disableAnimation,
  enableMouseInteraction,
  mouseRadius,
}: DitheredWavesProps) {
  const mouseRef = useRef(new THREE.Vector2())
  const { viewport, size, gl } = useThree()

  const waveUniformsRef = useRef<WaveUniforms>({
    time: new THREE.Uniform(0),
    resolution: new THREE.Uniform(new THREE.Vector2(0, 0)),
    waveSpeed: new THREE.Uniform(waveSpeed),
    waveFrequency: new THREE.Uniform(waveFrequency),
    waveAmplitude: new THREE.Uniform(waveAmplitude),
    waveColor: new THREE.Uniform(new THREE.Color(...waveColor)),
    colorNum: new THREE.Uniform(colorNum),
    pixelSize: new THREE.Uniform(pixelSize),
    mousePos: new THREE.Uniform(new THREE.Vector2(0, 0)),
    enableMouseInteraction: new THREE.Uniform(enableMouseInteraction ? 1 : 0),
    mouseRadius: new THREE.Uniform(mouseRadius),
  })

  const previousColor = useRef([...waveColor])

  useEffect(() => {
    const dpr = gl.getPixelRatio()
    const nextWidth = Math.floor(size.width * dpr)
    const nextHeight = Math.floor(size.height * dpr)
    const currentResolution = waveUniformsRef.current.resolution.value

    if (currentResolution.x !== nextWidth || currentResolution.y !== nextHeight) {
      currentResolution.set(nextWidth, nextHeight)
    }
  }, [gl, size])

  useFrame(({ clock }) => {
    const uniforms = waveUniformsRef.current

    if (!disableAnimation) {
      uniforms.time.value = clock.getElapsedTime()
    }

    uniforms.waveSpeed.value = waveSpeed
    uniforms.waveFrequency.value = waveFrequency
    uniforms.waveAmplitude.value = waveAmplitude
    uniforms.colorNum.value = colorNum
    uniforms.pixelSize.value = pixelSize
    uniforms.enableMouseInteraction.value = enableMouseInteraction ? 1 : 0
    uniforms.mouseRadius.value = mouseRadius

    if (!previousColor.current.every((value, index) => value === waveColor[index])) {
      uniforms.waveColor.value.setRGB(...waveColor)
      previousColor.current = [...waveColor]
    }

    if (enableMouseInteraction) {
      uniforms.mousePos.value.copy(mouseRef.current)
    }
  })

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!enableMouseInteraction) {
      return
    }

    const rect = gl.domElement.getBoundingClientRect()
    const dpr = gl.getPixelRatio()
    mouseRef.current.set((event.clientX - rect.left) * dpr, (event.clientY - rect.top) * dpr)
  }

  return (
    <>
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={waveVertexShader}
          fragmentShader={ditherWaveFragmentShader}
          uniforms={waveUniformsRef.current}
        />
      </mesh>
      <mesh
        onPointerMove={handlePointerMove}
        position={[0, 0, 0.01]}
        scale={[viewport.width, viewport.height, 1]}
        visible={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  )
}

export interface DitherProps {
  waveSpeed?: number
  waveFrequency?: number
  waveAmplitude?: number
  waveColor?: [number, number, number]
  colorNum?: number
  pixelSize?: number
  disableAnimation?: boolean
  enableMouseInteraction?: boolean
  mouseRadius?: number
}

export function Dither({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.5, 0.5, 0.5],
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 1,
}: DitherProps) {
  return (
    <Canvas
      className="dither-container"
      camera={{ position: [0, 0, 6] }}
      dpr={1}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <DitheredWaves
        waveSpeed={waveSpeed}
        waveFrequency={waveFrequency}
        waveAmplitude={waveAmplitude}
        waveColor={waveColor}
        colorNum={colorNum}
        pixelSize={pixelSize}
        disableAnimation={disableAnimation}
        enableMouseInteraction={enableMouseInteraction}
        mouseRadius={mouseRadius}
      />
    </Canvas>
  )
}
