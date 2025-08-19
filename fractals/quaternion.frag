uniform float camx;
uniform float camy;
uniform float r;
uniform float phi;
uniform float th;
uniform vec4 c;
uniform vec3 light;
uniform int shadows;

/*const float k   = .8;
const float eps = .002;*/
const float d = .000001;
//const float d = .0001;
const float l = 100.;

uniform float k;
uniform float eps;

uniform vec3 gra;
uniform vec3 grb;
const vec3 amb = vec3(.6,.8,1.);

const float f=2.;
//const vec3 light = vec3(100.,100.,100.);

vec3 er   = vec3(sin(th)*cos(phi), sin(th)*sin(phi), cos(th));
vec3 eth  = vec3(cos(th)*cos(phi), cos(th)*sin(phi), -sin(th));
vec3 ephi = vec3(-sin(phi), cos(phi), 0.);

vec3 focus = (r+f)*er;

/*vec4 mul(vec4 q1, vec4 q2) {
    return vec4(q1.x*q2.x - q1.y*q2.y - q1.z*q2.z - q1.w*q2.w,
                q1.x*q2.y + q1.y*q2.x + q1.z*q2.w - q1.w*q2.z,
                q1.x*q2.z + q1.z*q2.x - q1.y*q2.w + q1.w*q2.y,
                q1.x*q2.w + q1.w*q2.x + q1.y*q2.z - q1.z*q2.y);
}*/

vec4 mul(vec4 q1, vec4 q2) {
    return vec4(q1.x*q2.x - dot(q1.yzw, q2.yzw), q1.x*q2.yzw + q2.x*q1.yzw + cross(q1.yzw, q2.yzw));
}

/*vec4 sqr(vec4 q) {
    return vec4(q.x*q.x - q.y*q.y - q.z*q.z - q.w*q.w, 2.*q.x*q.yzw);
}*/

vec4 sqr(vec4 q) {
    return vec4(q.x*q.x - dot(q.yzw,q.yzw), 2.*q.x*q.yzw);
}

float estimator(vec3 pos) {
    vec4 z = vec4(pos, 0.);
    vec4 dz = vec4(1., 0., 0., 0.);
    /*while(length(z) < 10.) {
        dz = 2.*mul(z,dz);
        z = sqr(z) + c;
    }*/
    for(int j=0; j<10000; ++j) {
        if(dot(z,z) >= 100.)
            break;
        dz = 2.*mul(z,dz);
        z = sqr(z) + c;
    }

    return .5*length(z)*log(length(z))/length(dz);
}

vec3 normal_estimator_hack(vec3 pos) {
    vec4 q = vec4(pos, 0.);
    vec4 qx1 = q - vec4(d, 0, 0, 0);
    vec4 qx2 = q + vec4(d, 0, 0, 0);
    vec4 qy1 = q - vec4(0, d, 0, 0);
    vec4 qy2 = q + vec4(0, d, 0, 0);
    vec4 qz1 = q - vec4(0, 0, d, 0);
    vec4 qz2 = q + vec4(0, 0, d, 0);
    for(int i=0; i<25; i++) {
        if(dot(qx1,qx1)>l||dot(qx2,qx2)>l||dot(qy1,qy1)>l||dot(qy2,qy2)>l||dot(qz1,qz1)>l||dot(qz2,qz2)>l)
            break;
        qx1 = sqr(qx1)+c;
        qx2 = sqr(qx2)+c;
        qy1 = sqr(qy1)+c;
        qy2 = sqr(qy2)+c;
        qz1 = sqr(qz1)+c;
        qz2 = sqr(qz2)+c;
    }
    vec3 N = vec3(length(qx2)-length(qx1), length(qy2)-length(qy1), length(qz2)-length(qz1));
    //vec3 N = vec3(-length(qx1), -length(qy1), -length(qz1));
    return normalize(N);
}

vec3 normal_estimator_gradient(vec3 pos) {
    vec3 N = vec3(estimator(pos + vec3(d, 0., 0.)) - estimator(pos - vec3(d, 0., 0.)),
                  estimator(pos + vec3(0., d, 0.)) - estimator(pos - vec3(0., d, 0.)),
                  estimator(pos + vec3(0., 0., d)) - estimator(pos - vec3(0., 0., d)));
    return normalize(N);
}

void main(void)
{
    vec3 proj  = r*er + (2.*float(gl_FragCoord.x)-camx)/camx*ephi + (2.*float(gl_FragCoord.y)-camy)/camx*eth;
    vec3 ray = proj - focus;
    ray = normalize(ray);

    vec3 p = focus;
    float d = 2.*eps;
    float prev_d = d;

    /*while(d >= eps && length(p) <= r+f+.1) {
        d = estimator(p);
        p += k*d*ray;
    }*/

    for(int j=0; j<10000; ++j) {
        if(d < eps || length(p) > r+f+.1)
            break;
        prev_d = d;
        d = estimator(p);
        p += k*d*ray;
    }

    if(d < eps) {
        if(shadows==1) {
            vec3 shadow_ray = normalize(light - p);
            vec3 shadow_p = p - k*(d+prev_d)*ray;
            d = 2.*eps;
            for(int j=0; j<10000; ++j) {
                if(d < eps || length(shadow_p) > r+f+.1)
                    break;
                d = estimator(shadow_p);
                shadow_p += k*d*shadow_ray;
            }
            if(d < eps) {
                gl_FragColor = vec4(0.,0.,0.,1.);
            }
            else {
                vec3 normal = normal_estimator_hack(p);
                float i = dot(normal, normalize(light));

                gl_FragColor = vec4(.2*amb+.8*i*gra, 1.);
            }
        }
        else{
            vec3 normal = normal_estimator_hack(p);
            float i = dot(normal, normalize(light));

            gl_FragColor = vec4(.2*amb+.8*i*gra, 1.);
        }
    }
    else
        gl_FragColor = vec4(grb, 1.);
    //gl_FragColor = vec4(0.,1.,0.,1.);
}