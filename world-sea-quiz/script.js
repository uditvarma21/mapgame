let map;
let countryMarkers = [];
let countryNames = [];
let countryLatLons = [];
let countryColors = [];
let allCountries = {};
let foundCountries = {};
let guessedNames = new Set();
let totalCount = countries.length;
let foundCount = 0;
let running = true;

function initMap() {
  const riverFocusedStyle = [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        { color: "#2196F3" }, // Bright river blue
        { visibility: "on" }
      ]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#004080" }, { visibility: "on" }]
    },
    {
      featureType: "landscape",
      stylers: [{ color: "#e5e5e5" }]
    },
    {
      featureType: "road",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [{ visibility: "off" },]
    },
    {
      featureType: "all",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }]
    }
  ];

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20, lng: 0 },
    zoom: 2.5,
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    disableDefaultUI: true,
    styles: riverFocusedStyle
  });

  map.data.loadGeoJson('countries.geo.json');

  map.data.addListener('addfeature', function (event) {
    const name = event.feature.getProperty("name") || event.feature.getProperty("NAME") || "Unknown";
    const bounds = new google.maps.LatLngBounds();
    processGeometry(event.feature.getGeometry(), bounds);
    const center = bounds.getCenter();

    new google.maps.Marker({
      position: center,
      map: map,
      label: {
        text: name,
        fontSize: "10px",
        fontWeight: "bold",
        color: "#000000"
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 0
      }
    });
  });

  function processGeometry(geometry, bounds) {
    if (geometry.getType() === 'Polygon') {
      geometry.getArray().forEach(path => path.getArray().forEach(latlng => bounds.extend(latlng)));
    } else if (geometry.getType() === 'MultiPolygon') {
      geometry.getArray().forEach(polygon =>
        polygon.getArray().forEach(path =>
          path.getArray().forEach(latlng => bounds.extend(latlng))
        )
      );
    }
  }

  map.data.setStyle({
    fillColor: 'transparent',
    strokeColor: '#000000',
    strokeWeight: 1
  });

  for (let i = 0; i < totalCount; i++) {
    const [lat, lon, shortName, fullName, color = "red"] = countries[i];

    const marker = new google.maps.Marker({
      position: { lat, lng: lon },
      map: map,
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="9" fill="orange" stroke="black" stroke-width="1"/>
            <text x="10" y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="black">?</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(20, 20),
        anchor: new google.maps.Point(10, 20)
      },
      title: "Guess these Geographic Features!"
    });

    countryMarkers.push(marker);
    countryLatLons.push([lat, lon]);
    countryNames.push(fullName);
    countryColors.push(color);

    allCountries[shortName.toLowerCase()] = i;
    allCountries[fullName.toLowerCase()] = i;
  }
}

function updateScore() {
  document.getElementById("progress").textContent = `${foundCount} / ${totalCount} guessed`;
}

document.getElementById("game-input").addEventListener("keyup", function () {
  if (!running) {
    this.value = "";
    return;
  }

  const input = this.value.toLowerCase().trim();
  if (!(input in allCountries)) return;

  const idx = allCountries[input];
  const fullCountryName = countryNames[idx].toLowerCase();

  if (guessedNames.has(fullCountryName)) return;

  guessedNames.add(fullCountryName);
  foundCountries[idx] = true;
  foundCount++;

  const oldMarker = countryMarkers[idx];
  const [lat, lon] = countryLatLons[idx];
  oldMarker.setMap(null);

  new google.maps.Marker({
    position: { lat, lng: lon },
    map: map,
    label: {
      text: countryNames[idx],
      fontSize: "14px",
      fontWeight: "bold",
      color: countryColors[idx] || "red"
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 0,
    }
  });

  map.panTo({ lat, lng: lon });
  updateScore();
  this.value = "";
});

document.getElementById("give-up-button").addEventListener("click", function () {
  if (!running) return;
  running = false;

  for (let i = 0; i < totalCount; i++) {
    const name = countryNames[i].toLowerCase();
    if (!guessedNames.has(name)) {
      const oldMarker = countryMarkers[i];
      const [lat, lon] = countryLatLons[i];
      oldMarker.setMap(null);

      new google.maps.Marker({
        position: { lat, lng: lon },
        map: map,
        label: {
          text: countryNames[i],
          fontSize: "14px",
          fontWeight: "bold",
          color: countryColors[i] || "red"
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 0,
        }
      });
    }
  }

  document.getElementById("game-input").disabled = true;
  updateScore();
});
