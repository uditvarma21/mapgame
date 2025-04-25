let map;
let countryMarkers = [];
let countryNames = [];
let countryLatLons = [];
let allCountries = {};
let foundCountries = {};
let guessedNames = new Set();
let foundCount = 0;
let running = true;

const rainfallData = {
  "Andaman and Nicobar Islands": 2967,
  "Arunachal Pradesh": 2782,
  "Assam": 2818,
  "Meghalaya": 2818,
  "Nagaland": 1881,
  "Manipur": 1881,
  "Mizoram": 1881,
  "Tripura": 1881,
  "West Bengal": 2739,
  "Sikkim": 2739,
  "Odisha": 1489,
  "Bihar": 1326,
  "Uttar Pradesh": 1025,
  "Haryana": 617,
  "Delhi": 617,
  "Chandigarh": 617,
  "Punjab": 649,
  "Himachal Pradesh": 1251,
  "Jammu and Kashmir": 1011,
  "Rajasthan": 313,
  "Madhya Pradesh": 1338,
  "Gujarat": 1107,
  "Goa": 3005,
  "Maharashtra": 1000,
  "Andhra Pradesh": 1094,
  "Tamil Nadu": 998,
  "Puducherry": 998,
  "Karnataka": 3456,
  "Kerala": 3055,
  "Lakshadweep": 1515
};

const nameFixes = {
  "Orissa": "Odisha",
  "Pondicherry": "Puducherry"
};

function getColorForRainfall(value) {
  if (value <= 600) return "#ffff00";      // Yellow
  if (value <= 1000) return "#e0c385";     // Sand brown
  if (value <= 1500) return "#b2d8b2";     // Light green
  if (value <= 2000) return "#66bb66";     // Mid green
  if (value <= 2500) return "#339966";     // Darker green
  if (value <= 3000) return "#228B22";     // Forest green
  return "#145214";                        // Deep green
}

const terrainStyle = [
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
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ visibility: "on" }, { color: "#000000" }]
  },
  {
    featureType: "administrative.province",
    elementType: "labels.text.stroke",
    stylers: [{ visibility: "on" }, { color: "#00000" }]
  }
];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 22.9734, lng: 78.6569 },
    zoom: 5,
    disableDefaultUI: true,
    mapTypeId: "hybrid",
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ visibility: "on" }, { color: "#ffffff" }]
  });

  map.data.loadGeoJson('Indian_States.geo.json');
  map.data.setStyle({
    fillColor: 'transparent',
    strokeColor: '#ffffff',
    strokeWeight: 1.5
  });

  for (let i = 0; i < countries.length; i++) {
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
  document.getElementById("progress").textContent = `${foundCount} / ${countries.length} guessed`;
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
      color: "#ff0000"
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 0
    }
  });

  map.panTo({ lat, lng: lon });
  updateScore();
  this.value = "";
});

document.getElementById("give-up-button").addEventListener("click", function () {
  if (!running) return;
  running = false;

  for (let i = 0; i < countries.length; i++) {
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
          scale: 0
        }
      });
    }
  }

  document.getElementById("game-input").disabled = true;
  updateScore();
});

let rainfallMode = false;

document.getElementById("toggle-rainfall").addEventListener("click", () => {
  rainfallMode = !rainfallMode;

  if (rainfallMode) {
    map.setMapTypeId("terrain");
    map.setOptions({ styles: terrainStyle });

    map.data.setStyle((feature) => {
      let name = feature.getProperty("NAME_1");
      name = nameFixes[name] || name;

      const rainfall = rainfallData[name];
      const fillColor = rainfall !== undefined ? getColorForRainfall(rainfall) : "#ccc";

      return {
        fillColor,
        strokeColor: "#555",
        strokeWeight: 1,
        fillOpacity: 0.75
      };
    });

  } else {
    map.setMapTypeId("hybrid");
    map.setOptions({ styles: null });

    map.data.setStyle({
      fillColor: 'transparent',
      strokeColor: '#888',
      strokeWeight: 1
    });
  }
});
