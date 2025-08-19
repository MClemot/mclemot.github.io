var container;
var camera, scene, renderer;
var uniforms;
var mouseX, mouseY;
var startX, startY, mode, zoomX, zoomY;
var propX, propY;

init();
animate();

var R, PHI, TH, C, uniforms, t;

function spherical(phi,th) {
    phi_r = phi * 3.141593 / 180.;
    th_r = th * 3.141593 / 180.;
    v = new THREE.Vector3(100.*Math.cos(phi_r)*Math.cos(th_r), 100.*Math.cos(phi_r)*Math.sin(th_r), 100.*Math.sin(phi_r));
    return v;
}

function init() {
    t = 0;
    container = document.getElementById( 'container' );

    camera = new THREE.Camera();
    camera.position.z = 1;

    scene = new THREE.Scene();

    var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

    if (window.innerWidth > window.innerHeight) {
        propX = .55;
        propY = .7;
    }
    else {
        propX = .9;
        propY = .6;
    }

    var estimX = propX*window.innerWidth*window.devicePixelRatio;
    var estimY = propY*window.innerHeight*window.devicePixelRatio;

    document.getElementById('check_shadows').checked = true;

    C = new THREE.Vector4(-1.,.2,.0,.0);
    GRA = new THREE.Vector3(1.,1.,1.);
    GRB = new THREE.Vector3(.5,0.,0.);

    LIGHT = spherical(45.,180.);

    uniforms = {
        camx : { type: "f", value: estimX },
        camy : { type: "f", value: estimY },
        r : { type: "f", value: 3. },
        phi : { type: "f", value: 0. },
        th : { type: "f", value: -1. },
        c : { type: "vec4", value: C },
        k : { type: "f", value: .8 },
        eps : { type: "f", value: 0.002 },
        gra : { type: "vec3", value: GRA },
        grb : { type: "vec3", value: GRB },
        light : { type: "vec3", value: LIGHT },
        shadows: { type: "int", value: 1 }
    };

    setShader('fractals/quaternion.frag', uniforms, scene, geometry);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );

    container.appendChild( renderer.domElement );

    onWindowResize();
    window.addEventListener( 'resize', onWindowResize, false );
    container.addEventListener( 'wheel', onWheelMoved );

    function update(e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
    }

    container.onmousemove = update;

    document.onmouseup = function() {
        container.onmousemove = update;
    }

    container.onmousedown = function() {
        container.onmousemove = function(e){

            uniforms.phi.value += .01*(e.pageX-mouseX);
            uniforms.th.value += .01*(e.pageY-mouseY);
            update(e);
        }
    }

    container.addEventListener('touchstart', onTouchStart, false);
    container.addEventListener('touchmove', onTouchMove, false);
    container.addEventListener('touchend', onTouchStart, false);

    document.getElementById('slider_x').oninput = function() {
        C.setX(this.value);
        document.getElementById('label_x').innerHTML = this.value;
    }
    document.getElementById('slider_y').oninput = function() {
        C.setY(this.value);
        document.getElementById('label_y').innerHTML = this.value;
    }
    document.getElementById('slider_z').oninput = function() {
        C.setZ(this.value);
        document.getElementById('label_z').innerHTML = this.value;
    }
    document.getElementById('slider_w').oninput = function() {
        C.setW(this.value);
        document.getElementById('label_w').innerHTML = this.value;
    }
    document.getElementById('slider_phi_l').oninput = function() {
        LIGHT = spherical(this.value, document.getElementById('slider_th_l').value)
        uniforms.light.value = LIGHT;
        document.getElementById('label_phi_l').innerHTML = this.value;
    }
    document.getElementById('slider_th_l').oninput = function() {
        LIGHT = spherical(document.getElementById('slider_phi_l').value, this.value)
        uniforms.light.value = LIGHT;
        document.getElementById('label_th_l').innerHTML = this.value;
    }
    document.getElementById('check_shadows').oninput = function() {
        if(this.checked)
            uniforms.shadows.value = 1;
        else
            uniforms.shadows.value = 0;
    }

    document.getElementById('number_k').oninput = function() { uniforms.k.value = this.value; }
    document.getElementById('number_eps').oninput = function() { uniforms.eps.value = this.value; }

    document.getElementById('color_gra').oninput = function() {
         var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.value);
         GRA = new THREE.Vector3(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255);
         uniforms.gra.value = GRA;
    }
    document.getElementById('color_grb').oninput = function() {
         var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.value);
         GRB = new THREE.Vector3(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255);
         uniforms.grb.value = GRB;
    }
}

function onWheelMoved( event ) {
    if(event.deltaY > 0)
        uniforms.r.value *= 1.1;
    else
        uniforms.r.value /= 1.1;
    event.preventDefault();
    event.stopPropagation();
}

function onTouchStart(e) {
    if(e.touches.length == 1) {
        mode = 1
        var touchobj = e.touches[0];
        startX = parseInt(touchobj.clientX);
        startY = parseInt(touchobj.clientY);
        e.preventDefault();
    }
    else if (e.touches.length == 2) {
        mode = 2
        var touchobj0 = e.touches[0];
        var touchobj1 = e.touches[1];
        var X0 = parseInt(touchobj0.clientX);
        var Y0 = parseInt(touchobj0.clientY);
        var X1 = parseInt(touchobj1.clientX);
        var Y1 = parseInt(touchobj1.clientY);
        startX = Math.sqrt((X0-X1)*(X0-X1)+(Y0-Y1)*(Y0-Y1));
        e.preventDefault();
    }
}

function onTouchMove(e) {
    if(e.touches.length == 1) {
        if(mode == 2)
            onTouchStart(e);
        else {
            var touchobj = e.changedTouches[0];
            uniforms.phi.value += .01*(parseInt(touchobj.clientX) - startX);
            uniforms.th.value += .01*(parseInt(touchobj.clientY) - startY);
            startX = parseInt(touchobj.clientX);
            startY = parseInt(touchobj.clientY);
            uniforms.ox.value = OX;
            uniforms.oy.value = OY;
            e.preventDefault();
        }
    }
    else if (e.touches.length == 2) {
        var touchobj0 = e.touches[0];
        var touchobj1 = e.touches[1];
        var X0 = parseInt(touchobj0.clientX);
        var Y0 = parseInt(touchobj0.clientY);
        var X1 = parseInt(touchobj1.clientX);
        var Y1 = parseInt(touchobj1.clientY);
        var N = Math.sqrt((X0-X1)*(X0-X1)+(Y0-Y1)*(Y0-Y1));
        uniforms.r.value *= startX/N;
        startX = N;
        e.preventDefault();
    }
}

function onWindowResize( event ) {
    renderer.setSize( propX*window.innerWidth, propY*window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

function render() {
    renderer.render( scene, camera );
}