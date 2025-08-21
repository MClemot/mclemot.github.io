uniform float ox;
uniform float oy;
uniform float ra;
uniform int it;
uniform vec3 clr;
uniform vec3 gra;
uniform vec3 grb;

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

    //optimisation
    float p = (z0.x-.25)*(z0.x-.25)+z0.y*z0.y;
    if(z0.x<sqrt(p)-2.*p+.25)
        gl_FragColor = vec4(clr, 1.);
    else if((z0.x+1.)*(z0.x+1.)+z0.y*z0.y<.0625)
        gl_FragColor = vec4(clr, 1.);
    else {
        int i = 0;
        for(int j=0; j<10000; j++){
            if(j>=it)
                break;
            z = trans(z, z0);
            if(length(z) > 2.)
                break;
            i+=1;
        }
        float c = log(float(i)+1.)/log(float(it)+1.);
        if(i == it)
            gl_FragColor = vec4(clr, 1.);
        else
            gl_FragColor = vec4(c*gra+(1.-c)*grb, 1.);
    }
}