// Inisialisasi peta
var map = L.map('map').setView([-7.250445, 112.768845], 13); // Ganti dengan koordinat yang diinginkan

// Tambahkan layer peta dari OpenStreetMap
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
osmLayer.addTo(map);

// Daftar koordinat untuk marker
var locations = [
    { coords: [-7.250445, 112.768845], popup: 'Lokasi 1' },
    { coords: [-7.2575, 112.7521], popup: 'Lokasi 2' },
    { coords: [-7.2655, 112.7483], popup: 'Lokasi 3' },
    { coords: [-7.2583, 112.7545], popup: 'Lokasi 4' },
    { coords: [-7.2611, 112.7588], popup: 'Lokasi 5' }
];

// Inisialisasi marker cluster group
var markers = L.markerClusterGroup();

// Ikon kustom
var customIcon = L.icon({
    iconUrl: 'https://example.com/path/to/icon.png', // Ganti dengan URL ikon kustom
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// Tambahkan marker untuk setiap lokasi
locations.forEach(function(location) {
    var marker = L.marker(location.coords, { icon: customIcon }).addTo(markers);
    marker.bindPopup(location.popup);
    marker.on('click', function() {
        alert('Anda mengklik: ' + location.popup);
    });
});

// Tambahkan marker cluster ke peta
map.addLayer(markers);

// GeoJSON data
var geojsonData = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [112.769, -7.251]
            },
            "properties": {
                "name": "GeoJSON Lokasi 1",
                "description": "Deskripsi untuk GeoJSON Lokasi 1"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [112.753, -7.258]
            },
            "properties": {
                "name": "GeoJSON Lokasi 2",
                "description": "Deskripsi untuk GeoJSON Lokasi 2"
            }
        }
    ]
};

// Tambahkan GeoJSON layer
L.geoJSON(geojsonData, {
    onEachFeature: function(feature, layer) {
        layer.bindPopup(feature.properties.name);
        layer.on('click', function() {
            alert('Info: ' + feature.properties.description);
        });
    }
}).addTo(map);

// Fungsi pencarian menggunakan leaflet geocoder
var geocoder = L.Control.geocoder({ defaultMarkGeocode: true }).addTo(map);

// Kontrol layer
var baseLayers = { "Peta Jalan": osmLayer };
L.control.layers(baseLayers).addTo(map);

// Inisialisasi alat menggambar
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true
    }
});
map.addControl(drawControl);

// Event listener untuk menyimpan hasil gambar
map.on(L.Draw.Event.CREATED, function(event) {
    var layer = event.layer;
    drawnItems.addLayer(layer);
});

// Geolocation
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        var userLat = position.coords.latitude;
        var userLng = position.coords.longitude;

        var userMarker = L.marker([userLat, userLng]).addTo(map)
            .bindPopup("Anda berada di sini")
            .openPopup();

        map.setView([userLat, userLng], 13);
        getWeather(userLat, userLng); // Mendapatkan cuaca di lokasi pengguna
    }, function() {
        alert("Geolocation tidak dapat diakses.");
    });
} else {
    alert("Browser Anda tidak mendukung geolocation.");
}

// Fungsi untuk mendapatkan cuaca dari API lokal
function getWeather(lat, lon) {
    var url = `http://localhost:3000/weather?lat=${lat}&lon=${lon}`; // URL server lokal

    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        var weatherDescription = data.weather[0].description;
        var temperature = data.main.temp;
        var weatherInfo = `Cuaca saat ini: ${weatherDescription}, Suhu: ${temperature} °C`;
        L.popup()
            .setLatLng([lat, lon])
            .setContent(weatherInfo)
            .openOn(map);
    })
    .catch(err => {
        console.error(err);
        alert("Gagal mendapatkan data cuaca.");
    });
}

// Routing
var routingControl; // Variabel untuk kontrol routing

// Fungsi untuk membuat rute antara dua titik
function createRoute(startCoords, endCoords) {
    if (routingControl) {
        map.removeControl(routingControl); // Hapus rute sebelumnya jika ada
    }
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startCoords[0], startCoords[1]),
            L.latLng(endCoords[0], endCoords[1])
        ],
        routeWhileDragging: true
    }).addTo(map);
}

// Event listener untuk klik di peta untuk menentukan titik awal dan akhir rute
var startCoords, endCoords;
map.on('click', function(e) {
    if (!startCoords) {
        startCoords = [e.latlng.lat, e.latlng.lng];
        L.marker(startCoords).addTo(map).bindPopup("Titik Awal").openPopup();
    } else if (!endCoords) {
        endCoords = [e.latlng.lat, e.latlng.lng];
        L.marker(endCoords).addTo(map).bindPopup("Titik Akhir").openPopup();
        createRoute(startCoords, endCoords); // Buat rute setelah kedua titik dipilih
        startCoords = null; // Reset koordinat
        endCoords = null;
    }
});