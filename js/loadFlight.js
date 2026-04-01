function loadGlider(callback) {

    fetch("models/ask21.json")
        .then(r => r.json())
        .then(data => {

            // Convert vertices to a flat typed array
            const verts = [];
            data.vertices.forEach(v => verts.push(v[0], v[1], v[2]));

            // Convert faces to flat index list
            const indices = [];
            data.faces.forEach(f => {
                indices.push(f[0] - 1, f[1] - 1, f[2] - 1);
            });

            // Create BufferGeometry
            const geom = new THREE.BufferGeometry();
            geom.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(verts, 3)
            );
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
