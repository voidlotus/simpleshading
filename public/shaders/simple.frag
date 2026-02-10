`
/*
This code creates basic rendering with diffuse shading and specular hightlight from a normal map.
This is the data:
iChannel0: Normal Map
iChannel1: Dark Texture
iChannel2: Light Texture
iChannel3: Background
*/


const float pi=3.1416;

const int KEY_LEFT  = 37;
const int KEY_UP    = 38;
const int KEY_RIGHT = 39;
const int KEY_DOWN  = 40;




float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

float smooth_step( float min, float max, float x )
{
    float t =(x - min) / (max - min);
    t = clamp(t, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t); // smoothstep formula
    return t;
}

float step2( float min, float max, float x )
{
    float t =(x - min) / (max - min);
    t = clamp(t, 0.0, 1.0);
    return t;
}

void main() {

    vec2 uv = fragCoord/iResolution.xy; //Normalized pixel coordinates

    vec4 col = vec4(0.0);
    vec4 boun= vec4(1.0,1.0,1.0, 1.0);
    vec4 spec= vec4(1.0,1.0,0.0, 1.0);
    vec4 ambi= vec4(0.10,0.20,0.90, 1.0);
    vec4 diff= vec4(0.90,0.50,0.20, 1.0);
    vec4 img0 = texture(iChannel0, uv);
    ambi = texture(iChannel1, uv);
    diff = texture(iChannel2, uv);
    ambi = texture(iChannel1, uv);
    diff = texture(iChannel2, uv);
    vec4 bg_col = texture(iChannel3, uv);
    vec4 light_col= vec4(1.0,0.8,0.2,1.0);
    float Ks=1.0-ambi.a;

    vec3 eye=vec3(0.0,0.0,10.0);
    vec3 normals;
    vec3 reflect;
    vec3 lightpos = vec3(iMouse.x,iMouse.y,50.0);
    //vec3 dir=lightpos/length(lightpos);
    vec3 dir = lightpos-vec3(fragCoord,0.0);
    dir=dir/length(dir);
    eye = eye-vec3(fragCoord,0.0);
    eye = eye/length(eye);


    normals= 2.0*img0.rgb - vec3(1.0);
    normals = normals/length(normals);
    reflect = 2.0*dot(dir,normals)*normals-dir;
    float t= 0.5*dot(dir,normals)+0.5;
    float s= 0.5*dot(reflect,eye)+0.5;
    float b= abs(dot(normals,eye));
    //float t= clamp(dot(dir,normals),0.0,1.0);
    //float t= dot(dir,normals);


    t=step2(0.1,0.99,t);
    t=t/0.99;
    s=pow(s,10.00);
    //s=step2(0.999,1.0,s);
    //b=step2(0.1,0.99,b);
    //t=smooth_step(0.1,0.9,t);
    b=pow(b,5.00);
    //t=0.5*sin(2.0*pi*t/0.50)+0.5;

    vec4 T=t*light_col;


    col = ambi*(1.0-T)+diff*T;
    col = col*(1.0-s*Ks) + spec*s*Ks;
    col = (1.0-img0.a)*bg_col+img0.a*vec4(1.0)*col;
    //col = col*(1.0-b) + boun*b;
    //col= vec4(vec3(t),1.0);

    fragColor = vec4(col);    // Output to screen
}
`