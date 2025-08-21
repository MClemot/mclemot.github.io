async function loadShader(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
        } catch (error) {
        console.error("Error while loading shader:", error);
        return null;
    }
}

function setShader(url, uniforms, scene, geometry) {
    loadShader(url).then(shaderSource => {
    if (shaderSource) {
        var material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            fragmentShader: shaderSource
        } );
        var mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );
    }
    });
}

function setSplitShader(url1, text, url2, uniforms, scene, geometry) {
    loadShader(url1).then(shaderSource1 => {
    if (shaderSource1) {
        loadShader(url2).then(shaderSource2 => {
        if (shaderSource2) {
            var material = new THREE.ShaderMaterial( {
                uniforms: uniforms,
                fragmentShader: shaderSource1 + text + shaderSource2
            } );
            var mesh = new THREE.Mesh( geometry, material );
            scene.add( mesh );
        }
        });
    }
    });
}