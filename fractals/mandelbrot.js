var container;
var camera, scene, renderer;
var uniforms;
var mouseX, mouseY;
var startX, startY, mode, zoomX, zoomY;
var propX, propY;

init();
animate();

var OX, OY, RA, IT, CLR, GRA, GRB;

function init() {
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

    RA = 3./Math.min(estimX, estimY);
    OX = -.5-estimX/2*RA;
    OY = -estimY/2*RA;
    IT = 100;
    CLR = new THREE.Vector3(.0, .0, .2);
    GRA = new THREE.Vector3(.9, .7, .0);
    GRB = new THREE.Vector3(.6, .0, .0);

    uniforms = {
        ox : { type: "f", value: OX },
        oy : { type: "f", value: OY } ,
        ra : { type: "f", value: RA },
        it : { type: "i", value: IT },
        clr : { type: "vec3", value: CLR },
        gra : { type: "vec3", value: GRA },
        grb : { type: "vec3", value: GRB }
    };

    setShader('fractals/mandelbrot.frag', uniforms, scene, geometry);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );

    container.appendChild( renderer.domElement );

    onWindowResize();
    window.addEventListener( 'resize', onWindowResize, false );
    container.addEventListener( 'wheel', onWheelMoved );

    function update(e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }

    container.onmousemove = update;

    document.onmouseup = function() {
        container.onmousemove = update;
    }

    container.onmousedown = function() {
        container.onmousemove = function(e){
            OX -= RA*(e.offsetX-mouseX);
            OY += RA*(e.offsetY-mouseY);
            uniforms.ox.value = OX;
            uniforms.oy.value = OY;
            update(e);
        }
    }

    container.addEventListener('touchstart', onTouchStart, false);
    container.addEventListener('touchmove', onTouchMove, false);
    container.addEventListener('touchend', onTouchStart, false);

    document.getElementById('slider_it').oninput = function() {
        IT = this.value;
        uniforms.it.value = IT;
        document.getElementById('label_it').innerHTML = IT;
    }

    document.getElementById('color_clr').oninput = function() {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.value);
            CLR = new THREE.Vector3(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255);
            uniforms.clr.value = CLR;
    }
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
    var fmouseX = mouseX*RA + OX;
    var fmouseY = (renderer.domElement.height-mouseY)*RA + OY; 
    if(event.deltaY > 0)
        RA *= 1.1;
    else
        RA /= 1.1;
    OX = fmouseX - mouseX*RA;
    OY = fmouseY - (renderer.domElement.height-mouseY)*RA;
    uniforms.ra.value = RA;
    uniforms.ox.value = OX;
    uniforms.oy.value = OY;

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
        var rect = e.target.getBoundingClientRect();
        var X0 = parseInt(touchobj0.clientX) - rect.left;
        var Y0 = parseInt(touchobj0.clientY) - rect.top;
        var X1 = parseInt(touchobj1.clientX) - rect.left;
        var Y1 = parseInt(touchobj1.clientY) - rect.top;
        startX = Math.sqrt((X0-X1)*(X0-X1)+(Y0-Y1)*(Y0-Y1));
        zoomX = RA*((X0+X1)/2*window.devicePixelRatio) + OX;
        zoomY = RA*(renderer.domElement.height-(Y0+Y1)/2*window.devicePixelRatio) + OY;
        e.preventDefault();
    }
}

function onTouchMove(e) {
    if(e.touches.length == 1) {
        if(mode == 2)
            onTouchStart(e);
        else {
            var touchobj = e.changedTouches[0];
            OX -= window.devicePixelRatio*RA*(parseInt(touchobj.clientX) - startX);
            OY += window.devicePixelRatio*RA*(parseInt(touchobj.clientY) - startY);
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
        var rect = e.target.getBoundingClientRect();
        var X0 = parseInt(touchobj0.clientX) - rect.left;
        var Y0 = parseInt(touchobj0.clientY) - rect.top;
        var X1 = parseInt(touchobj1.clientX) - rect.left;
        var Y1 = parseInt(touchobj1.clientY) - rect.top;
        var N = Math.sqrt((X0-X1)*(X0-X1)+(Y0-Y1)*(Y0-Y1));
        /*var posX = renderer.domElement.width/2*RA + OX;
        var posY = renderer.domElement.heigth/2*RA + OY;*/
        RA *= startX/N;
        OX = zoomX - RA*((X0+X1)/2*window.devicePixelRatio);
        OY = zoomY - RA*(renderer.domElement.height-(Y0+Y1)/2*window.devicePixelRatio);
        uniforms.ra.value = RA;
        uniforms.ox.value = OX;
        uniforms.oy.value = OY;
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