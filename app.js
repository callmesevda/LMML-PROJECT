const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const put = (sel, val) => {
  const el = $(sel);
  if (el && val !== undefined && val !== null) el.innerText = val;
};

const AppState = {
  theme: "early-print",
  page: "cover",
  narrative: "historical",
  location: "loc_01",
  tone: "adult" 
};

document.addEventListener("click", (e) => {

  if (e.target.id === "narrative-index-modal") {
    e.target.classList.remove("active");
    return;
  }

  const actBtn = e.target.closest("[data-action]");
  if (actBtn) {
    const action = actBtn.dataset.action;

    if (action === "prev" || action === "next") {
      const target = actBtn.dataset.target;      
      if (target) updateState("location", target);
      return;                                    
    }

    if (action === "start-tour-first-stop") {
      const first = NARRATIVES_DATA[AppState.narrative]?.stops[0];
      if (first) {
        updateState("location", first.id);
        updateState("page", "visualization");
      }
      return; 
    }

    if (action === "goto-stop") {
      const target = actBtn.dataset.target;
      const modal = document.getElementById("narrative-index-modal");
      if (modal) modal.classList.remove("active");
      
      if (target) {
        updateState("location", target);
        updateState("page", "visualization");
      }
      return;
    }

    if (action === "toggle-stops-index") {
      const modal = document.getElementById("narrative-index-modal");
      const listContainer = document.getElementById("index-stops-list");
      const titleContainer = document.getElementById("index-modal-title");
      
      const currentRoute = NARRATIVES_DATA[AppState.narrative];

      if (modal && currentRoute) {
        titleContainer.textContent = currentRoute.title;
        listContainer.innerHTML = "";
        
        currentRoute.stops.forEach((stop) => {
          const li = document.createElement("li");
          const btn = document.createElement("button");
          btn.textContent = stop.name;
          
          btn.dataset.action = "goto-stop";
          btn.dataset.target = stop.id;
          
          li.appendChild(btn);
          listContainer.appendChild(li);
        });
        
        modal.classList.add("active");
      }
      return;
    }

    if (action === "close-index") {
      const modal = document.getElementById("narrative-index-modal");
      if (modal) modal.classList.remove("active");
      return;
    }

    if (action === "toggle-details") {
      const detailedContainer = document.getElementById("dynamic-detailed-container");
      if (!detailedContainer) return;
      
      const btnText = actBtn.querySelector(".btn-text");
      const arrowSpan = actBtn.querySelector(".arrow");
      
      detailedContainer.classList.toggle("expanded");
      
      if (detailedContainer.classList.contains("expanded")) {
        if (arrowSpan) arrowSpan.innerHTML = "▲";
        if (btnText) btnText.textContent = "Read Less";
      } else {
        if (arrowSpan) arrowSpan.innerHTML = "▼";
        if (btnText) btnText.textContent = "Read More";
        detailedContainer.scrollTop = 0; 
      }
      return;
    }

    if (action === "set-persona") {
      const selectedPersona = actBtn.dataset.value; 
      
      document.querySelectorAll(".persona-btn").forEach(btn => btn.classList.remove("active"));
      actBtn.classList.add("active");
      
      AppState.tone = selectedPersona; 
      
      const stationData = LOCATION_CACHE.get(AppState.location);
      if (stationData) {
        injectLocationTexts(stationData, AppState.tone, AppState.narrative);
      }
      
      return;
    }
  } 

  const btn = e.target.closest("[data-set]");
  if (!btn) return;

  const key = btn.getAttribute("data-set");     
  const value = btn.getAttribute("data-value");
  if (key && value) updateState(key, value);
});

function updateState(key, value, saveToHistory = true) {
  
  AppState[key] = value;
  document.body.setAttribute(`data-${key}`, value);

  if (saveToHistory) {
    const stateClone = { ...AppState };
    history.pushState(stateClone, "", "");
  }

  if (key === "theme" || key === "page") {
    updateMenuButtons(key, value);
  }

  if (key === "theme") {
    if (typeof applyThemeDecorations === "function") applyThemeDecorations();
  }

  if (key === "narrative") {
    setTimeout(() => updateState("page", "map", saveToHistory), 200);
  }

  if (key === "page" && value === "map") {
    setTimeout(() => initMap(AppState.narrative), 100);
  }

  if (key === "page" && value === "visualization") {
    setTimeout(() => injectLocationData(AppState.location), 50);
  }

  if (key === "location" && AppState.page === "visualization") {
    injectLocationData(value);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  history.replaceState({ ...AppState }, "", "");
});

window.addEventListener("popstate", (e) => {
  if (e.state) {
    for (const key in e.state) {
      if (AppState[key] !== e.state[key]) {
        updateState(key, e.state[key], false); 
      }
    }
  }
});

function updateMenuButtons(key, value) {
  $$(`button[data-set="${key}"]`).forEach(btn => {
    btn.setAttribute(
      "aria-pressed",
      btn.dataset.value === value ? "true" : "false"
    );
  });
}

const NARRATIVES_DATA = {
  historical: {
    title: "The Historical Timeline",
    desc: [
      "Seville is not merely a city; it is a living manuscript carved in stone and shadow. To walk its paths is to cross the fragile boundaries of time. In this historical narrative, we trace the echoes of forgotten empires—from the crumbling pillars of ancient conquerors to the majestic courtyards where different faiths and civilizations wove their legacies together. Here, history is not preserved behind glass; it breathes within the very walls that surround you.",
      "The archives await your touch. Uncover the hidden layers of a realm built by emperors, caliphs, and visionaries. Click on the markers to awaken the untold stories of each site, or begin the journey directly to turn the first page of this timeless volume. The past is calling; are you ready to step into it?"
    ],
    color: "#9B3D35",         
    stops: [
      { coords: [37.44590, -6.04500], name: "Stop 1: Roman Ruins of Itálica", id: "loc_01" },
      { coords: [37.38320, -5.98980], name: "Stop 2: Real Alcázar — Baños de María de Padilla", id: "loc_09" },
      { coords: [37.38480, -5.99720], name: "Stop 3: Royal Shipyards of Seville (Atarazanas Reales)", id: "loc_02" },
      { coords: [37.38300, -5.99045], name: "Stop 4: Real Alcázar — Patio de las Doncellas", id: "loc_07" },
      { coords: [37.38310, -5.99070], name: "Stop 5: Real Alcázar — Salón de Embajadores", id: "loc_08" },
      { coords: [37.38990, -5.98730], name: "Stop 6: Casa de Pilatos — Main Courtyard", id: "loc_04" },
      { coords: [37.38990, -5.98730], name: "Stop 7: Casa de Pilatos — Lower Galleries", id: "loc_05" },
      { coords: [37.38230, -5.98850], name: "Stop 8: Real Alcázar — Jardín de las Damas", id: "loc_10" },
      { coords: [37.38250, -5.99220], name: "Stop 9: Universidad de Sevilla — Main Facade (Royal Tobacco Factory)", id: "loc_12" },
      { coords: [37.38490, -5.99230], name: "Stop 10: Hotel Alfonso XIII — Courtyard", id: "loc_11" },
      { coords: [37.37810, -5.98640], name: "Stop 11: Plaza de España — Semicircular Arcade", id: "loc_13" },
      { coords: [37.37700, -5.98570], name: "Stop 12: Plaza de España — Main Balcony", id: "loc_14" },
      { coords: [37.37760, -5.98720], name: "Stop 13: Plaza de España — Bridge over the Canal", id: "loc_15" },
      { coords: [37.38590, -5.98950], name: "Stop 14: Calle Mateos Gago", id: "loc_06" },   
      { coords: [37.38915, -5.99555], name: "Stop 15: Plaza Nueva — Tram Stop", id: "loc_03" } 
    ]
  },
  epic: {
    title: "The Cinematic Route",
    desc: [
      "Break the laws of geography. This route connects the most epic cinematic kingdoms shot in Seville, taking you from the Dragonpit of King's Landing straight to the palatial squares of Naboo."
    ],
    color: "#E4032E",      
    stops: [
      { coords: [37.44590, -6.04500], name: "Stop 1: Roman Ruins of Itálica", id: "loc_01" },
      { coords: [37.38480, -5.99720], name: "Stop 2: Royal Shipyards of Seville (Atarazanas Reales)", id: "loc_02" },
      { coords: [37.38990, -5.98730], name: "Stop 3: Casa de Pilatos — Main Courtyard", id: "loc_04" },
      { coords: [37.38990, -5.98730], name: "Stop 4: Casa de Pilatos — Lower Galleries", id: "loc_05" },
      { coords: [37.38300, -5.99045], name: "Stop 5: Real Alcázar — Patio de las Doncellas", id: "loc_07" },
      { coords: [37.38310, -5.99070], name: "Stop 6: Real Alcázar — Salón de Embajadores", id: "loc_08" },
      { coords: [37.38320, -5.98980], name: "Stop 7: Real Alcázar — Baños de María de Padilla", id: "loc_09" },
      { coords: [37.38230, -5.98850], name: "Stop 8: Real Alcázar — Jardín de las Damas", id: "loc_10" },
      { coords: [37.38490, -5.99230], name: "Stop 9: Hotel Alfonso XIII — Courtyard", id: "loc_11" },
      { coords: [37.38250, -5.99220], name: "Stop 10: Universidad de Sevilla — Main Facade (Royal Tobacco Factory)", id: "loc_12" },
      { coords: [37.37810, -5.98640], name: "Stop 11: Plaza de España — Semicircular Arcade", id: "loc_13" },
      { coords: [37.37700, -5.98570], name: "Stop 12: Plaza de España — Main Balcony", id: "loc_14" },
      { coords: [37.37760, -5.98720], name: "Stop 13: Plaza de España — Bridge over the Canal", id: "loc_15" }         
    ]
  }
};

let lmmlMap = null;
let lmmlRouteLine = null;
let lmmlMarkers = [];

function initMap(narrativeKey) {
  if (typeof L === "undefined") { 
    console.error("Leaflet failed to load — the map cannot be drawn.");
    return;
  }

  if (lmmlMap === null) {
    lmmlMap = L.map("map-canvas", { zoomControl: false }).setView([37.3891, -5.9845], 11);
    L.control.zoom({ position: "bottomright" }).addTo(lmmlMap);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &middot; CARTO"
    }).addTo(lmmlMap);
  } 
  
  setTimeout(() => {
    lmmlMap.invalidateSize(true); 
    drawNarrativeRoute(narrativeKey);
  }, 400); 
}

function drawNarrativeRoute(narrativeKey) {
  const data = NARRATIVES_DATA[narrativeKey];
  if (!data) return;

  const statusSpan = $(".active-narrative-name");
  const descContainer = $("#map-narrative-desc");

  if (statusSpan) statusSpan.textContent = data.title;

  if (descContainer) {
    descContainer.innerHTML = "";
    const paragraphs = Array.isArray(data.desc) ? data.desc : [data.desc];
    paragraphs.forEach(textBlock => {
      const p = document.createElement("p");
      p.textContent = textBlock;
      descContainer.appendChild(p);
    });
  }

  if (lmmlRouteLine) lmmlMap.removeLayer(lmmlRouteLine);
  lmmlMarkers.forEach(m => lmmlMap.removeLayer(m));
  lmmlMarkers = [];

  const latlngs = data.stops.map(stop => stop.coords);
  
  if (latlngs.length === 0) return;

  lmmlRouteLine = L.polyline(latlngs, {
    color: data.color,
    weight: 3,
    dashArray: "6, 8",
    opacity: 0.8
  }).addTo(lmmlMap);

  data.stops.forEach(stop => {
    const marker = L.marker(stop.coords).addTo(lmmlMap);
    marker.bindPopup(`<strong>${stop.name}</strong>`);
    
    marker.on("mouseover", function () { this.openPopup(); });
    marker.on("mouseout", function () { this.closePopup(); });

    marker.on("click", function () {
      updateState("location", stop.id);          
      updateState("page", "visualization");      
    });

    lmmlMarkers.push(marker);
  });

  if (lmmlRouteLine && !lmmlRouteLine.isEmpty()) {
    lmmlMap.fitBounds(lmmlRouteLine.getBounds(), { 
      padding: [40, 40],
      animate: true,
      duration: 1.5, 
      easeLinearity: 0.25 
    });
  }
}

const LOCATION_CACHE = new Map();
let injectSeq = 0;   

//*Main injector (Updated for JSON-LD / Schema.org)*/
async function injectLocationData(locationId) {
  const seq = ++injectSeq;

  try {
    let stationData = LOCATION_CACHE.get(locationId);
    if (!stationData) {
      const response = await fetch(`data/${locationId}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${locationId}.json`);
      stationData = await response.json();
      LOCATION_CACHE.set(locationId, stationData);
    }
    
    if (seq !== injectSeq) return;   

    // 1. Header 
    put("#location-name", stationData["schema:name"]);

    // 2. Film credit
    const movieData = stationData["lmml:featuredIn"];
    const movieContextEl = document.getElementById("movie-context");

    if (movieContextEl) {
      if (movieData) {
        const movieName = movieData["schema:name"] || "";
        const yearRaw = movieData["schema:datePublished"];
        const year = yearRaw ? yearRaw.split("-")[0] : "";

        if (year) {
          movieContextEl.innerHTML = `<cite id="movie-title">${movieName}</cite> (<span id="movie-year">${year}</span>)`;
        } else {
          movieContextEl.innerHTML = `<cite id="movie-title">${movieName}</cite>`; 
        }
      } else {
        movieContextEl.innerHTML = ""; 
      }
    }

    // 3. Main paragraphs
    if (typeof injectLocationTexts === "function") {
      injectLocationTexts(stationData, AppState.tone, AppState.narrative);
    }

    // 4. Transition lines
    const routes = stationData["lmml:narrativeRouting"] || [];
    const activeRouteText = routes.find(
      route => route["lmml:narrativeId"]?.includes(AppState.narrative)
    );

    const transitionInEl = document.getElementById("transition-text");
    
    if (transitionInEl) {
      const transitionData = activeRouteText?.["lmml:transitionIn"]?.["schema:text"];
      
      if (transitionData) {
        transitionInEl.innerHTML = transitionData;
        transitionInEl.style.display = "block";
      } else {
        transitionInEl.style.display = "none";
      }
    }

    // 5. Metadata variables extraction
    const metadataTbody = document.querySelector("#metadata-table tbody");
    if (metadataTbody) {
      metadataTbody.innerHTML = "";
      
      const viewpoint = stationData["lmml:visitorViewpoint"];
      const geo = stationData["schema:geo"] || {};
      let shotLocation = "—";
      if (viewpoint?.["schema:latitude"]) {
        shotLocation = `${viewpoint["schema:latitude"]}, ${viewpoint["schema:longitude"]}`;
      } else if (geo?.["schema:latitude"]) {
        shotLocation = `${geo["schema:latitude"]}, ${geo["schema:longitude"]}`;
      }

      const filmShot = stationData["lmml:filmShot"];
      const cameraFacing = filmShot?.["lmml:cameraFacing"] || "—";

      const containedIn = stationData["schema:containedInPlace"];
      let constructionText = "—";
      let constructionSource = "—"; 
      
      if (containedIn?.["lmml:constructionPeriod"]) {
        const period = containedIn["lmml:constructionPeriod"];
        const start = period["lmml:start"] || "";
        const end = period["lmml:end"] || "";
        constructionText = start || end ? `${start}–${end}` : "—"; 
        constructionSource = period["lmml:source"] || "Historical Archive";
      }
      
      const isFree = stationData["schema:isAccessibleForFree"];
      let accessText = isFree === true ? "Free entry" : (isFree === false ? "Ticket required" : "—");

      const director = movieData?.["schema:director"]?.["schema:name"] || "—";
      const fictionalSetting = movieData?.["lmml:fictionalSetting"] || "—";
      const headingDegrees = filmShot?.["lmml:cameraHeadingDegrees"] ? `${filmShot["lmml:cameraHeadingDegrees"]}°` : "—";
      const municipality = containedIn?.["schema:containedInPlace"]?.["schema:name"] || "—";
      const featuredIn = movieData?.["schema:name"] || "—";

      const metaRows = [
        { property: "Municipality", value: municipality, source: "Map" },
        { property: "Featured In", value: featuredIn, source: "IMDb" },
        { property: "Shot Location", value: shotLocation, source: "LMML" },
        { property: "Camera Axis", value: headingDegrees, source: "LMML" }, 
        { property: "Camera Orientation", value: cameraFacing, source: "LMML" },
        { property: "Fictional setting", value: fictionalSetting, source: "IMDb" },
        { property: "Director", value: director, source: "IMDb" }, 
        { property: "Construction", value: constructionText, source: constructionSource },
        { property: "Access", value: accessText, source: "Official Site" } 
      ];

      // 6. Inject Metadata rows to HTML
      metaRows.forEach(row => {
        const tr = document.createElement("tr");
        const baseId = row.property.toLowerCase().replace(/\s+/g, '-'); 
        if (row.value.length > 20) {
          tr.classList.add("full-width");
        }
        tr.innerHTML = `
          <th scope="row">${row.property}</th>
          <td id="meta-${baseId}">${row.value}</td>
          <td id="meta-${baseId}-src">${row.source}</td> 
        `;
        metadataTbody.appendChild(tr);
      });
    }

    // 7. QR Code generation
    const qrContainer = document.getElementById("qr-code");
    const locationUrl = stationData["schema:url"];

    if (qrContainer) {
      if (locationUrl) {
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(locationUrl)}`;
        
        qrContainer.innerHTML = `
          <img src="${qrImageUrl}" alt="QR Code to more info" style="width: 56px; height: 56px; border: var(--hair-rule); background: var(--paper); padding: 4px;">
          <figcaption style="font-size: 0.54rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-soft); margin-top: 0.2rem;">Scan for more info</figcaption>
        `;
      } else {
        qrContainer.innerHTML = "";
      }
    }

    // 8. Media Rendering
    if (typeof renderMedia === "function") {
      renderMedia(stationData["schema:image"]);
    }

    // 9. Route-relative position + Prev/Next wiring
    if (typeof syncTourPosition === "function") syncTourPosition(locationId);
    if (typeof applyInkEffect === "function") applyInkEffect();
    if (typeof applyThemeDecorations === "function") applyThemeDecorations();

  } catch (err) {
    console.error(`[LMML] Could not load ${locationId}:`, err);
    if (seq !== injectSeq) return;
    
    const textContainer = document.getElementById("text-content");
    if (textContainer) {
      textContainer.innerHTML =
        "<p>The archive for this stop could not be opened. Please check that " +
        `<code>data/${locationId}.json</code> exists, and try again.</p>`;
    }
  }
}

/*Route-relative position, Prev/Next targets*/
function syncTourPosition(locationId) {
  const route = NARRATIVES_DATA[AppState.narrative];
  if (!route) return;

  const idx = route.stops.findIndex(s => s.id === locationId);
  const total = route.stops.length;
  const pos = idx >= 0 ? idx + 1 : "–";

  put("#stop-current", pos);
  put("#tour-pos-current", pos);
  put("#stop-total", total);
  put("#tour-pos-total", total);
  put("#narrative-name", route.title);

  const prevId = idx > 0 ? route.stops[idx - 1].id : "";
  const nextId = (idx >= 0 && idx < total - 1) ? route.stops[idx + 1].id : "";

  const prevBtn = $("#btn-prev");
  const nextBtn = $("#btn-next");
  if (prevBtn) { prevBtn.dataset.target = prevId; prevBtn.disabled = !prevId; }
  if (nextBtn) { nextBtn.dataset.target = nextId; nextBtn.disabled = !nextId; }
}

/*Images + Arrows*/
function renderMedia(mediaArray) {
  const mediaStrip   = document.getElementById("media-strip");
  const carousel     = document.getElementById("carousel-container");
  const activeVideo  = document.getElementById("active-video");

  if (mediaStrip) {
    mediaStrip.innerHTML = "";
    mediaStrip.style.display = "none"; 
  }
  if (carousel) carousel.innerHTML = ""; 

  const hasType = (m, t) => [].concat(m?.["@type"] || []).includes(t);
  const validMedia = (mediaArray || []).filter(m => m?.["schema:contentUrl"]);
  const videos = validMedia.filter(m => hasType(m, "schema:VideoObject"));
  const images = validMedia.filter(m => hasType(m, "schema:ImageObject"));

  if (activeVideo) {
    if (videos.length > 0) {
      activeVideo.src = videos[0]["schema:contentUrl"];
    } else {
      activeVideo.pause();
      activeVideo.removeAttribute("src");
      activeVideo.load(); 
    }
  }

  if (!carousel || images.length === 0) return;

  let current = 0;
  const total = images.length;

  const slides = images.map((imgData, index) => {
    const img = document.createElement("img");
    img.className = "carousel-img";
    img.src = imgData["schema:contentUrl"];
    img.alt = "Historical view";
    
    img.addEventListener("click", () => {
      if (current !== index) { 
        current = index;
        updateCarousel();
      }
    });

    return img;
  });

  carousel.append(...slides);

  const updateCarousel = () => {
    slides.forEach((img, index) => {
      img.className = "carousel-img"; 
      
      if (total === 1) {
        if (index === current) img.classList.add("active");
        
      } else if (total === 2) {
        if (index === current) {
          img.classList.add("active");
        } else {
          img.classList.add(current === 0 ? "next" : "prev");
        }
        
      } else {
        if (index === current) {
          img.classList.add("active");
        } else if (index === (current - 1 + total) % total) {
          img.classList.add("prev");
        } else if (index === (current + 1) % total) {
          img.classList.add("next");
        }
      }
    });
  };

  updateCarousel();

  if (total > 1 && mediaStrip) {
    mediaStrip.style.display = "flex"; 
    
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "nav-arrow prev-arrow";
    prevBtn.innerHTML = "❮";
    
    prevBtn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      current = (current - 1 + total) % total;
      updateCarousel();
    });

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "nav-arrow next-arrow";
    nextBtn.innerHTML = "❯";
    
    nextBtn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      current = (current + 1) % total;
      updateCarousel();
    });

    mediaStrip.appendChild(prevBtn);
    mediaStrip.appendChild(nextBtn);
  }
} 

/*Swiss Grid Elements*/
function applyThemeDecorations() {
  document.querySelectorAll('.swiss-cross-global').forEach(el => el.remove());

  if (AppState.theme === "late-xx-century") {
    
    const visView = document.querySelector('.view[data-view="visualization"]');
    
    if (visView) {
      const numCrosses = Math.random() > 0.5 ? 2 : 1; 
      const usedPositions = new Set(); 

      for (let i = 0; i < numCrosses; i++) {
        let randomPos;
        
        do {
          randomPos = Math.floor(Math.random() * 5) + 1;
        } while (usedPositions.has(randomPos));
        usedPositions.add(randomPos);

        const cross = document.createElement("div");
        cross.innerHTML = Math.random() > 0.4 ? "+++" : "++"; 
        cross.className = `swiss-cross-global page-cross-${randomPos}`;
        
        visView.appendChild(cross);
      }
    }
  }
}

function applyInkEffect() {
  if (AppState.theme !== "early-print") return;

  const textElements = document.querySelectorAll(
    '[data-view="visualization"] header, #text-content, #metadata-viewer, #transition-text, #carousel-container, #active-video'
  );
  
  if (textElements.length === 0) return;

  textElements.forEach(el => {
    el.classList.add('ink-dry-effect');
    el.classList.remove('dried');
    void el.offsetWidth; 
  });
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      textElements.forEach(el => {
        el.classList.add('dried');
      });
    });
  });
}

function injectLocationTexts(locationData, currentPersona, currentNarrative) {
  if (!locationData?.["lmml:textMatrix"]) return;

  const textArray = locationData["lmml:textMatrix"];

  const matchingTextObj = textArray.find(
    (item) => 
      item["lmml:tone"] === currentPersona && 
      item["lmml:targetNarrative"]?.includes(currentNarrative)
  );

  const micro = matchingTextObj?.["lmml:microText"] || "";
  const summaryRaw = matchingTextObj?.["lmml:summaryText"] || "Data not available for this combination of narrative and persona.";
  const detailedRaw = matchingTextObj?.["lmml:detailedText"] || "";

  let combinedSummaryHTML = "";
  if (micro) {
    combinedSummaryHTML += `<p class="micro-hook" style="font-weight: 600; margin-bottom: 0.8rem;">${micro}</p>`;
  }
  combinedSummaryHTML += `<p>${summaryRaw}</p>`;

  const formattedDetailed = detailedRaw.replace(/\r?\n\r?\n/g, "<br><br>");

  const summaryEl = document.getElementById("dynamic-summary-text");
  const detailedEl = document.getElementById("dynamic-detailed-text");
  
  if (summaryEl) summaryEl.innerHTML = combinedSummaryHTML;
  if (detailedEl) detailedEl.innerHTML = formattedDetailed;
  
  const expandBtn = document.getElementById("read-more-btn");
  const detailedContainer = document.getElementById("dynamic-detailed-container");
  
  if (expandBtn && detailedContainer) {
    if (!detailedRaw.trim()) {
      expandBtn.style.display = "none";
    } else {
      expandBtn.style.display = "flex";
    }

    detailedContainer.classList.remove("expanded");
    
    if (expandBtn.style.display !== "none") {
        const arrow = expandBtn.querySelector(".arrow");
        const btnText = expandBtn.querySelector(".btn-text");
        if (arrow) arrow.innerHTML = "▼";
        if (btnText) btnText.textContent = "Read More";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loupe = document.getElementById("magnifying-loupe");
  const carouselContainer = document.getElementById("carousel-container");
  
  if (!loupe || !carouselContainer) return;

  loupe.style.filter = "grayscale(100%) contrast(1.5)";

  const isTouchDevice = window.matchMedia("(pointer: coarse)");
  let ticking = false; 

  carouselContainer.addEventListener("mousemove", (e) => {
    if (isTouchDevice.matches || AppState.theme !== 'late-xx-century') {
      if (loupe.style.display !== 'none') loupe.style.display = 'none';
      return;
    }

    const activeImg = carouselContainer.querySelector(".carousel-img.active");
    if (!activeImg) return;

    if (loupe.style.display !== 'block') loupe.style.display = 'block';

    if (!ticking) {
      window.requestAnimationFrame(() => {
        const rect = activeImg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        loupe.style.transform = `translate(${e.pageX - loupe.offsetWidth / 2}px, ${e.pageY - loupe.offsetHeight / 2}px)`;

        const bgUrl = `url("${activeImg.src}")`;
        if (loupe.style.backgroundImage !== bgUrl) {
            loupe.style.backgroundImage = bgUrl;
            loupe.style.backgroundSize = `${rect.width * 1.5}px ${rect.height * 1.7}px`; 
        }
        
        loupe.style.backgroundPosition = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`;
        
        ticking = false;
      });
      ticking = true;
    }
  });

  carouselContainer.addEventListener("mouseleave", () => {
    loupe.style.display = 'none';
  });
});