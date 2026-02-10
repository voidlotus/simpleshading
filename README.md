
A brief written description explaining the shader logic, illumination model, and how the normal map is used.

# Project 01: Basic Shader: Diffuse and Specular Effects with Normal Maps
### _Ignatius Alex Wijayanto_
___

## Introduction
The implementation of the shader is pretty straightforward. This project is build on ThreeJS framework.
The component used in this project:
- Normal Map
- Albedo Map
- Specular Map

## How it Works?
1. Set lighting position, view/camera position, and load the required textures
2. To be able to map the textures, function `uv()` is used
3. Function helper to convert normal map value from `[0,1]` to `[-1,1]`. This convert process is important to transform color space value into vector value that represent all possible directions relative to the surface. The conversion formula is `(input x 2) - 1`
4. Generate direction vector for the Light, Viewing, and Reflection.
5. Diffuse: Clamping the dot product between Lighting direction and surface normal within 0 to 1
6. Specular: Clamping the dot product between Reflection and Viewing direction within 0 to 1 and (hard-coded) user-define exponent value to produce the desired result (sharpness of the specular highlight)
7. Ambient: To make the final result softer, ambient color was added to the final color by multiplying albedo with ambientColor. 

## Easiest way without having to compile the file
- You can go to my tamu website and scroll down to the bottom part. [Link To My Website](https://people.tamu.edu/~isax/viza656/pr01/index.html)


## (Hard way) How to Compile the Files
- You have to have ThreeJS ready in your system
- If you are running the system using npm: from the root project folder, go to terminal and run this command `npm run dev` 

