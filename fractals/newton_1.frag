void main()
{
    vec2 z0 = vec2(float(gl_FragCoord.x)*ra + ox, float(gl_FragCoord.y)*ra + oy);
    vec2 z = z0;
    int im;
    for(int i=0; i<1000; ++i) {
        if(i>=it)
            break;
        vec2 z0 = z;

        //newton
        if(mode == 0)
            z = sub(z, mul(P(z), inv(dP(z))));

        //householder
        if(mode == 1) {
            vec2 ev  = P(z);
            vec2 dev = dP(z);
            vec2 h = div(mul(ev,ddP(z)),2.*mul(dev,dev));
            z = sub(z, mul(div(ev,dev),add(vec2(1.,0.),h)));
        }

        //halley
        if(mode == 2) {
            vec2 ev  = P(z);
            vec2 dev = dP(z);
            z = sub(z, div(2.*mul(ev,dev), sub(2.*mul(dev,dev),mul(ev,ddP(z)))));
        }

        if(sql(sub(z,z0))<.001) {
            im = i;
            break;
        }
    }

    float th = mod((((abs(z.y)<=.01&&z.x<0.)?(-3.141):atan(z.y,z.x))+3.141)*360./6.282 + hue, 360.);
    float ti = floor(th/60.);
    float f = th/60.-ti;

    float v = 1.-float(im)/float(it);
    float l = v * .0;
    float m = v * (1.-f);
    float n = v * f;

    if(int(ti)==0)
        gl_FragColor = vec4(v, n, l, 1.);
    else if(int(ti)==1)
        gl_FragColor = vec4(m, v, l, 1.);
    else if(int(ti)==2)
        gl_FragColor = vec4(l, v, n, 1.);
    else if(int(ti)==3)
        gl_FragColor = vec4(l, m, v, 1.);
    else if(int(ti)==4)
        gl_FragColor = vec4(n, l, v, 1.);
    else if(int(ti)==5)
        gl_FragColor = vec4(v, l, m, 1.);
}