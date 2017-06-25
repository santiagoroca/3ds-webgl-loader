#extension GL_OES_standard_derivatives : enable\n
precision highp float;

uniform vec3 cameraPosition;

varying vec4 vLightWeighting;
varying vec3 vPosition;
varying vec3 vLightPos;

vec3 normals(vec3 pos) {
  vec3 fdx = dFdx(pos);
  vec3 fdy = dFdy(pos);
  return normalize(cross(fdx, fdy));
}

void main() {

    vec3 normal = normals(vPosition);

    float d = length(cameraPosition - vPosition);

    float att = max(0.6, 1.0 - d*d/4.0);

    float lightA = max(0.0, dot(normal, vec3(0.7, -0.7, 1.0)));
    float lightB = max(0.0, dot(normal, vec3(0.5, 0.3, -0.1)));

    gl_FragColor = vec4 (
        att * (
            vLightWeighting.rgb * lightB * 0.5 +
            vLightWeighting.rgb * lightA * 0.2 +
            vLightWeighting.rgb * 0.62
        ),
        vLightWeighting.w
    );
}
