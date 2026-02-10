import * as THREE from 'three';
import {WebGPURenderer} from 'three/webgpu';
//import simpleVert from './public/shaders/simple.vert?raw'; // Import as a string
//import simpleFrag from './public/shaders/simple.frag?raw'; // Import as a string
//import customShader from './public/shaders/simple.js';
import { CustomShaderMaterial } from './public/shaders/simple.js';

/*
* positive axis: x=right, y= top, z= toward the camera
* */

// 1. Create a scene
const scene = new THREE.Scene();
//scene.background.setColor(0x222222);

// 2. Create the camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000);
camera.position.z = 5;

// 3. Create the renderer
//const renderer = new THREE.WebGLRenderer({antialias: true});
const renderer = new WebGPURenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 4. Create a Mesh (Geometry + Material)
const planeGeometry = new THREE.PlaneGeometry(3.5,7);

// texture
const textureLoader = new THREE.TextureLoader();

// load kiyuk texture
const kiyukAlbedo = textureLoader.load(
    'res/tex/albedo.png',
    (kiyukAlbedo) => {
        console.log('Kiyuk albedo loaded');
    },
    (xhr) => {
        console.log( (xhr.loaded / xhr.total * 100) + '%loaded');
    },
    (error) => { console.error( 'Error loading kiyuk albedo',(error) ); }
);

const kiyukNormal = textureLoader.load(
    'res/tex/normal.png',
    (kiyukNormal) => {
        console.log('Kiyuk Normal loaded');
    },
    (xhr) => {
        console.log( (xhr.loaded / xhr.total * 100) + '%loaded');
    },
    (error) => { console.error( 'Error loading kiyuk normal',(error) ); }
);

const kiyukSpecular = textureLoader.load(
    'res/tex/roughness.png',
    (kiyukNormal) => {
        console.log('Kiyuk specular loaded');
    },
    (xhr) => {
        console.log( (xhr.loaded / xhr.total * 100) + '%loaded');
    },
    (error) => { console.error( 'Error loading kiyuk specular',(error) ); }
);



// materials
const material = new THREE.MeshBasicMaterial({ color: new THREE.Color('skyblue') });
const lambert = new THREE.MeshLambertMaterial({ color: new THREE.Color('orange'), emissive: 'lavender', emissiveIntensity: 0.1 });
const phong = new THREE.MeshPhongMaterial({color: 'lavender', specular: 'white', shininess: 30, emissiveIntensity: 'orange'});
const pbr = new THREE.MeshStandardMaterial({color: 'blue', metalness: 0.1, roughness: 0.5, emissive: 0x000000, emissiveIntensity: 0});
/*const pbrTex = new THREE.MeshStandardMaterial({
    map: texture, //base color
    // bumps or dents (height-based)
    displacementMap: textureLoader.load('res/tex/TCom_Gore_1K_height.png'),
    displacementScale: .3,

    // surface detail (normal mapping)
    normalMap: textureLoader.load('res/tex/TCom_Gore_1K_normal.png'),
    normalScale: new THREE.Vector2(1, 1),

    // Roughness variation
    roughnessMap: textureLoader.load('res/tex/TCom_Gore_1K_roughness.png'),

    // Ambient occlusion (shadows in crevices)
    aoMap: textureLoader.load('res/tex/TCom_Gore_1K_ao.png'),
    aoMapIntensity: 1,
});*/

// NOTE: aoMap requires a second UV set
// torusGeometry.setAttribute('uv2', torusGeometry.attributes.uv);


const kiyukMat = new THREE.MeshStandardMaterial({
    map: kiyukAlbedo,
    normalMap: kiyukNormal,
    normalScale: new THREE.Vector2(1, 1),
    roughnessMap: kiyukSpecular,
    emissive: 0x000000,
    emissiveIntensity: 1});

// only works on webgl ( but i always prefer newer version, so in this case I am using WebGPU instead)
// const kiyukCustomMat = new THREE.ShaderMaterial({
//     uniforms: {
//         heightMap: { value: kiyukNormal },
//         time: { value: 0 },
//         heightScale: { value: 0.1 }, // Adjust this for depth effect
//         lightPos: { value: new THREE.Vector3(1, 1, 1) },
//         baseColor: { value: new THREE.Color(0x8888ff) },
//         steps: { value: 32 },}, // More steps = better quality but slower
//     vertexShader: simpleVert,
//     fragmentShader: simpleFrag,
// });

//const kiyukCustomMat = new THREE.MeshBasicMaterial();
//kiyukCustomMat.colorNode = customShader();

const plane = new THREE.Mesh(planeGeometry, kiyukMat);

// const torus = new THREE.Mesh(torusGeometry, pbrTex);
plane.rotation.x = -Math.PI / 2;
plane.rotation.x = 0;
plane.position.set(-2,0,0);
// scene.add(plane);


// LIGHTING

// ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, .22);
scene.add(ambientLight);

// directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;

// point light
// Create point light
const pointLight = new THREE.PointLight(0xffffff, 2, 100);
pointLight.position.set(0, 0, 2);
scene.add(pointLight);

// Add a visible sphere to show where the light is
// const lightSphere = new THREE.Mesh(
//     new THREE.SphereGeometry(0.1, 16, 16),
//     new THREE.MeshBasicMaterial({ color: 0xffff00 })
// );
// pointLight.add(lightSphere);

// shadow quality settings
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = .5;
directionalLight.shadow.camera.far = 50;

// let there be light
//scene.add(directionalLight);

// visualise the light direction (helper)
const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight,5, 'red');
//scene.add(dirLightHelper);

// 5. Animation Loop (UE: Tick function?)
// function animate() {
//     requestAnimationFrame(animate);
//     cube.rotation.x += 0.01;
//     cube.rotation.y += 0.01;
//     renderer.render(scene, camera);
// }
// animate();

// Mouse tracking
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// Store custom shader reference globally so mouse handler can access it
let customShaderInstance = null;
function onMouseMove(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Create a plane at z=0 to project the mouse position onto
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, intersectPoint);

    if (intersectPoint) {
        pointLight.position.x = intersectPoint.x;
        pointLight.position.y = intersectPoint.y;
        pointLight.position.z = 2;

        // FIX: Update custom shader light position with same 3D position
        if (customShaderInstance) {
            customShaderInstance.updateLightPosition(
                intersectPoint.x,
                intersectPoint.y,
                2.0
            );
        }
    }
}

// (faster alternative) 5. using WEBGPU
// Initialize renderer before rendering
async function init(){
    await renderer.init();
    // Start animation loop after init

    // FIX: Create custom shader material AFTER renderer is initialized
    const customShader = new CustomShaderMaterial();
    customShaderInstance = customShader; // Store reference for mouse handler

    // Load textures
    Promise.all([
        textureLoader.loadAsync('res/tex/normal.png'),
        textureLoader.loadAsync('res/tex/albedo.png'),
        textureLoader.loadAsync('res/tex/specular.png')
        //textureLoader.loadAsync('background.jpg')
    ]).then(([normal, albedo, specular]) => {
        customShader.setTextures(normal, albedo, specular);

        const kiyukCustomMat = customShader.createMaterial();
        const myPlane = new THREE.Mesh(planeGeometry, kiyukCustomMat);
        myPlane.rotation.x = -Math.PI / 2;
        myPlane.rotation.x = 0;
        myPlane.position.set(0,0,0);
        scene.add(myPlane);

        console.log('Custom shader plane added to scene');

        // FIX: Update resolution uniform to match window size
        customShader.updateResolution(window.innerWidth, window.innerHeight);

        // FIX: Set up mouse tracking for custom shader
        window.addEventListener('mousemove', (event) => {
            customShader.updateMouse(
                event.clientX / window.innerWidth,
                1.0 - (event.clientY / window.innerHeight)
            );
        });
    }).catch((error) => { console.log("Custom shader setup failed: "), error });

    function animate(){
        // plane.rotation.x += 0.01;
        //plane.rotation.y += 0.01;

        renderer.render(scene, camera);
    }
    await renderer.setAnimationLoop(animate);
}

init().then(r => {
    console.log('Renderer initialized.');

}); // call init to start

// 6. Handle window resize
window.addEventListener('resize', ()=> {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

window.addEventListener('mousemove', onMouseMove);