import { Box3, CapsuleGeometry, Color, LatheGeometry, ShaderMaterial, SphereGeometry, Vector2, type BufferGeometry } from 'three'
import { once } from './outsideLayers'

/*
 * The shadowy figure that stands outside a door and looks in (the corner
 * shop's door, the kitchen's swing door). It is meant to be half-seen: a tall
 * dark shape with soft edges and a pale smudge where a face should be. The
 * soft edges come from the shader, which fades each part out where its
 * surface turns away from you, so its outline melts like an out-of-focus
 * photo. A wider, fainter shell round each part blurs it further.
 */

const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -mv.xyz;
    vY = position.y;
    gl_Position = projectionMatrix * mv;
  }
`
const FRAG = /* glsl */ `
  uniform vec3 uTint;
  uniform float uOpacity;
  uniform float uSoft;
  uniform vec2 uFade;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vY;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float a = uOpacity * smoothstep(0.0, uSoft, facing) * smoothstep(uFade.x, uFade.y, vY);
    gl_FragColor = vec4(uTint, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/** `soft`: how far in from the outline it takes to reach full opacity (0..1). `fade`: below this local height it fades away. */
function haze(tint: string, opacity: number, soft: number, fade: [number, number] = [-10, -9]) {
  return new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTint: { value: new Color(tint) },
      uOpacity: { value: opacity },
      uSoft: { value: soft },
      uFade: { value: new Vector2(...fade) },
    },
    transparent: true,
    depthWrite: false,
  })
}

/**
 * It stands outside, beyond the wall, so it mustn't count towards its door's
 * size (or the layout check would say the door pokes through the wall), and
 * clicks go to the door's glass in front of it instead.
 */
function ghost<T extends BufferGeometry>(g: T) {
  g.computeBoundingSphere()
  g.boundingBox = new Box3()
  return g
}

/** Everything is built for a figure 1 m tall, feet at the origin, facing +z, and scaled up. */
function make() {
  // a long robe-like body from the hem up to the neck: narrow shoulders, no waist
  const profile = [
    [0.0, 0.0],
    [0.12, 0.0],
    [0.135, 0.06],
    [0.13, 0.2],
    [0.118, 0.4],
    [0.115, 0.55],
    [0.125, 0.68],
    [0.132, 0.75],
    [0.122, 0.8],
    [0.085, 0.83],
    [0.045, 0.85],
    [0.035, 0.88],
    [0.0, 0.9],
  ].map(([r, y]) => new Vector2(r, y))
  // flatter front to back than side to side, like a person (scaled before it's ghosted: scaling remakes its box)
  const body = ghost(new LatheGeometry(profile, 28).scale(1, 1, 0.62))
  const head = ghost(new SphereGeometry(1, 24, 16))
  const arm = ghost(new CapsuleGeometry(0.03, 0.34, 6, 12))
  return {
    body,
    head,
    arm,
    dark: haze('#07070a', 0.9, 0.85, [0.05, 0.42]),
    blur: haze('#07070a', 0.28, 1.0, [0.1, 0.5]),
    haloBlur: haze('#07070a', 0.12, 1.0, [0.15, 0.55]),
    headDark: haze('#07070a', 0.92, 0.8),
    headBlur: haze('#07070a', 0.25, 1.0),
    headHalo: haze('#07070a', 0.12, 1.0),
    face: haze('#c6bfb3', 0.34, 1.0),
    faceBlur: haze('#b0a99d', 0.1, 1.0),
  }
}

/** Geometry and materials for the figure, made once and shared by every room. */
export const figureParts = once(make)
