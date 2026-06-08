import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./ReactiveOrb.css";

interface ReactiveOrbProps {
  activity: number;
  isUserSpeaking: boolean;
  isAssistantSpeaking: boolean;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uActivity;
  uniform float uSpeak;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vDisp;

  float ripple(vec3 p, float t) {
    float w1 = sin(p.x * 3.2 + t * 1.4) * sin(p.y * 2.8 - t * 1.1);
    float w2 = sin(p.z * 3.5 + t * 0.9) * cos(p.x * 2.1 + t * 0.7);
    float w3 = cos(p.y * 3.8 - t * 1.3) * sin(p.z * 2.4 + t * 1.6);
    return (w1 + w2 + w3) / 3.0;
  }

  void main() {
    vec3 n = normalize(normalMatrix * normal);
    float t = uTime;
    float energy = 0.08 + uActivity * 0.22 + uSpeak * 0.16;
    float disp = ripple(position, t) * energy;
    vec3 displaced = position + normal * disp;

    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
    vDisp = disp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uActivity;
  uniform float uSpeak;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vDisp;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

    float t = uTime * 0.42;

    // Diagonal silk bands — top-right to bottom-left
    float diag1 = vWorldPos.x * 0.9 - vWorldPos.y * 1.2 + vWorldPos.z * 0.38;
    float diag2 = vWorldPos.x * 0.62 + vWorldPos.y * 0.75 - vWorldPos.z * 0.48;
    float wave1 = sin(diag1 * 2.8 + t + vDisp * 4.5) * 0.5 + 0.5;
    float wave2 = sin(diag2 * 3.5 - t * 0.75) * 0.5 + 0.5;
    float wave3 = cos(vWorldPos.z * 2.2 + t * 0.55) * sin(vWorldPos.x * 1.8 - t * 0.45) * 0.5 + 0.5;
    float blend = wave1 * 0.48 + wave2 * 0.34 + wave3 * 0.18;
    blend = smoothstep(0.26, 0.74, blend);
    blend = pow(blend, 1.22);

    // Reference palette: royal cobalt valleys, electric cyan peaks
    vec3 royalDeep = vec3(0.0, 0.18, 0.55);   // #002E8C
    vec3 cobalt    = vec3(0.0, 0.08, 0.92);   // #0014EB
    vec3 skyBlue   = vec3(0.0, 0.68, 0.94);   // #00AEEF
    vec3 cyanGlow  = vec3(0.0, 0.75, 1.0);    // #00BFFF
    vec3 highlight = vec3(0.78, 0.94, 1.0);   // luminous near-white cyan

    vec3 color = mix(royalDeep, cobalt, smoothstep(0.0, 0.32, blend));
    color = mix(color, skyBlue, smoothstep(0.24, 0.58, blend));
    color = mix(color, cyanGlow, smoothstep(0.5, 0.8, blend));
    color = mix(color, highlight, smoothstep(0.74, 0.98, blend));

    float inner = pow(max(dot(viewDir, vNormal), 0.0), 1.65);
    color += highlight * inner * (0.12 + uActivity * 0.04 + uSpeak * 0.03);

    vec3 rim = mix(cyanGlow, highlight, fresnel * 0.95 + 0.05);
    color = mix(color, rim, fresnel * 0.42);
    color += fresnel * cyanGlow * (0.22 + uActivity * 0.09 + uSpeak * 0.07);

    float energy = 0.96 + uActivity * 0.02 + uSpeak * 0.015;
    color *= energy;

    float alpha = smoothstep(0.96, 0.32, fresnel) * 0.94;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function ReactiveOrb({
  activity,
  isUserSpeaking,
  isAssistantSpeaking,
}: ReactiveOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef(activity);
  const userRef = useRef(isUserSpeaking);
  const assistantRef = useRef(isAssistantSpeaking);

  activityRef.current = activity;
  userRef.current = isUserSpeaking;
  assistantRef.current = isAssistantSpeaking;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const ORB_BASE_SIZE = 380;
    let viewportScale = 1;
    let disposed = false;
    let raf = 0;
    let observer: ResizeObserver | null = null;
    let scene: THREE.Scene | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let geometry: THREE.IcosahedronGeometry | null = null;
    let material: THREE.ShaderMaterial | null = null;

    const updateViewportScale = () => {
      const size = Math.min(mount.clientWidth, mount.clientHeight);
      viewportScale = Math.max(size, 1) / ORB_BASE_SIZE;
    };

    const getDpr = () => Math.min(window.devicePixelRatio || 1, 3);

    const getSize = () => ({
      width: Math.round(Math.max(mount.clientWidth, 1)),
      height: Math.round(Math.max(mount.clientHeight, 1)),
    });

    const teardown = () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };

    let camera: THREE.PerspectiveCamera | null = null;

    const applyRendererSize = () => {
      if (!renderer || !camera) return;
      if (mount.clientWidth < 2 || mount.clientHeight < 2) return;
      const { width: w, height: h } = getSize();
      renderer.setPixelRatio(getDpr());
      renderer.setSize(w, h, false);
      updateViewportScale();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const onResize = () => {
      applyRendererSize();
    };

    const setup = () => {
      if (disposed || renderer) return;
      if (mount.clientWidth < 2 || mount.clientHeight < 2) return;

      const { width, height } = getSize();
      updateViewportScale();

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.z = 4.4;

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(getDpr());
      renderer.setSize(width, height, false);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      geometry = new THREE.IcosahedronGeometry(0.82, 64);
      const uniforms = {
        uTime: { value: 0 },
        uActivity: { value: 0 },
        uSpeak: { value: 0 },
      };

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
      });

      const orb = new THREE.Mesh(geometry, material);
      scene.add(orb);

      const keyLight = new THREE.DirectionalLight(0xb8ecff, 1.4);
      keyLight.position.set(2, 2, 4);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x00bfff, 1.2);
      rimLight.position.set(-3, -1, 2);
      scene.add(rimLight);

      const fillLight = new THREE.DirectionalLight(0x0047ab, 0.6);
      fillLight.position.set(0, -2, 3);
      scene.add(fillLight);

      const ambient = new THREE.AmbientLight(0x66ccff, 0.45);
      scene.add(ambient);

      const clock = new THREE.Clock();
      let smoothActivity = 0;
      let smoothSpeak = 0;

      const animate = () => {
        if (disposed || !renderer || !scene) return;
        const elapsed = clock.getElapsedTime();
      const targetActivity = activityRef.current;
      const targetSpeak = assistantRef.current
        ? 0.65 + Math.sin(elapsed * 9) * 0.25
        : userRef.current
          ? targetActivity
          : 0.08 + Math.sin(elapsed * 1.2) * 0.04;

      smoothActivity += (targetActivity - smoothActivity) * 0.06;
      smoothSpeak += (targetSpeak - smoothSpeak) * 0.08;

      uniforms.uTime.value = elapsed;
      uniforms.uActivity.value = smoothActivity;
      uniforms.uSpeak.value = assistantRef.current ? smoothSpeak : 0;

      const wobble = smoothActivity * 0.2 + smoothSpeak * 0.12;
      orb.rotation.x = Math.sin(elapsed * 0.35) * 0.08 * wobble;
      orb.rotation.y = elapsed * (0.18 + smoothActivity * 0.12);
      orb.rotation.z = Math.cos(elapsed * 0.28) * 0.05 * wobble;

      const pulse = 1 + smoothActivity * 0.035 + smoothSpeak * 0.025;
      orb.scale.setScalar(viewportScale * pulse);

      const driftX = Math.sin(elapsed * 0.55) * 0.03 * wobble;
      const driftY = Math.cos(elapsed * 0.42) * 0.025 * wobble;
      orb.position.set(driftX, driftY, 0);

        if (camera) renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };

      animate();
    };

    observer = new ResizeObserver(() => {
      if (!renderer) setup();
      else onResize();
    });
    observer.observe(mount);
    setup();

    return teardown;
  }, []);

  return (
    <div className="reactive-orb-wrap">
      <div ref={mountRef} className="reactive-orb" aria-hidden />
    </div>
  );
}
