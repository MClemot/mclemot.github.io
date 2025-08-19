uniform float camx;
uniform float camy;
uniform float r;
uniform float phi;
uniform float th;
uniform float qq;
uniform float k;
uniform float eps;
uniform vec3 gra;
uniform vec3 grb;
const vec3 amb = vec3(.6,.8,1.);

const float f=2.;
const vec3 light = vec3(1.,1.,1.);

const float d = .000001;

vec3 er   = vec3(sin(th)*cos(phi), sin(th)*sin(phi), cos(th));
vec3 eth  = vec3(cos(th)*cos(phi), cos(th)*sin(phi), -sin(th));
vec3 ephi = vec3(-sin(phi), cos(phi), 0.);

vec3 focus = (r+f)*er;

float estimator(vec3 pos) {
    vec3 q = pos;
    float dr = 1.;
    float r = 0.;
    for(int i=0; i<20; ++i) {
        r = length(q);
        if(r > 20.)
            break;
        float theta = acos(q.z/r);
        float phi = atan(q.y,q.x);
        dr = qq*pow(r,qq-1.)*dr + 1.0;
        float qr = pow(r,qq);
        theta = theta*qq;
        phi = phi*qq;
        q = qr*vec3(sin(theta)*cos(phi),
                    sin(phi)*sin(theta),
                    cos(theta));
        q = q+pos;
    }
    return .5*log(r)*r/dr;
}

vec3 normal_estimator(vec3 pos) {
    vec3 px2 = pos + vec3(d, 0, 0);
    vec3 py2 = pos + vec3(0, d, 0);
    vec3 pz2 = pos + vec3(0, 0, d);

    float e = estimator(pos);
    vec3 N = vec3(estimator(px2)-e, estimator(py2)-e, estimator(pz2)-e);
    return normalize(N);
}

void main(void)
{
    vec3 proj  = r*er + (2.*float(gl_FragCoord.x)-camx)/camx*ephi + (2.*float(gl_FragCoord.y)-camy)/camx*eth;
    vec3 ray = proj - focus;
    ray = normalize(ray);

    vec3 p = focus;
    float d = 2.*eps;

    /*while(d >= eps && length(p) <= r+f+.1) {
        d = estimator(p);
        p += k*d*ray;
    }*/

    for(int j=0; j<10000; ++j) {
        if(d < eps || length(p) > r+f+.1)
            break;
        d = estimator(p);
        p += k*d*ray;
    }

    if(d < eps) {
        vec3 normal = normal_estimator(p);
        float i = dot(normal, normalize(light));

        gl_FragColor = vec4(.1*amb+.9*i*gra, 1.);
    }
    else
        gl_FragColor = vec4(grb, 1.);
    //gl_FragColor = vec4(0.,1.,0.,1.);
}