void main()
{
    float a = float(gl_FragCoord.x)*ra + ox;
    float b = float(gl_FragCoord.y)*ra + oy;
    float lya = 1.;
    float x = .54678921236478;

    for(int j=0; j<10000; j++){
        if(j>=it/length)
            break;
        /*lya += log(a * abs(1.-2.*x));
        x = a * x * (1.-x);
        lya += log(b * abs(1.-2.*x));
        x = b * x * (1.-x);*/
        vec2 res = step(lya,x,a,b);
        lya = res.x;
        x = res.y;
    }
    lya = lya/float(it);
    if(lya > 0.) {
        float t = min(1.,lya/.5);
        gl_FragColor = vec4(gra*t + grb*(1.-t), 1.);
    }
    /*else if (lya > -1.5) {
        float t = 1.+lya/1.5;
        gl_FragColor = vec4(grb*t + grc*(1.-t), 1.);
    }
    else {
        float t = max(0., 1.+(lya+1.5)/1.5);
        gl_FragColor = vec4(grc*t + vec3(1.,1.,1.)*(1.-t), 1.);
    }*/
    else {
        float t = max(0., 1.+lya/3.);
        t = t*t*t;
        gl_FragColor = vec4(grb*t + grc*(1.-t), 1.);
    }
}