let map;
let placesService;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 8,
    });

    const input = document.getElementById("locationInput");
    const autocomplete = new google.maps.places.Autocomplete(input);

    placesService = new google.maps.places.PlacesService(map);

    autocomplete.addListener("place_changed", handlePlaceSelection);

    const geolocationButton = document.getElementById("geolocationButton");
    geolocationButton.addEventListener("click", getUserLocation);

    const travelModeSelect = document.getElementById("travelModeSelect");
    travelModeSelect.addEventListener("change", calculateDistance);
}

function handlePlaceSelection() {
    const place = getSelectedPlace();

    if (place.geometry) {
        map.setCenter(place.geometry.location);
        calculateDistance(place.geometry.location);
    } else {
        placesService.getDetails({ placeId: place.place_id }, (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                map.setCenter(result.geometry.location);
                calculateDistance(result.geometry.location);
            } else {
                alert("Error: Unable to retrieve place details");
            }
        });
    }
}

function getSelectedPlace() {
    const input = document.getElementById("locationInput");
    return new google.maps.places.Autocomplete(input).getPlace();
}

function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = new google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude
            );

            const input = document.getElementById("locationInput");
            input.value = "My Location";
            input.setAttribute("disabled", "disabled");

            map.setCenter(userLocation);
            calculateDistance(userLocation);
        });
    } else {
        alert("Geolocation is not available in this browser.");
    }
}

function calculateDistance(destination = null) {
    const originInput = document.getElementById("locationInput");
    const origin = originInput.value === "My Location" ? null : originInput.value;
    const travelMode = document.getElementById("travelModeSelect").value;

    if (!origin || !destination) {
        alert("Please enter valid origin and destination locations.");
        return;
    }

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: [origin],
            destinations: [destination],
            travelMode: google.maps.TravelMode[travelMode.toUpperCase()],
        },
        handleDistanceResponse
    );
}

function handleDistanceResponse(response, status) {
    if (status === "OK") {
        const element = document.getElementById("distance");
        element.textContent = response.rows[0].elements[0].distance.text;

        calculateDirections(response.request.origin.query, response.request.destinations[0].query);
    } else {
        alert("Error: Unable to calculate distance");
    }
}

function calculateDirections(origin, destination) {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ map });

    const request = {
        origin,
        destination,
        travelMode: google.maps.TravelMode[travelMode.toUpperCase()],
    };

    directionsService.route(request, (response, status) => {
        if (status === "OK") {
            const directions = document.getElementById("directions");
            directions.innerHTML = "";

            response.routes[0].legs[0].steps.forEach((step) => {
                const li = document.createElement("li");
                li.textContent = step.instructions;
                directions.appendChild(li);
            });

            calculateFuelConsumption(response.routes[0].legs[0].distance.value / 1000);
        } else {
            alert("Error: Unable to calculate directions");
        }
    });
}

function calculateFuelConsumption(distance) {
    const estimatedFuelInput = document.getElementById("estimatedFuel");
    const estimatedFuel = parseFloat(estimatedFuelInput.value);

    if (distance > 0 && estimatedFuel >= 0) {
        const fuelConsumption = (estimatedFuel / distance) * 100;
        const resultElement = document.getElementById("fuelConsumptionResult");
        resultElement.textContent = `Fuel Consumption: ${fuelConsumption.toFixed(2)} L/km`;
    } else {
        const resultElement = document.getElementById("fuelConsumptionResult");
        resultElement.textContent = "Fuel Consumption: N/A L/km";
    }
}

