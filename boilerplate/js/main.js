var map = L.map('map').setView([39.5, -98.35], 3);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var currentYear = 1980;
var geoJsonLayer;

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

fetch('data/data.geojson')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        geoJsonLayer = L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                layer.bindPopup(buildPopup(feature.properties));
            }
        }).addTo(map);
    });

document.getElementById('year-slider').addEventListener('input', function () {
    currentYear = parseInt(this.value);
    document.getElementById('year-display').textContent = currentYear;
    if (geoJsonLayer) {
        geoJsonLayer.eachLayer(function (layer) {
            layer.setPopupContent(buildPopup(layer.feature.properties));
        });
    }
});
