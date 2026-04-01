//
// app.js — Web HUD & ASK‑21 3D Simulator
// NO ES6 imports (GitHub Pages compatible)
// Works with Three.js loaded via CDN
//

let scene, camera, renderer;
let glider = null;
let flight = null;
let frame = 0;
let N = 0;
let playing = false;

// Earth radius (meters)
const R_EARTH = 6378137;

// Convert degrees → radians
const rad = (a) => a * Math.PI / 180;

// Convert lat/lon to local N/E coordinates
function latLonToNE(lat0, lon0, lat, lon) {
    let dLat = rad(lat - lat0);
    let dLon = rad(lon - lon0);
    return {
        N: dLat * R_EARTH,
        E: dLon * R_EARTH * Math.cos(rad(lat0))
    };
}

// ---------------------------------------------
// INITIALIZE THREE.JS
// ---------------------------------------------
function initScene() {

    const container = document.getElementById("canvas-container");

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        20000
    );
    camera.position.set(0, -40, 15);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(20, -20, 20);
    scene.add(light);
}

// ---------------------------------------------
// LOAD ASK‑21 3D MODEL
// ---------------------------------------------
function loadGlider(callback) {

    fetch("models/ask21.json")
        .then(r => r.json())
        .then(data => {

            const geom = new THREE.Geometry();

            data.vertices.forEach(v =>
                geom.vertices.push(new THREE.Vector3(v[0], v[1], v[2]))
            );

            data.faces.forEach(f =>
                geom.faces.push(new THREE.Face3(f[0]-1, f[1]-1, f[2]-1))
            );

            geom.computeFaceNormals();

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

// ---------------------------------------------
// LOAD STUDENT FLIGHT DATA
// ---------------------------------------------
function loadFlightData(data) {
    flight = data;
    N = flight.time.length;
    frame = 0;

    document.getElementById("slider").max = N - 1;
}

// ---------------------------------------------
// UPDATE HUD TEXT
// ---------------------------------------------
function updateHUD(k) {

    document.getElementById("hud-alt").textContent =
        `Altitude: ${flight.alt[k].toFixed(0)} ft`;

    document.getElementById("hud-g").textContent =
        `G‑Load: ${flight.gload[k].toFixed(2)}`;

    document.getElementById("hud-gs").textContent =
        `GS: ${(flight.speed[k] * 2.23694).toFixed(1)} mph`;

    document.getElementById("hud-roll").textContent =
        `Roll: ${flight.roll[k].toFixed(1)}°`;

    document.getElementById("hud-pitch").textContent =
        `Pitch: ${flight.pitch[k].toFixed(1)}°`;

    document.getElementById("hud-head").textContent =
        `Heading: ${flight.heading[k].toFixed(1)}°`;

    // Time display (MM:SS.ss)
    const t = flight.time[k];
    const min = Math.floor(t / 60);
    const sec = (t - min * 60).toFixed(2);

    document.getElementById("timeDisplay").textContent =
        `${String(min).padStart(2,'0')}:${String(sec).padStart(5,'0')}`;
}

// ---------------------------------------------
// UPDATE ATTITUDE INDICATOR
// ---------------------------------------------
function updateAI(k) {
    const roll = flight.roll[k];
    const pitch = flight.pitch[k];

    // Yellow roll pointer rotates
    document.getElementById("bank-pointer").style.transform =
        `rotate(${roll}deg)`;

    // Yellow wings shift up/down (pitch)
    document.getElementById("ai-wings").style.transform =
        `translateY(${-(pitch * 2)}px)`;
}

// ---------------------------------------------
// UPDATE GLIDER 3D MODEL
// ---------------------------------------------
function updateGlider(k) {
    if (!glider) return;

    glider.rotation.x = rad(flight.pitch[k]);
    glider.rotation.y = rad(-flight.heading[k]);
    glider.rotation.z = rad(-flight.roll[k]);

    const NE = latLonToNE(
        flight.lat[0], flight.lon[0],
        flight.lat[k], flight.lon[k]
    );

    glider.position.set(
        NE.N / 10,
        NE.E / 10,
        flight.alt[k] / 10
    );
}

// ---------------------------------------------
// MAIN ANIMATION LOOP
// ---------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    if (flight) {
        updateGlider(frame);
        updateHUD(frame);
        updateAI(frame);
    }

    renderer.render(scene, camera);

    if (playing) {
        frame = Math.min(frame + 1, N - 1);
        document.getElementById("slider").value = frame;
    }
}

// ---------------------------------------------
// UI SETUP
// ---------------------------------------------
function setupUI() {

    document.getElementById("slider").oninput = function () {
        frame = parseInt(this.value);
        playing = false;
    };

    document.getElementById("btnPlay").onclick = () => playing = true;

    document.getElementById("btnPause").onclick = () => playing = false;

    // File upload
    document.getElementById("fileInput").addEventListener("change", function(evt) {
        if (evt.target.files.length === 0) return;
        loadFlightJSON(evt.target.files[0], loadFlightData);
    });
}

// ---------------------------------------------
// ENTRY POINT
// ---------------------------------------------
window.onload = function () {
    initScene();
    setupUI();
    loadGlider(() => console.log("ASK‑21 Model Loaded."));
    animate();
};
