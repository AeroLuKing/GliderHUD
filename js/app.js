let scene, camera, renderer, glider = null;
let flight = null, frame = 0, N = 0, playing = false;

const rad = (a) => a * Math.PI / 180;

// 1. Initialize the 3D Scene
function initScene() {
    const container = document.getElementById("canvas-container");
    if (!container) return;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x222222, 1); // Dark grey background
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 5000);
    camera.position.set(0, -15, 8); // Positioned behind and slightly above
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);
}

// 2. Load the Glider Model
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
        }).catch(e => console.error("Model Loading Error:", e));
}

// 3. Handle MATLAB JSON Format
function loadFlightJSON(files) {
    if (files.length === 0) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const raw = JSON.parse(e.target.result);
            
            // Normalize MATLAB names to match HUD logic
            flight = {
                time:    raw.time || [],
                alt:     raw.alt || raw.altitude || [],
                roll:    raw.roll || raw.roll_deg || [],
                pitch:   raw.pitch || raw.pitch_deg || [],
                heading: raw.heading || raw.head_deg || [],
                gload:   raw.gload || [],
                speed:   raw.speed || []
            };

            N = flight.time.length;
            document.getElementById("slider").max = N - 1;
            console.log("Flight Data Normalized:", N, "frames");
            updateHUD(0); // Show first frame
        } catch (err) {
            console.error("JSON Parse Error:", err);
            alert("Error parsing JSON file.");
        }
    };
    reader.readAsText(files[0]);
}

// 4. Update HUD and 3D Model
function updateHUD(k) {
    if (!flight || !flight.time[k]) return;

    // Helper to handle missing values safely
    const getVal = (arr) => (arr && arr[k] !== undefined) ? arr[k] : 0;

    const altFeet = getVal(flight.alt) * 3.28084;
    const roll = getVal(flight.roll);
    const pitch = getVal(flight.pitch);
    const head = getVal(flight.heading);
    const g = getVal(flight.gload);
    const speedMph = getVal(flight.speed) * 2.23694;

    // Update Text Elements
    document.getElementById("hud-alt").textContent   = `Altitude: ${altFeet.toFixed(0)} ft`;
    document.getElementById("hud-roll").textContent  = `Roll: ${roll.toFixed(1)}°`;
    document.getElementById("hud-pitch").textContent = `Pitch: ${pitch.toFixed(1)}°`;
    document.getElementById("hud-head").textContent  = `Heading: ${head.toFixed(1)}°`;
    document.getElementById("hud-gs").textContent    = `GS: ${speedMph.toFixed(1)} mph`;
    document.getElementById("hud-g").textContent     = `G-Load: ${g.toFixed(2)} G`;

    // Update Attitude Indicator
    document.getElementById("bank-pointer").style.transform = `rotate(${roll}deg)`;
    document.getElementById("ai-wings").style.transform     = `translateY(${-(pitch * 2)}px)`;

    // Update 3D Glider
    if (glider) {
        glider.rotation.set(rad(pitch), rad(-head), rad(-roll), 'ZYX');
        glider.position.set(0, 0, 0); // Keep centered in camera
    }

    // Update Time String
    const t = flight.time[k];
    const min = Math.floor(t / 60);
    const sec = (t % 60).toFixed(2);
    document.getElementById("timeDisplay").textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(5,'0')}`;
}

// 5. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    if (flight && playing) {
        if (frame < N - 1) {
            frame++;
            document.getElementById("slider").value = frame;
            updateHUD(frame);
        } else {
            playing = false;
        }
    }
    renderer.render(scene, camera);
}

// 6. UI Setup
window.onload = () => {
    initScene();
    loadGlider(() => console.log("Glider Loaded & Visible"));

    document.getElementById("fileInput").onchange = (e) => loadFlightJSON(e.target.files);
    document.getElementById("btnPlay").onclick = () => { if(flight) playing = true; };
    document.getElementById("btnPause").onclick = () => playing = false;
    document.getElementById("slider").oninput = (e) => {
        frame = parseInt(e.target.value);
        updateHUD(frame);
    };

    animate();
};
