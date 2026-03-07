// Create map centered in US with reasonable zoom
var map = L.map('map').setView([39.5, -98.35], 3);

// Use OSM tileset
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var currentYear = 1980;
var geoJsonLayer;
var yearlyTotals = {};

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

// Scale visitor count to circle radius, scaled to provide more separation between values for user
function getRadius(visitors) {
    if (!visitors || visitors === 0) return 3;
    return Math.max(2, Math.pow(visitors / 500000, 0.6) * 5);
}

// Sidebar historical sections, each has a year range, title, body, and sources
var sidebarSections = [
    {
        range: [1980, 1989],
        title: "1980-1989 — Steady Growth and a Counting Overhaul",
        body: "Visitation to the 63 national parks grew from 51.1 million in 1980 to 66.9 million by 1989, a 31% increase over the decade. Much of this growth coincided with the NPS overhauling its counting methods — prior to the mid-1980s, no standardized system existed and double-counting was rampant. The new procedures improved accuracy going forward, meaning the growth was likely even larger than the raw numbers suggest.",
        sources: "U.S. Department of the Interior, \"NPS Visitation Trends\" testimony; National Parks Traveler, 2006"
    },
    {
        range: [1990, 1994],
        title: "1990 — Recession Causes the Only Dip of the Decade",
        body: "Visitation dropped from 66.9 million in 1989 to 64.2 million in 1990, a 4% decline. The 1990-91 recession raised fuel costs and tightened travel budgets, making the cross-country road trips that defined park tourism more expensive. The dip was short-lived — visits bounced back to 68.3 million the very next year and continued climbing.",
        sources: "National Parks Traveler, \"Park Visitation Trends\", 2006; Parks & Trips, 2023"
    },
    {
        range: [1995, 1997],
        title: "1995-1997 — The 1990s Peak at 76.3 Million",
        body: "Fueled by a booming economy and low gas prices, national park visits reached 76.3 million in 1997, the highest figure the 63 parks had ever recorded. Air travel was increasingly replacing cross-country road trips, benefiting parks near gateway cities like Las Vegas and Seattle. This peak would stand for nearly two decades.",
        sources: "Stevens et al., \"Declining national park visitation: An economic analysis,\" U.S. Forest Service, 2014; U.S. Department of the Interior, \"NPS Visitation Trends\" testimony"
    },
    {
        range: [1998, 2006],
        title: "2001-2006 — Post-9/11 Stagnation and the \"Nature Deficit\" Era",
        body: "Visitation declined from 73.5 million in 2000 to 71.4 million in 2001 and settled into a prolonged flat period, hovering between 66 and 72 million through 2006. The 9/11 attacks sharply reduced international travel — roughly one-fifth of overseas tourists typically visited a national park. Researchers also linked declining per capita visits to the rise of electronic media: more time spent on video games, television, and the internet correlated with less time outdoors.",
        sources: "U.S. Department of the Interior, \"NPS Visitation Trends\" testimony; Stevens et al., U.S. Forest Service, 2014"
    },
    {
        range: [2007, 2009],
        title: "2007-2009 — Parks Boom During the Great Recession",
        body: "Visitation rose from 66.8 million in 2008 to 69.0 million in 2009, a 3.4% jump during a severe economic downturn. Parks offered a budget-friendly vacation alternative when pricier options were out of reach. Interior Secretary Ken Salazar noted the park system supported over 223,000 jobs and nearly $14 billion in economic activity.",
        sources: "Deseret News, \"National park visits boom amid recession,\" 2010"
    },
    {
        range: [2010, 2013],
        title: "2010-2013 — Government Shutdown Suppresses an Already Flat Trend",
        body: "Visitation slipped to 69.1 million in 2013, down from 71.1 million the prior year. The 16-day federal government shutdown in October closed parks during prime fall season, costing an estimated 7.88 million visits and $414 million in visitor spending across NPS gateway communities. The number had been essentially flat since 2001 — 2013 was the last year of this long stagnation.",
        sources: "Templeton et al., \"COVID-19 and its impact on visitation and management at US national parks,\" International Hospitality Review, 2021"
    },
    {
        range: [2014, 2017],
        title: "2014-2017 — The Centennial Boom and Social Media Surge",
        body: "This was the most dramatic growth period in national park history. Visits exploded from 69.1 million in 2013 to 89.4 million in 2017 — a 29% increase in just four years. The catalysts were the NPS centennial celebration in 2016 and the \"Find Your Park\" social media campaign, which reached more than one in three millennials. A PNAS study confirmed that social media exposure measurably drove increased visits, particularly to photogenic parks. President Obama's \"Every Kid in a Park\" initiative also contributed.",
        sources: "NPS, \"Centennial Success,\" 2016; PNAS, \"Social media influences National Park visitation,\" 2024; U.S. Department of the Interior, \"National Parks Next Generation\" testimony"
    },
    {
        range: [2018, 2019],
        title: "2019 — Pre-Pandemic High of 91.0 Million",
        body: "Despite a 35-day partial government shutdown straddling 2018-2019 — which cost an estimated $10-11 million in fees and left parks unstaffed — visitation hit 91.0 million in 2019. Individual parks like Great Smoky Mountains smashed records at 12.55 million visits. Overcrowding became a crisis: Arches turned away visitors daily, and the NPS began rolling out reservation systems and timed-entry permits at heavily impacted parks.",
        sources: "Templeton et al., International Hospitality Review, 2021; Smoky Mountain News, 2020; U.S. Department of the Interior, \"Overcrowding in Parks\" testimony"
    },
    {
        range: [2020, 2020],
        title: "2020 — COVID-19 Drops Visitation 25.4% to 67.9 Million",
        body: "The pandemic caused the sharpest single-year decline on record, from 91.0 million to 67.9 million — a level not seen since 2006. Sixty-six national parks closed for two months or more. Yet the picture was uneven: one-third of parks had at least one month of record visitation as Americans sought outdoor spaces perceived as safer than indoor venues.",
        sources: "Backpacker, 2021; U.S. Department of the Interior, \"Overcrowding in Parks\" testimony; PMC/Scientific Reports, Rice et al., 2022"
    },
    {
        range: [2021, 2023],
        title: "2021 — \"Revenge Travel\" Rebound to 92.3 Million",
        body: "Americans surged back outdoors in 2021, pushing national park visits to 92.3 million — a 35.8% jump from 2020 and a new all-time record. Recreation.gov reservations nearly doubled. The boom intensified overcrowding concerns as parks that previously had quiet off-seasons saw year-round pressure.",
        sources: "Parks & Trips, 2023; U.S. Department of the Interior, \"Overcrowding in Parks\" testimony"
    },
    {
        range: [2024, 2024],
        title: "2024 — New All-Time Record: 94.3 Million Visits",
        body: "The 63 national parks recorded 94,287,567 recreation visits in 2024, up 2.1% from 2023's 92.4 million and setting a new all-time high. Twenty-eight parks set individual records, and visitation spread more evenly across the calendar, with 55% of parks seeing above-average numbers during traditionally slower months.",
        sources: "NPS Visitor Use Statistics Dashboard, 2025; Solar Reviews, \"US National Parks Statistics,\" 2025; Responsible Datasets in Context, Walsh & Keyes, 2024"
    }
];

// Save totals for later
function buildYearlyTotals() {
    for (var y = 1980; y <= 2024; y++) {
        var total = 0;
        geoJsonLayer.eachLayer(function (layer) {
            var v = layer.feature.properties[y];
            if (v != null) total += v;
        });
        yearlyTotals[y] = total;
    }
}

// Build the SVG sparkline chart for the sidebar
function buildChart() {
    var container = document.getElementById('sidebar-chart');
    if (!container) return;

    var years = [];
    var values = [];
    for (var y = 1980; y <= 2024; y++) {
        years.push(y);
        values.push(yearlyTotals[y] || 0);
    }

    var w = 316, h = 120;
    var padL = 40, padR = 10, padT = 10, padB = 24;
    var chartW = w - padL - padR;
    var chartH = h - padT - padB;
    var minV = Math.min.apply(null, values) * 0.95;
    var maxV = Math.max.apply(null, values) * 1.02;

    function x(i) { return padL + (i / (years.length - 1)) * chartW; }
    function yPos(v) { return padT + chartH - ((v - minV) / (maxV - minV)) * chartH; }

    // Build polyline points
    var points = years.map(function (_, i) {
        return x(i) + ',' + yPos(values[i]);
    }).join(' ');

    // Y-axis tick values
    var tickCount = 4;
    var ticks = [];
    for (var t = 0; t <= tickCount; t++) {
        var val = minV + (t / tickCount) * (maxV - minV);
        ticks.push(val);
    }

    var ticksSvg = ticks.map(function (val) {
        var ty = yPos(val);
        var label = (val / 1e6).toFixed(0) + 'M';
        return '<line x1="' + padL + '" y1="' + ty + '" x2="' + (w - padR) + '" y2="' + ty + '" stroke="#2a2a4a" stroke-width="0.5"/>' +
            '<text x="' + (padL - 4) + '" y="' + (ty + 3) + '" text-anchor="end" fill="#777" font-size="9">' + label + '</text>';
    }).join('');

    // X-axis labels every 10 years + 2024
    var xLabels = [1980, 1990, 2000, 2010, 2020].map(function (yr) {
        var i = yr - 1980;
        return '<text x="' + x(i) + '" y="' + (h - 4) + '" text-anchor="middle" fill="#777" font-size="9">' + yr + '</text>';
    }).join('');

    var svg = '<svg width="' + w + '" height="' + h + '" xmlns="http://www.w3.org/2000/svg">' +
        ticksSvg + xLabels +
        '<polyline points="' + points + '" fill="none" stroke="#4a90d9" stroke-width="1.5"/>' +
        '<circle id="chart-marker" cx="0" cy="0" r="4" fill="#4a90d9" stroke="#fff" stroke-width="1.5"/>' +
        '</svg>';

    container.innerHTML = svg;
    updateChartMarker();
}

// Move the chart marker dot to the current year
function updateChartMarker() {
    var marker = document.getElementById('chart-marker');
    if (!marker) return;

    var w = 316, h = 120;
    var padL = 40, padR = 10, padT = 10, padB = 24;
    var chartW = w - padL - padR;
    var chartH = h - padT - padB;

    var years = [];
    var values = [];
    for (var y = 1980; y <= 2024; y++) {
        years.push(y);
        values.push(yearlyTotals[y] || 0);
    }
    var minV = Math.min.apply(null, values) * 0.95;
    var maxV = Math.max.apply(null, values) * 1.02;

    var i = currentYear - 1980;
    var cx = padL + (i / (years.length - 1)) * chartW;
    var cy = padT + chartH - ((values[i] - minV) / (maxV - minV)) * chartH;

    marker.setAttribute('cx', cx);
    marker.setAttribute('cy', cy);
}

// Show only the active section in the sidebar
function updateSidebar() {
    var totalEl = document.getElementById('sidebar-total');
    if (totalEl) {
        var total = yearlyTotals[currentYear] || getTotalVisitors();
        var prevTotal = yearlyTotals[currentYear - 1];
        var pctHtml = '';
        if (prevTotal && prevTotal > 0) {
            var pct = ((total - prevTotal) / prevTotal) * 100;
            var sign = pct >= 0 ? '+' : '';
            var color = pct >= 0 ? '#5cb85c' : '#d9534f';
            pctHtml = ' <span class="total-pct" style="color:' + color + '">' + sign + pct.toFixed(1) + '% vs ' + (currentYear - 1) + '</span>';
        } else {
            pctHtml = ' <span class="total-pct" style="color:#5cb85c">0.0%</span>';
        }
        totalEl.innerHTML = '<span class="total-year">' + currentYear + '</span> Total Visitors: ' + total.toLocaleString() + pctHtml;
    }

    var container = document.getElementById('sidebar-sections');
    if (!container) return;

    var section = null;
    for (var i = 0; i < sidebarSections.length; i++) {
        var r = sidebarSections[i].range;
        if (currentYear >= r[0] && currentYear <= r[1]) {
            section = sidebarSections[i];
            break;
        }
    }

    if (section) {
        container.innerHTML = '<div class="sidebar-section active">' +
            '<h3>' + section.title + '</h3>' +
            '<p>' + section.body + '</p>' +
            '<p class="sidebar-sources">' + section.sources + '</p>' +
            '</div>';
    } else {
        container.innerHTML = '';
    }

    updateChartMarker();
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

// Update all markers and popups to reflect the current year
function updateYear(year) {
    currentYear = Math.min(2024, Math.max(1980, year));
    document.getElementById('year-slider').value = currentYear;
    document.getElementById('year-display').textContent = currentYear;
    updateSidebar();
    if (geoJsonLayer) {
        geoJsonLayer.eachLayer(function (layer) {
            layer.setRadius(getRadius(layer.feature.properties[currentYear]));
            layer.setPopupContent(buildPopup(layer.feature.properties));
        });
    }
}

// Create sequence controls
function createSequenceControls() {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomright'
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

        buildYearlyTotals();
        createSequenceControls();
        updateSidebar();
        buildChart();
    });
