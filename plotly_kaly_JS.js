// Boston Shootings by District (Top 5 highlight + filters + selection unfade)
//
// Adds/fixes:
// - When choosing a single district from dropdown, it becomes FULL opacity + thicker line.
// - "Top 5 only" also shows those at full opacity.
// - "All districts" keeps Top 5 emphasized and others faded.

const shootingData = {
  'North End    ': [13.0, 11.0, 14.0, 2.0],
  'Charlestown  ': [2.0, 9.0, 4.0, 1.0],
  'East Boston  ': [13.0, 8.0, 7.0, 0.0],
  'Roxbury      ': [150.0, 109.0, 135.0, 18.0],
  'Mattapan     ': [150.0, 104.0, 147.0, 16.0],
  'Dorchester   ': [131.0, 103.0, 87.0, 11.0],
  'South Boston ': [22.0, 20.0, 15.0, 3.0],
  'Allston      ': [11.0, 11.0, 18.0, 0.0],
  'Back Bay     ': [34.0, 19.0, 30.0, 1.0],
  'Jamaica Plain': [55.0, 36.0, 24.0, 1.0],
  'Hyde Park    ': [41.0, 34.0, 34.0, 0.0],
  'Roslindale   ': [13.0, 20.0, 18.0, 5.0],
  'External': [1.0, 0.0, 2.0, 0.0]
};

const yearsHistorical = [2023, 2024, 2025];
const yearsCurrent = [2025, 2026];

const colors = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#393b79', '#637939', '#8c6d31'
];

// ---------- helpers ----------
function topNDistrictsByIndexValue(dataObj, valueIndex, n) {
  return Object.keys(dataObj)
    .map((k) => ({ key: k, value: Number(dataObj[k][valueIndex]) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .map((d) => d.key);
}

const districtKeys = Object.keys(shootingData);
const top5Keys = topNDistrictsByIndexValue(shootingData, 2, 5); // based on 2025
const top5Set = new Set(top5Keys);

// Two traces per district -> keep indices
const allTraces = [];
const traceIndexByDistrict = {}; // { key: { solid, dotted } }

districtKeys.forEach((districtKey, idx) => {
  const values = shootingData[districtKey];
  const color = colors[idx % colors.length];
  const isTop = top5Set.has(districtKey);

  // Default styling for "All" view
  const baseOpacity = isTop ? 1.0 : 0.18;
  const baseWidth = isTop ? 4 : 2;
  const baseMarkerSize = isTop ? 7 : 5;

  const solidTrace = {
    x: yearsHistorical,
    y: [values[0], values[1], values[2]],
    name: districtKey.trim(),
    mode: 'lines+markers',
    line: { color, width: baseWidth },
    opacity: baseOpacity,
    marker: { size: baseMarkerSize },
    legendgroup: districtKey.trim()
  };

  const dottedTrace = {
    x: yearsCurrent,
    y: [values[2], values[3]],
    mode: 'lines+markers',
    showlegend: false,
    hoverinfo: 'skip',
    line: { color, width: baseWidth, dash: 'dot' },
    opacity: baseOpacity,
    marker: { size: baseMarkerSize },
    legendgroup: districtKey.trim()
  };

  const solidIndex = allTraces.length;
  allTraces.push(solidTrace);
  const dottedIndex = allTraces.length;
  allTraces.push(dottedTrace);

  traceIndexByDistrict[districtKey] = { solid: solidIndex, dotted: dottedIndex };
});

// Visibility builders
function visibilityAll() {
  return allTraces.map(() => true);
}

function visibilityTop5Only() {
  const vis = allTraces.map(() => false);
  top5Keys.forEach((k) => {
    const { solid, dotted } = traceIndexByDistrict[k];
    vis[solid] = true;
    vis[dotted] = true;
  });
  return vis;
}

function visibilitySingleDistrict(districtKey) {
  const vis = allTraces.map(() => false);
  const { solid, dotted } = traceIndexByDistrict[districtKey];
  vis[solid] = true;
  vis[dotted] = true;
  return vis;
}

// ---- NEW: style builders (opacity/width/marker) ----
function styleAllWithTopHighlight() {
  // Keep Top 5 strong, others faded (matches initial traces)
  const opacities = [];
  const widths = [];
  const sizes = [];

  districtKeys.forEach((k) => {
    const isTop = top5Set.has(k);
    const o = isTop ? 1.0 : 0.18;
    const w = isTop ? 4 : 2;
    const s = isTop ? 7 : 5;

    // apply to BOTH traces for that district
    opacities.push(o, o);
    widths.push(w, w);
    sizes.push(s, s);
  });

  return { opacities, widths, sizes };
}

function styleTop5OnlyFull() {
  // Top 5 full + thick (others hidden anyway, but keep consistent)
  const opacities = allTraces.map(() => 1.0);
  const widths = allTraces.map(() => 4);
  const sizes = allTraces.map(() => 7);
  return { opacities, widths, sizes };
}

function styleSingleDistrictFull(districtKey) {
  // The selected district is full + thick.
  // (Others are hidden via visibility, but we still set arrays cleanly.)
  const opacities = allTraces.map(() => 1.0);
  const widths = allTraces.map(() => 4);
  const sizes = allTraces.map(() => 7);

  // If you ever switch to "not hiding others", you could fade others here.
  // For now we just ensure selected district is definitely not faded.
  const { solid, dotted } = traceIndexByDistrict[districtKey];
  opacities[solid] = 1.0; opacities[dotted] = 1.0;
  widths[solid] = 4; widths[dotted] = 4;
  sizes[solid] = 7; sizes[dotted] = 7;

  return { opacities, widths, sizes };
}

// Dropdown buttons
const dropdownButtons = [];

// Button: All districts (Top 5 highlighted)
{
  const st = styleAllWithTopHighlight();
  dropdownButtons.push({
    label: 'All districts (Top 5 highlighted)',
    method: 'update',
    args: [
      {
        visible: visibilityAll(),
        opacity: st.opacities,
        'line.width': st.widths,
        'marker.size': st.sizes
      },
      {
        title: { text: 'Boston Shootings by District (Top 5 Highlighted, 2026 YTD Dotted)', x: 0.5 }
      }
    ]
  });
}

// Button: Top 5 only
{
  const st = styleTop5OnlyFull();
  dropdownButtons.push({
    label: 'Top 5 only',
    method: 'update',
    args: [
      {
        visible: visibilityTop5Only(),
        opacity: st.opacities,
        'line.width': st.widths,
        'marker.size': st.sizes
      },
      {
        title: { text: 'Boston Shootings by District (Top 5 Only, 2026 YTD Dotted)', x: 0.5 }
      }
    ]
  });
}

// Buttons: single district
districtKeys.forEach((k) => {
  const st = styleSingleDistrictFull(k);
  dropdownButtons.push({
    label: k.trim(),
    method: 'update',
    args: [
      {
        visible: visibilitySingleDistrict(k),
        opacity: st.opacities,
        'line.width': st.widths,
        'marker.size': st.sizes
      },
      {
        title: { text: `Boston Shootings — ${k.trim()} (2026 YTD Dotted)`, x: 0.5 }
      }
    ]
  });
});

// Layout
const layout = {
  title: { text: 'Boston Shootings by District (Top 5 Highlighted, 2026 YTD Dotted)', x: 0.5 },

  xaxis: { title: { text: 'Year' }, dtick: 1 },
  yaxis: { title: { text: 'Number of Shootings' }, rangemode: 'tozero' },

  hovermode: 'closest',

  legend: {
    title: { text: 'Districts' },
    orientation: 'h',
    y: -0.25,
    x: 0.5,
    xanchor: 'center'
  },

  updatemenus: [
    {
      type: 'dropdown',
      direction: 'down',
      x: 0.0,
      y: 1.18,
      xanchor: 'left',
      yanchor: 'top',
      showactive: true,
      buttons: dropdownButtons
    }
  ],

  annotations: [
    {
      x: 2026,
      y: 1,
      xref: 'x',
      yref: 'paper',
      text: '2026 is YTD (dotted segment)',
      showarrow: false,
      xanchor: 'right',
      yanchor: 'bottom'
    }
  ],

  margin: { t: 90, b: 110, l: 70, r: 30 }
};

// Render
Plotly.newPlot('myDiv', allTraces, layout, { responsive: true });
document.title = 'Boston Shootings by District';