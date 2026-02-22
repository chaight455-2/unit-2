// Create map centered in US with reasonable zoom
var map = L.map('map').setView([39.5, -98.35], 3);

// Use OSM tileset
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var currentYear = 1980;
var geoJsonLayer;

// Function to create a styled popup with parkname, year, and visitor count that dynamically changes with year.
function buildPopup(props) {
    var visitors = props[currentYear];
    var visitorText = (visitors != null && visitors !== 0)
        ? visitors.toLocaleString()
        : 'No data for ' + currentYear;
    return '<div class="popup-content">' +
        '<h3>' + props.NAME + '</h3>' +
        '<p><span class="popup-label">Year:</span> ' + currentYear + '</p>' +
        '<p><span class="popup-label">Visitors:</span> ' + visitorText + '</p>' +
        '</div>';
}

// Scale visitor count to circle radius — power 0.6 gives more visual separation than sqrt (0.5)
function getRadius(visitors) {
    if (!visitors || visitors === 0) return 3;
    return Math.max(2, Math.pow(visitors / 500000, 0.6) * 5);
}

// Get data and add points and popups to map.
fetch('data/data.geojson')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        geoJsonLayer = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: getRadius(feature.properties[currentYear]),
                    fillColor: '#4a90d9',
                    color: '#fff',
                    weight: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(buildPopup(feature.properties));
            }
        }).addTo(map);
    });

// control year variable when user interacts with sequence component.
function updateYear(year) {
    currentYear = Math.min(2024, Math.max(1980, year));
    document.getElementById('year-slider').value = currentYear;
    document.getElementById('year-display').textContent = currentYear;
    if (geoJsonLayer) {
        geoJsonLayer.eachLayer(function (layer) {
            layer.setRadius(getRadius(layer.feature.properties[currentYear]));
            layer.setPopupContent(buildPopup(layer.feature.properties));
        });
    }
}

document.getElementById('year-slider').addEventListener('input', function () {
    updateYear(parseInt(this.value));
});

document.getElementById('btn-prev').addEventListener('click', function () {
    updateYear(currentYear - 1);
});

document.getElementById('btn-next').addEventListener('click', function () {
    updateYear(currentYear + 1);
});
