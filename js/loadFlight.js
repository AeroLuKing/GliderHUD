//
// loadFlight.js
// Reads the student's flight.json file and passes the parsed data to app.js
//

function loadFlightJSON(file, callback) {
    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const data = JSON.parse(event.target.result);

            console.log("Flight JSON loaded:", data);

            // Required fields for your HUD simulator
            const required = ["time","roll","pitch","heading","lat","lon","alt","gload","speed"];
            for (let key of required) {
                if (!data[key]) {
                    console.warn(`Warning: Missing field in JSON: ${key}`);
                }
            }

            callback(data);

        } catch (e) {
            console.error("JSON parsing error:", e);
            alert("Error: File is not valid JSON flight data.");
        }
    };

    reader.onerror = function (event) {
        console.error("File read error:", event);
        alert("Error reading file.");
    };

    reader.readAsText(file);
}
