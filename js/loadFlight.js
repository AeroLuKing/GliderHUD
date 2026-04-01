// Function to load the 3D Glider Model
function loadGlider(callback) {
    fetch("models/ask21.json")
        .then(r => r.json())
        .then(data => {
            const verts = [];
            data.vertices.forEach(v => verts.push(v[0], v[1], v[2]));
            const indices = [];
            data.faces.forEach(f => {
                indices.push(f[0] - 1, f[1] - 1, f[2] - 1);
            });

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
            geom.setIndex(indices);
            geom.computeVertexNormals();

            const mat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 1.0,
                metalness: 0.0
            });

            glider = new THREE.Mesh(geom, mat);
            scene.add(glider);
            callback();
        });
}

// NEW: Function to handle the Flight Data Upload
function loadFlightJSON(files) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            window.flightData = JSON.parse(e.target.result);
            const slider = document.getElementById('slider');
            slider.max = window.flightData.length - 1;
            console.log("Flight Data Loaded:", window.flightData.length, "rows");
            // Initial update
            if (typeof updateHUD === 'function') updateHUD(0);
        } catch (err) {
            console.error("JSON Error:", err);
            alert("Error loading flight data. Please check the JSON format.");
        }
    };
    reader.readAsText(file);
}
