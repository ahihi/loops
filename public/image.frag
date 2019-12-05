precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D image;
uniform float time;

void main() {
  vec3 color = texture2D(image, vTexCoord).rgb;
  gl_FragColor = vec4(color, 1.0);
}
