export enum SCENE {
    ENTIRE_SCENE,
    BLOOM_SCENE
  };

export const vshader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`.trim();

export const fshader = `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
varying vec2 vUv;
vec4 getTexture(sampler2D texelToLinearTexture) {
    return mapTexelToLinear(texture2D(texelToLinearTexture, vUv));
}
void main() {
    gl_FragColor = getTexture(baseTexture) + vec4(1.0) * getTexture(bloomTexture);
}
`.trim();