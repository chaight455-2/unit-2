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

// Year-specific context paragraphs — add entries here as needed
var yearInfo = {};

// Create legend control
function createLegend() {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'legend-control-container');

            var title = L.DomUtil.create('h4', 'legend-title', container);
            title.textContent = 'National Park Visitors';

            // Total visitor count for the current year
            var total = L.DomUtil.create('p', 'legend-total', container);
            total.id = 'legend-total';

            // Year info paragraph — updated dynamically when year changes
            var info = L.DomUtil.create('p', 'legend-year-info', container);
            info.id = 'legend-year-info';
            info.textContent = yearInfo[currentYear] || '';
            if (!info.textContent) info.style.display = 'none';

            // References section
            var refs = L.DomUtil.create('div', 'legend-references', container);
            var refTitle = L.DomUtil.create('span', 'legend-ref-title', refs);
            refTitle.textContent = 'Sources';
            var link1 = L.DomUtil.create('a', '', refs);
            link1.href = 'https://irma.nps.gov/Stats/SSRSReports/National%20Reports/Query%20Builder%20for%20Public%20Use%20Statistics%20(1979%20-%20Last%20Calendar%20Year)';
            link1.textContent = 'Visitor data';
            link1.target = '_blank';
            var link2 = L.DomUtil.create('a', '', refs);
            link2.href = 'https://irma.nps.gov/DataStore/Reference/Profile/2224545?lnv=True';
            link2.textContent = 'Park locations';
            link2.target = '_blank';

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            return container;
        }
    });

    map.addControl(new LegendControl());
    updateLegendInfo();
}

// Calculate total visitors across all parks for a given year
function getTotalVisitors() {
    var total = 0;
    if (geoJsonLayer) {
        geoJsonLayer.eachLayer(function (layer) {
            var v = layer.feature.properties[currentYear];
            if (v != null) total += v;
        });
    }
    return total;
}

// Update the legend's total and year-info paragraph
function updateLegendInfo() {
    var totalEl = document.getElementById('legend-total');
    if (totalEl) {
        var total = getTotalVisitors();
        totalEl.innerHTML = '<span class="legend-total-label">Total visitors:</span> ' +
            total.toLocaleString();
    }

    var el = document.getElementById('legend-year-info');
    if (!el) return;
    var text = yearInfo[currentYear] || '';
    el.textContent = text;
    el.style.display = text ? '' : 'none';
}

// Update all markers and popups to reflect the current year
function updateYear(year) {
    currentYear = Math.min(2024, Math.max(1980, year));
    document.getElementById('year-slider').value = currentYear;
    document.getElementById('year-display').textContent = currentYear;
    updateLegendInfo();
    if (geoJsonLayer) {
        geoJsonLayer.eachLayer(function (layer) {
            layer.setRadius(getRadius(layer.feature.properties[currentYear]));
            layer.setPopupContent(buildPopup(layer.feature.properties));
        });
    }
}

// Create sequence controls using Leaflet's L.Control
function createSequenceControls() {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'sequence-control-container');

            var label = L.DomUtil.create('label', '', container);
            label.innerHTML = 'Year: <span id="year-display">1980</span>';

            var sliderRow = L.DomUtil.create('div', 'slider-row', container);

            var btnPrev = L.DomUtil.create('button', 'step-btn', sliderRow);
            btnPrev.innerHTML = '&#9664;';
            btnPrev.title = 'Previous year';

            var slider = L.DomUtil.create('input', 'year-slider', sliderRow);
            slider.type = 'range';
            slider.min = 1980;
            slider.max = 2024;
            slider.value = 1980;
            slider.step = 1;
            slider.id = 'year-slider';

            var btnNext = L.DomUtil.create('button', 'step-btn', sliderRow);
            btnNext.innerHTML = '&#9654;';
            btnNext.title = 'Next year';

            // Prevent map interactions when using the control
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

    // Add listeners after adding control
    document.getElementById('year-slider').addEventListener('input', function () {
        updateYear(parseInt(this.value));
    });

    document.querySelectorAll('.step-btn').forEach(function (btn, i) {
        btn.addEventListener('click', function () {
            updateYear(currentYear + (i === 0 ? -1 : 1));
        });
    });
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

        createSequenceControls();
        createLegend();
    });
