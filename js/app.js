//
// app.js — Web HUD & ASK‑21 3D Simulator
// Fixed: Integrated JSON loading to prevent "undefined" errors
//

let scene, camera, renderer;
let glider = null;
let flight = null;
let frame = 0;
let N = 0;
let playing = false;

const R_EARTH = 6378137;
const rad = (a) => a * Math.PI / 180;

function latLonToNE(lat0, lon0, lat, lon) {
    let dLat = rad(lat - lat0);
    let dLon = rad(lon - lon0);
    return {
        N: dLat * R_EARTH,
        E: dLon * R_EARTH * Math.cos(rad(lat0))
    };
}

function initScene() {
    const container = document.getElementById("canvas-container");
    if (!container) return;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 20000);
    camera.position.set(0, -40, 15);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(20, -20, 20);
    scene.add(light);
}

function loadGlider(callback) {
    fetch("models/ask21.json")
        .then(r => r.json())
        .then(data => {
            // Using THREE.Geometry for compatibility with Three.js r121
            const geom = new THREE.Geometry();
            data.vertices.forEach(v => geom.vertices.push(new THREE.Vector3(v[0], v[1], v[2])));
            data.faces.forEach(f => geom.faces.push(new THREE.Face3(f[0]-1, f[1]-1, f[2]-1)));
            
            geom.computeFaceNormals();
            geom.computeVertexNormals();

            const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.2 });
            glider = new THREE.Mesh(geom, mat);
            scene.add(glider);
            if (callback) callback();
        })
        .catch(err => console.error("Model load error:", err));
}

// ---------------------------------------------
// FIXED: Integrated JSON Reader
// ---------------------------------------------
function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            flight = data;
            N = flight.time.length;
            frame = 0;
            document.getElementById("slider").max = N - 1;
            console.log("Flight data loaded successfully.");
        } catch (err) {
            console.error("JSON Parse Error:", err);
            alert("Error parsing flight JSON. Check file format.");
        }
    };
    reader.readAsText(file);
}

function updateHUD(k) {
    if (!flight) return;
    document.getElementById("hud-alt").textContent = `Altitude: ${flight.alt[k].toFixed(0)} ft`;
    document.getElementById("hud-g").textContent = `G‑Load: ${flight.gload[k].toFixed(2)}`;
    document.getElementById("hud-gs").textContent = `GS: ${(flight.speed[k] * 2.23694).toFixed(1)} mph`;
    document.getElementById("hud-roll").textContent = `Roll: ${flight.roll[k].toFixed(1)}°`;
    document.getElementById("hud-pitch").textContent = `Pitch: ${flight.pitch[k].toFixed(1)}°`;
    document.getElementById("hud-head").textContent = `Heading: ${flight.heading[k].toFixed(1)}°`;

    const t = flight.time[k];
    const min = Math.floor(t / 60);
    const sec = (t - min * 60).toFixed(2);
    document.getElementById("timeDisplay").textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(5,'0')}`;
}

function updateAI(k) {
    if (!flight) return;
    document.getElementById("bank-pointer").style.transform = `rotate(${flight.roll[k]}deg)`;
    document.getElementById("ai-wings").style.transform = `translateY(${-(flight.pitch[k] * 2)}px)`;
}

function updateGlider(k) {
    if (!glider || !flight) return;
    glider.rotation.x = rad(flight.pitch[k]);
    glider.rotation.y = rad(-flight.heading[k]);
    glider.rotation.z = rad(-flight.roll[k]);

    const NE = latLonToNE(flight.lat[0], flight.lon[0], flight.lat[k], flight.lon[k]);
    glider.position.set(NE.N / 10, NE.E / 10, flight.alt[k] / 10);
}

function animate() {
    requestAnimationFrame(animate);
    if (flight) {
        updateGlider(frame);
        updateHUD(frame);
        updateAI(frame);
        if (playing && frame < N - 1) {
            frame++;
            document.getElementById("slider").value = frame;
        } else if (frame >= N - 1) {
            playing = false;
        }
    }
    renderer.render(scene, camera);
}

function setupUI() {
    const slider = document.getElementById("slider");
    slider.oninput = function () {
        frame = parseInt(this.value);
        playing = false;
    };
    document.getElementById("btnPlay").onclick = () => { if(flight) playing = true; };
    document.getElementById("btnPause").onclick = () => playing = false;
    
    document.getElementById("fileInput").addEventListener("change", function(evt) {
        if (evt.target.files.length > 0) {
            handleFileUpload(evt.target.files[0]);
        }
    });
}

window.onload = function () {
    initScene();
    setupUI();
    loadGlider(() => console.log("ASK‑21 Model Loaded."));
    animate();
};
