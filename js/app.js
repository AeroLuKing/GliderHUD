let scene, camera, renderer, glider = null;
let flight = null, frame = 0, N = 0, playing = false;

const rad = (a) => a * Math.PI / 180;

function initScene() {
    const container = document.getElementById("canvas-container");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333); 

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 5000);
    camera.position.set(0, -15, 10);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);
}

function loadGlider(callback) {
    fetch("models/ask21.json")
        .then(r => r.json())
        .then(data => {
            const geom = new THREE.Geometry();
            // Flattened vertices/faces support for your specific JSON model format
            data.vertices.forEach(v => geom.vertices.push(new THREE.Vector3(v[0], v[1], v[2])));
            data.faces.forEach(f => geom.faces.push(new THREE.Face3(f[0]-1, f[1]-1, f[2]-1)));
            geom.computeFaceNormals();
            
            const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
            glider = new THREE.Mesh(geom, mat);
            scene.add(glider);
            if (callback) callback();
        }).catch(e => console.error("Model Error:", e));
}

// FIXED: Specifically for MATLAB JSON Export Format
function loadFlightJSON(files) {
    const file = files[0]; 
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawData = JSON.parse(e.target.result);
            // MATLAB exports as one object with arrays. We store that directly.
            flight = rawData; 
            N = flight.time.length;
            document.getElementById("slider").max = N - 1;
            console.log("MATLAB Data Loaded:", N, "frames");
        } catch (err) {
            console.error("JSON Error:", err);
            alert("Check JSON format!");
        }
    };
    reader.readAsText(file);
}

function updateHUD(k) {
    if (!flight || !flight.alt) return;

    // Convert meters to feet if needed (MATLAB says meters)
    const altFt = flight.alt[k] * 3.28084;
    const speedMph = (flight.speed[k] || 0) * 2.23694;

    document.getElementById("hud-alt").textContent = `Altitude: ${altFt.toFixed(0)} ft`;
    document.getElementById("hud-roll").textContent = `Roll: ${flight.roll[k].toFixed(1)}°`;
    document.getElementById("hud-pitch").textContent = `Pitch: ${flight.pitch[k].toFixed(1)}°`;
    document.getElementById("hud-gs").textContent = `GS: ${speedMph.toFixed(1)} mph`;
    document.getElementById("hud-g").textContent = `G-Load: ${flight.gload[k].toFixed(2)} G`;
    
    // Update Attitude Indicator
    document.getElementById("bank-pointer").style.transform = `rotate(${flight.roll[k]}deg)`;
    document.getElementById("ai-wings").style.transform = `translateY(${-(flight.pitch[k] * 2)}px)`;
}

function updateGlider(k) {
    if (!glider || !flight) return;
    // Apply rotations (adjust axes if glider looks sideways)
    glider.rotation.set(rad(flight.pitch[k]), rad(-flight.heading[k]), rad(-flight.roll[k]), 'ZYX');
}

function animate() {
    requestAnimationFrame(animate);
    if (flight && playing) {
        if (frame < N - 1) {
            frame++;
            document.getElementById("slider").value = frame;
            updateHUD(frame);
            updateGlider(frame);
        } else {
            playing = false;
        }
    }
    renderer.render(scene, camera);
}

window.onload = () => {
    initScene();
    loadGlider(() => console.log("Glider Ready"));
    
    document.getElementById("fileInput").onchange = (e) => loadFlightJSON(e.target.files);
    document.getElementById("btnPlay").onclick = () => { if(flight) playing = true; };
    document.getElementById("btnPause").onclick = () => playing = false;
    document.getElementById("slider").oninput = (e) => {
        frame = parseInt(e.target.value);
        updateHUD(frame);
        updateGlider(frame);
    };
    
    animate();
};
