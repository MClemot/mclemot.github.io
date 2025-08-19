uniform float ox;
uniform float oy;
uniform float ra;
uniform int it;
uniform int mode;
uniform float hue;

vec2 add(vec2 a, vec2 b) {
    return vec2(a.xy+b.xy);
}

vec2 sub(vec2 a, vec2 b) {
    return vec2(a.xy-b.xy);
}

vec2 mul(vec2 a, vec2 b) {
    return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
}

vec2 inv(vec2 z) {
    return vec2(z.x, -z.y) / dot(z.xy,z.xy);
}

vec2 div(vec2 a, vec2 b) {
    return mul(a, inv(b));
}

float sql(vec2 a) {
    return dot(a.xy,a.xy);
}