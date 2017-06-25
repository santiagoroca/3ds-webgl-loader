attribute lowp vec3 aVertexPosition;
attribute lowp vec2 aVertexColor;

uniform sampler2D uSampler;
uniform mat4 uPMVMatrix;

varying vec4 vLightWeighting;
varying vec3 vPosition;

void main(void) {
    gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0);
    vLightWeighting = texture2D(uSampler, aVertexColor);
    vPosition = aVertexPosition;
}
