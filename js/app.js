let scene, camera, renderer, glider = null;
let flight = null, frame = 0, N = 0, playing = false;

const R_EARTH = 6378137;
const rad = (a) => a * Math.PI / 180;

function initScene() {
    const container = document.getElementById("canvas-container");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222); // Dark grey so you can see a black model

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 5000);
    resetCamera();

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);
}

function resetCamera() {
    camera.position.set(0, -15, 10); // Look at the glider from behind/above
    camera.lookAt(0, 0, 0);
}

function loadGlider(callback) {
    fetch("models/ask21.json")
        .then(r => r.json())
        .then(data => {
            const geom = new THREE.Geometry();
            data.vertices.forEach(v => geom.vertices.push(new THREE.Vector3(v[0], v[1], v[2])));
            data.faces.forEach(f => geom.faces.push(new THREE.Face3(f[0]-1, f[1]-1, f[2]-1)));
            geom.computeFaceNormals();
            
            const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
            glider = new THREE.Mesh(geom, mat);
            scene.add(glider);
            if (callback) callback();
        }).catch(e => console.error("Model Error:", e));
}

function loadFlightJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        flight = JSON.parse(e.target.result);
        N = flight.time.length;
        document.getElementById("slider").max = N - 1;
        console.log("Data loaded!");
    };
    reader.readAsText(file);
}

function updateHUD(k) {
    if (!flight) return;
    document.getElementById("hud-alt").textContent = `Altitude: ${flight.alt[k].toFixed(0)} ft`;
    document.getElementById("hud-roll").textContent = `Roll: ${flight.roll[k].toFixed(1)}°`;
    document.getElementById("hud-pitch").textContent = `Pitch: ${flight.pitch[k].toFixed(1)}°`;
    
    // Update Attitude Indicator
    document.getElementById("bank-pointer").style.transform = `rotate(${flight.roll[k]}deg)`;
    document.getElementById("ai-wings").style.transform = `translateY(${-(flight.pitch[k] * 2)}px)`;
}

function updateGlider(k) {
    if (!glider || !flight) return;
    glider.rotation.set(rad(flight.pitch[k]), rad(-flight.heading[k]), rad(-flight.roll[k]), 'ZYX');
}

function animate() {
    requestAnimationFrame(animate);
    if (flight && playing) {
        frame = (frame + 1) % N;
        document.getElementById("slider").value = frame;
        updateHUD(frame);
        updateGlider(frame);
    }
    renderer.render(scene, camera);
}

window.onload = () => {
    initScene();
    loadGlider(() => console.log("Glider Visible"));
    
    document.getElementById("fileInput").onchange = (e) => loadFlightJSON(e.target.files[0]);
    document.getElementById("btnPlay").onclick = () => playing = true;
    document.getElementById("btnPause").onclick = () => playing = false;
    document.getElementById("btnResetCam").onclick = resetCamera;
    
    animate();
};
