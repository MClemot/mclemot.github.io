uniform float ox;
uniform float oy;
uniform float ra;
uniform int it;
uniform vec2 c;
uniform vec3 clr;
uniform vec3 gra;
uniform vec3 grb;
uniform int clrmode;

vec2 sqr(vec2 z) {
    return vec2(z.x*z.x-z.y*z.y, 2.*z.x*z.y);
}

vec2 inv(vec2 z) {
    return vec2(z.x, -z.y) / (z.x*z.x+z.y*z.y);
}

vec2 mul(vec2 a, vec2 b) {
    return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
}

vec2 quo(vec2 a, vec2 b) {
    return mul(a, inv(b));
}

vec2 Cexp(vec2 z) {
    return vec2(exp(z.x)*cos(z.y), exp(z.x)*sin(z.y));
}

float cosh(float x) {
    float tmp = exp(x);
    return (tmp + 1.0 / tmp) / 2.0;
}

float sinh(float x)
{
    float tmp = exp(x);
    return (tmp - 1.0 / tmp) / 2.0;
}

vec2 Ccos(vec2 z) {
    return vec2(cos(z.x)*cosh(z.y), -sin(z.x)*sinh(z.y));
}

vec2 trans(vec2 z, vec2 z0) {
    return sqr(z) + z0;
    //return Ccos(quo(z,z0));
}

void main()
{
    vec2 z0 = vec2(float(gl_FragCoord.x)*ra + ox, float(gl_FragCoord.y)*ra + oy);
    vec2 z = z0;

    int i = 0;
    for(int j=0; j<10000; j++){
        if(j>=it)
            break;
        z = trans(z, c);
        if(length(z) > 2.)
            break;
        i+=1;
    }
    //if(clrmode)
        float c = log(float(i)+1.)/log(float(it)+1.);
    /*else
        float c = float(i)/float(it);*/
    if(i == it)
        gl_FragColor = vec4(clr, 1.);
    else
        gl_FragColor = vec4(c*gra+(1.-c)*grb, 1.);
}