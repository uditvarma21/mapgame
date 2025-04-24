let map;
let countryMarkers = [];
let countryNames = [];
let countryLatLons = [];
let allCountries = {};
let foundCountries = {};
let guessedNames = new Set();
let totalCount = countries.length;
let foundCount = 0;
let running = true;

function initMap() {
  const indiaStateStyle = [
    {
      featureType: "all",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "administrative.country",
      elementType: "geometry",
      stylers: [{ visibility: "on" }, { color: "#000000" }]
    },
    {
      featureType: "administrative.province",
      elementType: "geometry",
      stylers: [{ visibility: "on" }, { color: "#444444" }]
    },
    {
      featureType: "administrative.province",
      elementType: "labels.text.fill",
      stylers: [{ visibility: "on" }, { color: "#000000" }]
    },
    {
      featureType: "administrative.province",
      elementType: "labels.text.stroke",
      stylers: [{ visibility: "on" }, { color: "#ffffff" }]
    }
  ];

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 22.9734, lng: 78.6569 }, // Center of India
    zoom: 5,
    disableDefaultUI: true,
    styles: indiaStateStyle
  });

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 22.9734, lng: 78.6569 }, // Center of India
    zoom: 5,
    disableDefaultUI: true,
    styles: indiaStateStyle
  });

  // Load Indian state boundaries GeoJSON
  map.data.loadGeoJson('Indian_States.geo.json');
  map.data.setStyle({
    fillColor: 'transparent',
    strokeColor: '#888',
    strokeWeight: 1
  });

  for (let i = 0; i < totalCount; i++) {
    const [lat, lon, ...names] = countries[i];

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
      title: "Guess the Biosphere Reserve!"
    });

    countryMarkers.push(marker);
    countryNames.push(names[0]);
    countryLatLons.push([lat, lon]);

    for (let name of names) {
      allCountries[name.toLowerCase()] = i;
    }
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
      color: "#2E6F40"
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
          fontSize: "16px",
          fontWeight: "bold",
          color: "red"
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
