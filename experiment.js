import * as THREE from 'three';
import {WebGPURenderer} from 'three/webgpu';

/*
* 2.5D Parallax Shader - Shadertoy style
* Uses normal map as height map for parallax occlusion mapping
* */

// 1. Create a scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// 2. Create the camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000);
camera.position.z = 2;

// 3. Create the renderer
const renderer = new WebGPURenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 4. Load texture
const textureLoader = new THREE.TextureLoader();
const kiyukNormal = textureLoader.load(
    'res/tex/normal.png',
    (texture) => {
        console.log('Kiyuk Normal loaded');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => { 
        console.error('Error loading kiyuk normal', error); 
    }
);

// 5. Create custom shader material for 2.5D effect
const planeGeometry = new THREE.PlaneGeometry(2, 2, 100, 100);

// Custom shader for parallax occlusion mapping
const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        heightMap: { value: kiyukNormal },
        time: { value: 0 },
        heightScale: { value: 0.1 }, // Adjust this for depth effect
        lightPos: { value: new THREE.Vector3(1, 1, 1) },
        baseColor: { value: new THREE.Color(0x8888ff) },
        steps: { value: 32 }, // More steps = better quality but slower
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vViewPosition;
        varying vec3 vNormal;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            
            // Calculate tangent space for parallax mapping
            vec3 tangent = vec3(1.0, 0.0, 0.0);
            vTangent = normalize(normalMatrix * tangent);
            vBitangent = cross(vNormal, vTangent);
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform sampler2D heightMap;
        uniform float time;
        uniform float heightScale;
        uniform vec3 lightPos;
        uniform vec3 baseColor;
        uniform float steps;
        
        varying vec2 vUv;
        varying vec3 vViewPosition;
        varying vec3 vNormal;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        
        // Parallax Occlusion Mapping
        vec2 parallaxMapping(vec2 uv, vec3 viewDir) {
            // Number of depth layers
            float numLayers = steps;
            float layerDepth = 1.0 / numLayers;
            float currentLayerDepth = 0.0;
            
            // Calculate how much to shift per layer
            vec2 P = viewDir.xy * heightScale;
            vec2 deltaTexCoords = P / numLayers;
            
            vec2 currentTexCoords = uv;
            float currentDepthMapValue = texture2D(heightMap, currentTexCoords).r;
            
            // Steep parallax mapping
            while(currentLayerDepth < currentDepthMapValue) {
                currentTexCoords -= deltaTexCoords;
                currentDepthMapValue = texture2D(heightMap, currentTexCoords).r;
                currentLayerDepth += layerDepth;
            }
            
            // Parallax occlusion mapping (interpolation)
            vec2 prevTexCoords = currentTexCoords + deltaTexCoords;
            float afterDepth = currentDepthMapValue - currentLayerDepth;
            float beforeDepth = texture2D(heightMap, prevTexCoords).r - currentLayerDepth + layerDepth;
            float weight = afterDepth / (afterDepth - beforeDepth);
            vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);
            
            return finalTexCoords;
        }
        
        void main() {
            // Transform view direction to tangent space
            mat3 TBN = mat3(vTangent, vBitangent, vNormal);
            vec3 viewDir = normalize(vViewPosition);
            vec3 tangentViewDir = normalize(transpose(TBN) * viewDir);
            
            // Apply parallax mapping
            vec2 uv = parallaxMapping(vUv, tangentViewDir);
            
            // Discard fragments outside texture bounds
            if(uv.x > 1.0 || uv.y > 1.0 || uv.x < 0.0 || uv.y < 0.0)
                discard;
            
            // Sample the height map
            vec4 texColor = texture2D(heightMap, uv);
            
            // Calculate normal from height map for lighting
            float texelSize = 1.0 / 512.0; // Adjust based on your texture size
            float heightL = texture2D(heightMap, uv + vec2(-texelSize, 0.0)).r;
            float heightR = texture2D(heightMap, uv + vec2(texelSize, 0.0)).r;
            float heightD = texture2D(heightMap, uv + vec2(0.0, -texelSize)).r;
            float heightU = texture2D(heightMap, uv + vec2(0.0, texelSize)).r;
            
            vec3 normal;
            normal.x = heightL - heightR;
            normal.y = heightD - heightU;
            normal.z = 0.02; // Adjust for normal strength
            normal = normalize(normal);
            
            // Transform normal to world space
            normal = normalize(TBN * normal);
            
            // Simple lighting
            vec3 lightDir = normalize(lightPos);
            float diff = max(dot(normal, lightDir), 0.0);
            
            // Ambient + diffuse
            vec3 ambient = baseColor * 0.3;
            vec3 diffuse = baseColor * texColor.rgb * diff * 0.7;
            
            // Add some rim lighting for depth
            float rim = 1.0 - max(dot(viewDir, normal), 0.0);
            rim = pow(rim, 3.0) * 0.3;
            
            vec3 finalColor = ambient + diffuse + vec3(rim);
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
    side: THREE.DoubleSide
});

const plane = new THREE.Mesh(planeGeometry, shaderMaterial);
plane.position.set(0, 0, 0);
scene.add(plane);

// 6. Mouse interaction for dynamic viewing
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// 7. Animation Loop
async function init() {
    await renderer.init();
    
    function animate() {
        shaderMaterial.uniforms.time.value += 0.01;
        
        // Rotate based on mouse position for interactive parallax
        plane.rotation.x = mouse.y * 0.3;
        plane.rotation.y = mouse.x * 0.3;
        
        // Update light position to follow camera perspective
        const lightX = Math.sin(Date.now() * 0.001) * 2;
        const lightY = Math.cos(Date.now() * 0.001) * 2;
        shaderMaterial.uniforms.lightPos.value.set(lightX, lightY, 1);
        
        renderer.render(scene, camera);
    }
    
    await renderer.setAnimationLoop(animate);
}

init().then(() => {
    console.log('2.5D Renderer initialized.');
});

// 8. Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 9. Keyboard controls to adjust effect
window.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowUp':
            shaderMaterial.uniforms.heightScale.value += 0.01;
            console.log('Height scale:', shaderMaterial.uniforms.heightScale.value);
            break;
        case 'ArrowDown':
            shaderMaterial.uniforms.heightScale.value = Math.max(0, shaderMaterial.uniforms.heightScale.value - 0.01);
            console.log('Height scale:', shaderMaterial.uniforms.heightScale.value);
            break;
        case '+':
            shaderMaterial.uniforms.steps.value = Math.min(64, shaderMaterial.uniforms.steps.value + 4);
            console.log('Steps:', shaderMaterial.uniforms.steps.value);
            break;
        case '-':
            shaderMaterial.uniforms.steps.value = Math.max(8, shaderMaterial.uniforms.steps.value - 4);
            console.log('Steps:', shaderMaterial.uniforms.steps.value);
            break;
    }
});

console.log('Controls: Arrow Up/Down = height depth, +/- = quality steps');
