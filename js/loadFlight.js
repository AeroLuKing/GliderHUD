function loadFlightFiles(fileInput) {
    const fileReader = new FileReader();

    fileReader.onload = function(event) {
        try {
            // Parse the JSON data
            const data = JSON.parse(event.target.result);
            console.log('Flight data loaded:', data);
            // You can add additional logic to handle the loaded data
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };

    fileReader.onerror = function(event) {
        console.error('Error reading file:', event);
    };

    // Read the file as text
    fileReader.readAsText(fileInput);
}