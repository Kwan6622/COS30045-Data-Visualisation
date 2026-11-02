/******************************************************************************/
/* Global Incarceration Rates — Shared Constants, Taxonomy, Blocs & State     */
/******************************************************************************/

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 560;
const MAP_MARGIN = { top: 14, right: 16, bottom: 14, left: 16 };
const ZOOM_SCALE_EXTENT = [1, 16];
const MIN_HIT_RADIUS_PX = 4;
const GLOBAL_MEDIAN_RATE = 145;
const US_BENCHMARK_RATE = 542;

const NO_DATA_COLORS = {
    lightBase: "#E2E8F0",
    lightStroke: "#94A3B8",
    darkBase: "#2D3748",
    darkStroke: "#64748B"
};

/**
 * Five-step choropleth bucket definitions synchronized with 5-color ramps,
 * preceded by the No Data bucket.
 */
const RATE_BUCKETS = [
    { key: "no-data", label: "No data", min: null, max: null, colorIndex: null, patternId: "pattern-no-data" },
    { key: "0-99", label: "0–99", min: 0, max: 99, colorIndex: 0 },
    { key: "100-199", label: "100–199", min: 100, max: 199, colorIndex: 1 },
    { key: "200-299", label: "200–299", min: 200, max: 299, colorIndex: 2 },
    { key: "300-499", label: "300–499", min: 300, max: 499, colorIndex: 3 },
    { key: "500-plus", label: "500+", min: 500, max: Infinity, colorIndex: 4 }
];

/**
 * Centralized 5-step choropleth palettes.
 */
const PALETTES = {
    default: {
        name: "Default Palette",
        // 0-99 (lightest) -> 500+ (darkest)
        colors: ["#f8c3ab", "#fcaa8d", "#FB6A4A", "#DE2D26", "#A50F15"],
        textDarkUntilStep: 2, // Steps 0, 1, 2 use dark text; 3, 4 use light text
        accent: "#DE2D26",
        accentDark: "#FCAE91",
        barDefault: "#DE2D26",
        barHover: "#A50F15",
        barSelected: "#A50F15"
    },
    colorblind: {
        name: "Colorblind Mode",
        colors: ["#FEE838", "#BCAF6F", "#7C7B78", "#35456C", "#00224E"],
        textDarkUntilStep: 2,
        accent: "#35456C",
        accentDark: "#BCAF6F",
        barDefault: "#35456C",
        barHover: "#00224E",
        barSelected: "#00224E"
    }
};

const CONTINENT_OPTIONS = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania", "Antarctica"];

const BLOC_OPTIONS = [
    { key: "all", label: "All / Reset" },
    { key: "NATO", label: "NATO" },
    { key: "Post-Soviet States", label: "Post-Soviet States" },
    { key: "Former Yugoslavia", label: "Former Yugoslavia" },
    { key: "OECD", label: "OECD" },
    { key: "ASEAN", label: "ASEAN" }
];

const RATE_RANGE_OPTIONS = [
    { key: "all", label: "All" },
    { key: "under-100", label: "< 100" },
    { key: "100-300", label: "100–300" },
    { key: "300-600", label: "300–600" },
    { key: "600-plus", label: "600+" }
];

const JURISDICTION_TYPE_OPTIONS = [
    { key: "all", label: "All" },
    { key: "sovereign", label: "Sovereign Nations Only" },
    { key: "constituent", label: "Constituent Jurisdictions" },
    { key: "overseas_autonomous", label: "Overseas Territories & Dependencies" }
];

const SORT_OPTIONS = [
    { key: "highest", label: "Highest Rate" },
    { key: "lowest", label: "Lowest Rate" },
    { key: "alphabetical", label: "Alphabetical (A–Z)" }
];

/**
 * Default mapping configuration (synchronized with data/jurisdiction_mapping.json).
 */
const DEFAULT_MAPPING_CONFIG = {
    version: "0.3.0",
    countryToIso: {
        "El Salvador": "SLV", "Cuba": "CUB", "Turkmenistan": "TKM", "United States of America": "USA",
        "American Samoa  (USA)": "ASM", "Guam  (USA)": "GUM", "Panama": "PAN", "Tonga": "TON",
        "Türkiye/Turkey": "TUR", "Rwanda": "RWA", "Cape Verde  (Cabo Verde)": "CPV", "Uruguay": "URY",
        "Brazil": "BRA", "Thailand": "THA", "Virgin Islands (United Kingdom)": "VGB",
        "Antigua and Barbuda": "ATG", "Cambodia": "KHM", "Eswatini/Swaziland": "SWZ",
        "Costa Rica": "CRI", "Palau": "PLW", "St. Vincent and the Grenadines": "VCT",
        "Seychelles": "SYC", "Dominica": "DMA", "Belarus": "BLR", "Nauru": "NRU", "Bahamas": "BHS",
        "Nicaragua": "NIC", "Chile": "CHL", "Grenada": "GRD", "Namibia": "NAM", "Georgia": "GEO",
        "St. Lucia": "LCA", "Peru": "PER", "Northern Mariana Islands  (USA)": "MNP",
        "Martinique  (France)": "MTQ", "St. Kitts and Nevis": "KNA", "Belize": "BLZ",
        "Greenland (Denmark)": "GRL", "Guyana": "GUY", "Argentina": "ARG",
        "French Guiana/Guyane (France)": "GUF", "Taiwan": "TWN",
        "Cayman Islands  (United Kingdom)": "CYM", "Trinidad and Tobago": "TTO",
        "South Africa": "ZAF", "Gibraltar  (United Kingdom)": "GIB", "Azerbaijan": "AZE",
        "Libya": "LBY", "Tunisia": "TUN", "Bermuda (United Kingdom)": "BMU", "Bolivia": "BOL",
        "Paraguay": "PRY", "Curaçao (Netherlands)": "CUW", "Guadeloupe  (France)": "GLP",
        "Moldova (Republic of)": "MDA", "French Polynesia  (France)": "PYF", "Morocco": "MAR",
        "Virgin Islands (USA)": "VIR", "Malaysia": "MYS", "Jordan": "JOR", "Mauritius": "MUS",
        "Anguilla (United Kingdom)": "AIA", "Barbados": "BRB", "Bahrain": "BHR",
        "Aruba  (Netherlands)": "ABW", "Fiji": "FJI", "Iran": "IRN", "Gabon": "GAB",
        "Maldives": "MDV", "Dominican Republic": "DOM", "Algeria": "DZA", "Israel": "ISR",
        "New Zealand": "NZL", "Ecuador": "ECU", "Hungary": "HUN", "Mayotte (France)": "MYT",
        "Mexico": "MEX", "Montenegro": "MNE", "Venezuela": "VEN", "Russian Federation": "RUS",
        "Sint Maarten (Netherlands)": "SXM", "Colombia": "COL", "Poland": "POL",
        "Kazakhstan": "KAZ", "Latvia": "LVA", "Honduras": "HND", "New Caledonia  (France)": "NCL",
        "Isle of Man  (United Kingdom)": "IMN", "Macau  (China)": "MAC",
        "Myanmar (formerly Burma)": "MMR", "Reunion (France)": "REU", "Samoa": "WSM",
        "Singapore": "SGP", "Puerto Rico  (USA)": "PRI", "Czechia/Czech Republic": "CZE",
        "Serbia": "SRB", "Australia": "AUS", "Jersey  (United Kingdom)": "JEY", "Sri Lanka": "LKA",
        "Laos": "LAO", "Mongolia": "MNG", "Albania": "ALB", "Botswana": "BWA", "Zimbabwe": "ZWE",
        "Cook Islands  (New Zealand)": "COK", "Uganda": "UGA", "Lithuania": "LTU",
        "Slovakia": "SVK", "United Kingdom: Scotland": "GBR-SCT", "Philippines": "PHL",
        "North Macedonia": "MKD", "Bhutan": "BTN", "Tajikistan": "TJK", "Iraq": "IRQ",
        "Benin": "BEN", "Brunei Darussalam": "BRN", "Lebanon": "LBN", "Hong Kong  (China)": "HKG",
        "Romania": "ROU", "United Kingdom: England and Wales": "GBR", "Saudi Arabia": "SAU",
        "Zambia": "ZMB", "Greece": "GRC", "Guernsey  (United Kingdom)": "GGY", "Vietnam": "VNM",
        "Suriname": "SUR", "France": "FRA", "Estonia": "EST", "Sao Tome e Principe": "STP",
        "Croatia": "HRV", "Micronesia, Federated States of": "FSM", "Spain": "ESP",
        "Jamaica": "JAM", "Republic of (South) Korea": "KOR", "Guatemala": "GTM",
        "Portugal": "PRT", "Malta": "MLT", "China": "CHN", "Cameroon": "CMR",
        "United Kingdom: Northern Ireland": "GBR-NIR", "Lesotho": "LSO",
        "Cyprus (Republic of)": "CYP", "Egypt": "EGY", "Kiribati": "KIR", "Kyrgyzstan": "KGZ",
        "Belgium": "BEL", "Italy": "ITA", "Luxembourg": "LUX", "Tuvalu": "TUV", "Sweden": "SWE",
        "Austria": "AUT", "United Arab Emirates": "ARE", "Kenya": "KEN", "Kuwait": "KWT",
        "Ethiopia": "ETH", "Ireland, Republic of": "IRL", "Kosovo/Kosova": "XKX",
        "Monaco": "MCO", "Canada": "CAN", "Indonesia": "IDN", "Madagascar": "MDG",
        "Ukraine": "UKR", "Cote d'Ivoire": "CIV", "Armenia": "ARM", "Burundi": "BDI",
        "Nepal": "NPL", "Uzbekistan": "UZB", "Bulgaria": "BGR", "Andorra": "AND",
        "Malawi": "MWI", "Switzerland": "CHE", "Denmark": "DNK", "Solomon Islands": "SLB",
        "Senegal": "SEN", "Djibouti": "DJI", "Netherlands": "NLD", "Finland": "FIN",
        "Germany": "DEU", "Qatar": "QAT", "Slovenia": "SVN", "Vanuatu": "VUT",
        "Marshall Islands": "MHL", "Liberia": "LBR", "Angola": "AGO", "Equatorial Guinea": "GNQ",
        "San Marino": "SMR", "Bangladesh": "BGD", "Syria": "SYR", "Haiti": "HTI", "Togo": "TGO",
        "South Sudan": "SSD", "Mauritania": "MRT", "Papua New Guinea": "PNG", "Chad": "TCD",
        "Niger": "NER", "Timor-Leste (formerly East Timor)": "TLS", "Afghanistan": "AFG",
        "Norway": "NOR", "Central African Republic": "CAF", "Sudan": "SDN", "Mozambique": "MOZ",
        "Sierra Leone": "SLE", "Bosnia and Herzegovina: Federation": "BIH", "Mali": "MLI",
        "Bosnia and Herzegovina: Republika Srpska": "BIH-SRP", "Democratic Republic of Congo": "COD",
        "Comoros": "COM", "Oman": "OMN", "Pakistan": "PAK", "Ghana": "GHA",
        "Guinea (Republic of)": "GIN", "Burkina Faso": "BFA", "Nigeria": "NGA", "India": "IND",
        "Iceland": "ISL", "Tanzania": "TZA", "Japan": "JPN", "Guinea Bissau": "GNB",
        "Congo (Republic of)": "COG", "Liechtenstein": "LIE", "Faeroe Islands  (Denmark)": "FRO",
        "Gambia": "GMB", "Somalia (Federal Republic of)": "SOM", "Yemen": "YEM",
        "North Korea": "PRK", "Eritrea": "ERI", "Palestine": "PSE", "Vatican City": "VAT",
        "Turks and Caicos Islands  (United Kingdom)": "TCA",
        "Montserrat  (United Kingdom)": "MSR", "Falkland Islands  (United Kingdom)": "FLK",
        "Saint Helena, Ascension and Tristan da Cunha  (United Kingdom)": "SHN",
        "Pitcairn Islands  (United Kingdom)": "PCN",
        "British Indian Ocean Territory  (United Kingdom)": "IOT",
        "Akrotiri and Dhekelia  (United Kingdom)": "XAD",
        "South Georgia and the South Sandwich Islands  (United Kingdom)": "SGS",
        "Saint Martin  (France)": "MAF", "Saint Barthélemy  (France)": "BLM",
        "Saint Pierre and Miquelon  (France)": "SPM", "Wallis and Futuna  (France)": "WLF",
        "French Southern and Antarctic Lands  (France)": "ATF",
        "Bonaire, Sint Eustatius and Saba  (Netherlands)": "BES",
        "Niue  (New Zealand)": "NIU", "Tokelau  (New Zealand)": "TKL",
        "Norfolk Island  (Australia)": "NFK", "Christmas Island  (Australia)": "CXR",
        "Cocos (Keeling) Islands  (Australia)": "CCK", "Åland Islands  (Finland)": "ALA",
        "Svalbard and Jan Mayen  (Norway)": "SJM",
        "United States Minor Outlying Islands  (USA)": "UMI",
        "Western Sahara": "ESH", "Somaliland": "XSO", "Northern Cyprus": "XNC",
        "Transnistria": "XTR", "Abkhazia": "XAB", "South Ossetia": "XOS"
    },
    taxonomy: {
        overseasAutonomousIsos: [
            "GUF", "GLP", "MTQ", "MYT", "REU", "PYF", "NCL", "MAF", "BLM", "SPM", "WLF", "ATF",
            "BMU", "CYM", "VGB", "GIB", "AIA", "MSR", "TCA", "FLK", "SHN", "JEY", "GGY", "IMN", "PCN", "IOT", "SGS", "XAD",
            "PRI", "GUM", "VIR", "ASM", "MNP", "UMI",
            "ABW", "CUW", "SXM", "BES",
            "GRL", "FRO",
            "HKG", "MAC",
            "COK", "NIU", "TKL",
            "NFK", "CXR", "CCK", "ALA", "SJM", "ESH"
        ],
        constituentIsos: ["GBR", "GBR-SCT", "GBR-NIR", "BIH", "BIH-SRP"]
    },
    blocMemberships: {
        "NATO": ["ALB", "BEL", "BGR", "CAN", "HRV", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "ITA", "LVA", "LTU", "LUX", "MNE", "NLD", "MKD", "NOR", "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE", "TUR", "GBR", "USA"],
        "Post-Soviet States": ["ARM", "AZE", "BLR", "EST", "GEO", "KAZ", "KGZ", "LVA", "LTU", "MDA", "RUS", "TJK", "TKM", "UKR", "UZB"],
        "Former Yugoslavia": ["BIH", "HRV", "XKX", "MNE", "MKD", "SRB", "SVN"],
        "OECD": ["AUS", "AUT", "BEL", "CAN", "CHL", "COL", "CRI", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ISR", "ITA", "JPN", "KOR", "LVA", "LTU", "LUX", "MEX", "NLD", "NZL", "NOR", "POL", "PRT", "SVK", "SVN", "ESP", "SWE", "CHE", "TUR", "GBR", "USA"],
        "ASEAN": ["BRN", "KHM", "IDN", "LAO", "MYS", "MMR", "PHL", "SGP", "THA", "VNM"]
    },
    atlasIdToIso: {
        "004": "AFG", "008": "ALB", "012": "DZA", "024": "AGO", "032": "ARG",
        "051": "ARM", "036": "AUS", "040": "AUT", "031": "AZE", "044": "BHS",
        "050": "BGD", "112": "BLR", "056": "BEL", "084": "BLZ", "204": "BEN",
        "064": "BTN", "068": "BOL", "070": "BIH", "072": "BWA", "076": "BRA",
        "096": "BRN", "100": "BGR", "854": "BFA", "108": "BDI", "116": "KHM",
        "120": "CMR", "124": "CAN", "140": "CAF", "148": "TCD", "152": "CHL",
        "156": "CHN", "170": "COL", "178": "COG", "180": "COD", "188": "CRI",
        "384": "CIV", "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE",
        "208": "DNK", "262": "DJI", "214": "DOM", "218": "ECU", "818": "EGY",
        "222": "SLV", "226": "GNQ", "232": "ERI", "233": "EST", "748": "SWZ",
        "231": "ETH", "238": "FLK", "242": "FJI", "246": "FIN", "250": "FRA",
        "254": "GUF", "260": "ATF", "266": "GAB", "270": "GMB", "268": "GEO",
        "276": "DEU", "288": "GHA", "300": "GRC", "304": "GRL", "320": "GTM",
        "324": "GIN", "624": "GNB", "328": "GUY", "332": "HTI", "340": "HND",
        "348": "HUN", "352": "ISL", "356": "IND", "360": "IDN", "364": "IRN",
        "368": "IRQ", "372": "IRL", "376": "ISR", "380": "ITA", "388": "JAM",
        "392": "JPN", "400": "JOR", "398": "KAZ", "404": "KEN", "408": "PRK",
        "410": "KOR", "414": "KWT", "417": "KGZ", "418": "LAO", "428": "LVA",
        "422": "LBN", "426": "LSO", "430": "LBR", "434": "LBY", "440": "LTU",
        "442": "LUX", "450": "MDG", "454": "MWI", "458": "MYS", "466": "MLI",
        "478": "MRT", "484": "MEX", "498": "MDA", "496": "MNG", "499": "MNE",
        "504": "MAR", "508": "MOZ", "104": "MMR", "516": "NAM", "524": "NPL",
        "528": "NLD", "540": "NCL", "554": "NZL", "558": "NIC", "562": "NER",
        "566": "NGA", "807": "MKD", "578": "NOR", "512": "OMN", "586": "PAK",
        "275": "PSE", "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER",
        "608": "PHL", "616": "POL", "620": "PRT", "630": "PRI", "634": "QAT",
        "642": "ROU", "643": "RUS", "646": "RWA", "682": "SAU", "686": "SEN",
        "688": "SRB", "694": "SLE", "703": "SVK", "705": "SVN", "090": "SLB",
        "706": "SOM", "710": "ZAF", "728": "SSD", "724": "ESP", "144": "LKA",
        "729": "SDN", "740": "SUR", "744": "SJM", "752": "SWE", "756": "CHE",
        "760": "SYR", "158": "TWN", "762": "TJK", "834": "TZA", "764": "THA",
        "626": "TLS", "768": "TGO", "780": "TTO", "788": "TUN", "792": "TUR",
        "795": "TKM", "800": "UGA", "804": "UKR", "784": "ARE", "826": "GBR",
        "840": "USA", "858": "URY", "860": "UZB", "548": "VUT", "862": "VEN",
        "704": "VNM", "732": "ESH", "887": "YEM", "894": "ZMB", "716": "ZWE"
    },
    atlasNameToIso: {
        "Afghanistan": "AFG", "Albania": "ALB", "Algeria": "DZA", "Angola": "AGO",
        "Argentina": "ARG", "Armenia": "ARM", "Australia": "AUS", "Austria": "AUT",
        "Azerbaijan": "AZE", "Bahamas": "BHS", "Bangladesh": "BGD", "Belarus": "BLR",
        "Belgium": "BEL", "Belize": "BLZ", "Benin": "BEN", "Bhutan": "BTN",
        "Bolivia": "BOL", "Bosnia and Herz.": "BIH", "Botswana": "BWA", "Brazil": "BRA",
        "Brunei": "BRN", "Bulgaria": "BGR", "Burkina Faso": "BFA", "Burundi": "BDI",
        "Cambodia": "KHM", "Cameroon": "CMR", "Canada": "CAN", "Central African Rep.": "CAF",
        "Chad": "TCD", "Chile": "CHL", "China": "CHN", "Colombia": "COL", "Congo": "COG",
        "Dem. Rep. Congo": "COD", "Costa Rica": "CRI", "Côte d'Ivoire": "CIV",
        "Cote d'Ivoire": "CIV", "Croatia": "HRV", "Cuba": "CUB", "Cyprus": "CYP",
        "N. Cyprus": "XNC", "Czechia": "CZE", "Denmark": "DNK", "Djibouti": "DJI",
        "Dominican Rep.": "DOM", "Ecuador": "ECU", "Egypt": "EGY", "El Salvador": "SLV",
        "Eq. Guinea": "GNQ", "Eritrea": "ERI", "Estonia": "EST", "eSwatini": "SWZ",
        "Eswatini": "SWZ", "Ethiopia": "ETH", "Falkland Is.": "FLK", "Fiji": "FJI",
        "Finland": "FIN", "France": "FRA", "French Guiana": "GUF",
        "Fr. S. Antarctic Lands": "ATF", "Gabon": "GAB", "Gambia": "GMB", "Georgia": "GEO",
        "Germany": "DEU", "Ghana": "GHA", "Greece": "GRC", "Greenland": "GRL",
        "Guatemala": "GTM", "Guinea": "GIN", "Guinea-Bissau": "GNB", "Guyana": "GUY",
        "Haiti": "HTI", "Honduras": "HND", "Hungary": "HUN", "Iceland": "ISL",
        "India": "IND", "Indonesia": "IDN", "Iran": "IRN", "Iraq": "IRQ", "Ireland": "IRL",
        "Israel": "ISR", "Italy": "ITA", "Jamaica": "JAM", "Japan": "JPN", "Jordan": "JOR",
        "Kazakhstan": "KAZ", "Kenya": "KEN", "Kosovo": "XKX", "Kuwait": "KWT",
        "Kyrgyzstan": "KGZ", "Laos": "LAO", "Latvia": "LVA", "Lebanon": "LBN",
        "Lesotho": "LSO", "Liberia": "LBR", "Libya": "LBY", "Lithuania": "LTU",
        "Luxembourg": "LUX", "Madagascar": "MDG", "Malawi": "MWI", "Malaysia": "MYS",
        "Mali": "MLI", "Mauritania": "MRT", "Mexico": "MEX", "Moldova": "MDA",
        "Mongolia": "MNG", "Montenegro": "MNE", "Morocco": "MAR", "Mozambique": "MOZ",
        "Myanmar": "MMR", "Namibia": "NAM", "Nepal": "NPL", "Netherlands": "NLD",
        "New Caledonia": "NCL", "New Zealand": "NZL", "Nicaragua": "NIC", "Niger": "NER",
        "Nigeria": "NGA", "North Korea": "PRK", "North Macedonia": "MKD",
        "Macedonia": "MKD", "Norway": "NOR", "Oman": "OMN", "Pakistan": "PAK",
        "Palestine": "PSE", "Panama": "PAN", "Papua New Guinea": "PNG", "Paraguay": "PRY",
        "Peru": "PER", "Philippines": "PHL", "Poland": "POL", "Portugal": "PRT",
        "Puerto Rico": "PRI", "Qatar": "QAT", "Romania": "ROU", "Russia": "RUS",
        "Rwanda": "RWA", "Saudi Arabia": "SAU", "Senegal": "SEN", "Serbia": "SRB",
        "Sierra Leone": "SLE", "Slovakia": "SVK", "Slovenia": "SVN", "Solomon Is.": "SLB",
        "Somalia": "SOM", "Somaliland": "XSO", "South Africa": "ZAF", "South Korea": "KOR",
        "S. Sudan": "SSD", "Spain": "ESP", "Sri Lanka": "LKA", "Sudan": "SDN",
        "Suriname": "SUR", "Sweden": "SWE", "Switzerland": "CHE", "Syria": "SYR",
        "Taiwan": "TWN", "Tajikistan": "TJK", "Tanzania": "TZA", "Thailand": "THA",
        "Timor-Leste": "TLS", "Togo": "TGO", "Trinidad and Tobago": "TTO", "Tunisia": "TUN",
        "Turkey": "TUR", "Turkmenistan": "TKM", "Uganda": "UGA", "Ukraine": "UKR",
        "United Arab Emirates": "ARE", "United Kingdom": "GBR",
        "United States of America": "USA", "Uruguay": "URY", "Uzbekistan": "UZB",
        "Vanuatu": "VUT", "Venezuela": "VEN", "Vietnam": "VNM", "W. Sahara": "ESH",
        "Yemen": "YEM", "Zambia": "ZMB", "Zimbabwe": "ZWE"
    },
    polygonDisaggregationRules: [
        {
            parentIso: "FRA",
            parentFeatureId: "250",
            childIso: "GUF",
            childFeatureId: "254",
            childName: "French Guiana/Guyane (France)",
            bbox: { minLon: -56, maxLon: -50, minLat: 1, maxLat: 7 }
        },
        {
            parentIso: "NOR",
            parentFeatureId: "578",
            childIso: "SJM",
            childFeatureId: "744",
            childName: "Svalbard and Jan Mayen  (Norway)",
            bbox: { minLon: 10, maxLon: 35, minLat: 74, maxLat: 82 }
        }
    ],
    markerCoordinatesByIso: {
        "GUF": { lon: -53.13, lat: 3.93, hitRadius: 8 },
        "GLP": { lon: -61.55, lat: 16.27, hitRadius: 5 },
        "MTQ": { lon: -61.02, lat: 14.64, hitRadius: 5 },
        "MYT": { lon: 45.17, lat: -12.83, hitRadius: 6 },
        "REU": { lon: 55.54, lat: -21.12, hitRadius: 7 },
        "PYF": { lon: -149.41, lat: -17.68, hitRadius: 8 },
        "NCL": { lon: 165.62, lat: -20.90, hitRadius: 7 },
        "MAF": { lon: -63.05, lat: 18.10, hitRadius: 4.5 },
        "BLM": { lon: -62.83, lat: 17.90, hitRadius: 4.5 },
        "SPM": { lon: -56.27, lat: 46.88, hitRadius: 7 },
        "WLF": { lon: -176.20, lat: -13.30, hitRadius: 7 },
        "ATF": { lon: 69.35, lat: -49.28, hitRadius: 7 },
        "BMU": { lon: -64.75, lat: 32.31, hitRadius: 7 },
        "CYM": { lon: -81.25, lat: 19.31, hitRadius: 6 },
        "VGB": { lon: -64.45, lat: 18.50, hitRadius: 5 },
        "GIB": { lon: -5.35, lat: 36.14, hitRadius: 6 },
        "AIA": { lon: -63.07, lat: 18.28, hitRadius: 5 },
        "MSR": { lon: -62.19, lat: 16.74, hitRadius: 5 },
        "TCA": { lon: -71.80, lat: 21.69, hitRadius: 6 },
        "FLK": { lon: -59.52, lat: -51.79, hitRadius: 7 },
        "SHN": { lon: -5.71, lat: -15.96, hitRadius: 7 },
        "JEY": { lon: -2.13, lat: 49.21, hitRadius: 5 },
        "GGY": { lon: -2.58, lat: 49.47, hitRadius: 5 },
        "IMN": { lon: -4.55, lat: 54.24, hitRadius: 5 },
        "PCN": { lon: -130.10, lat: -25.07, hitRadius: 7 },
        "IOT": { lon: 72.42, lat: -7.31, hitRadius: 7 },
        "SGS": { lon: -36.75, lat: -54.28, hitRadius: 7 },
        "XAD": { lon: 32.98, lat: 34.58, hitRadius: 5.5 },
        "PRI": { lon: -66.59, lat: 18.22, hitRadius: 6 },
        "GUM": { lon: 144.79, lat: 13.44, hitRadius: 8 },
        "VIR": { lon: -64.93, lat: 17.75, hitRadius: 5 },
        "ASM": { lon: -170.70, lat: -14.27, hitRadius: 8 },
        "MNP": { lon: 145.67, lat: 15.10, hitRadius: 7 },
        "UMI": { lon: -169.53, lat: 16.75, hitRadius: 7 },
        "ABW": { lon: -70.03, lat: 12.52, hitRadius: 5 },
        "CUW": { lon: -68.99, lat: 12.17, hitRadius: 5 },
        "SXM": { lon: -63.05, lat: 18.02, hitRadius: 4.5 },
        "BES": { lon: -68.26, lat: 12.18, hitRadius: 5 },
        "GRL": { lon: -42.60, lat: 71.71, hitRadius: 9 },
        "FRO": { lon: -6.91, lat: 61.89, hitRadius: 7 },
        "HKG": { lon: 114.17, lat: 22.32, hitRadius: 5.5 },
        "MAC": { lon: 113.54, lat: 22.20, hitRadius: 5.5 },
        "COK": { lon: -159.78, lat: -21.24, hitRadius: 7 },
        "NIU": { lon: -169.87, lat: -19.05, hitRadius: 7 },
        "TKL": { lon: -171.85, lat: -9.20, hitRadius: 7 },
        "NFK": { lon: 167.95, lat: -29.04, hitRadius: 7 },
        "CXR": { lon: 105.69, lat: -10.45, hitRadius: 7 },
        "CCK": { lon: 96.83, lat: -12.16, hitRadius: 7 },
        "ALA": { lon: 19.92, lat: 60.18, hitRadius: 6 },
        "SJM": { lon: 16.00, lat: 78.22, hitRadius: 7 },
        "ESH": { lon: -12.89, lat: 24.22, hitRadius: 7 },
        "GBR": { lon: -1.50, lat: 52.50, hitRadius: 6 },
        "GBR-SCT": { lon: -4.20, lat: 56.80, hitRadius: 6 },
        "GBR-NIR": { lon: -6.80, lat: 54.60, hitRadius: 5.5 },
        "BIH": { lon: 17.80, lat: 43.90, hitRadius: 5.5 },
        "BIH-SRP": { lon: 17.60, lat: 44.75, hitRadius: 5.5 },
        "ATG": { lon: -61.80, lat: 17.06, hitRadius: 5 },
        "VCT": { lon: -61.20, lat: 13.25, hitRadius: 5 },
        "DMA": { lon: -61.37, lat: 15.41, hitRadius: 5 },
        "BHS": { lon: -77.40, lat: 25.03, hitRadius: 7 },
        "GRD": { lon: -61.68, lat: 12.12, hitRadius: 5 },
        "LCA": { lon: -60.98, lat: 13.91, hitRadius: 5 },
        "KNA": { lon: -62.78, lat: 17.36, hitRadius: 5 },
        "TTO": { lon: -61.22, lat: 10.69, hitRadius: 6 },
        "BRB": { lon: -59.54, lat: 13.19, hitRadius: 6 },
        "JAM": { lon: -77.30, lat: 18.11, hitRadius: 6 },
        "TON": { lon: -175.20, lat: -21.18, hitRadius: 7 },
        "PLW": { lon: 134.58, lat: 7.51, hitRadius: 7 },
        "NRU": { lon: 166.93, lat: -0.52, hitRadius: 7 },
        "FJI": { lon: 178.07, lat: -17.71, hitRadius: 7 },
        "WSM": { lon: -172.10, lat: -13.76, hitRadius: 7 },
        "FSM": { lon: 158.25, lat: 6.88, hitRadius: 7 },
        "KIR": { lon: -157.36, lat: 1.87, hitRadius: 7 },
        "TUV": { lon: 179.19, lat: -8.52, hitRadius: 7 },
        "SLB": { lon: 160.16, lat: -9.65, hitRadius: 7 },
        "VUT": { lon: 166.96, lat: -15.38, hitRadius: 7 },
        "MHL": { lon: 171.18, lat: 7.13, hitRadius: 7 },
        "CPV": { lon: -23.61, lat: 15.12, hitRadius: 7 },
        "SYC": { lon: 55.49, lat: -4.68, hitRadius: 7 },
        "MUS": { lon: 57.55, lat: -20.35, hitRadius: 7 },
        "STP": { lon: 6.61, lat: 0.19, hitRadius: 7 },
        "COM": { lon: 43.33, lat: -11.65, hitRadius: 6 },
        "MLT": { lon: 14.38, lat: 35.94, hitRadius: 6 },
        "LUX": { lon: 6.13, lat: 49.82, hitRadius: 5 },
        "MCO": { lon: 7.42, lat: 43.74, hitRadius: 5 },
        "AND": { lon: 1.52, lat: 42.51, hitRadius: 5 },
        "SMR": { lon: 12.46, lat: 43.94, hitRadius: 5 },
        "LIE": { lon: 9.56, lat: 47.14, hitRadius: 5 },
        "VAT": { lon: 12.45, lat: 41.90, hitRadius: 5 },
        "BHR": { lon: 50.56, lat: 26.07, hitRadius: 6 },
        "MDV": { lon: 73.51, lat: 4.18, hitRadius: 7 },
        "SGP": { lon: 103.82, lat: 1.35, hitRadius: 6 },
        "BRN": { lon: 114.73, lat: 4.54, hitRadius: 6 },
        "XKX": { lon: 20.90, lat: 42.60, hitRadius: 5.5 },
        "XTR": { lon: 29.63, lat: 46.84, hitRadius: 5.5 },
        "XAB": { lon: 41.02, lat: 43.00, hitRadius: 5.5 },
        "XOS": { lon: 43.97, lat: 42.34, hitRadius: 5.5 },
        "XNC": { lon: 33.48, lat: 35.23, hitRadius: 5.5 },
        "XSO": { lon: 45.50, lat: 9.80, hitRadius: 6 }
    },
    labelAnchorByIso: {
        "FJI": [178.07, -17.71],
        "USA": [-98.5, 38.5],
        "FRA": [2.4, 46.6],
        "GUF": [-53.13, 3.93],
        "RUS": [94.0, 61.5],
        "NOR": [9.2, 61.2],
        "CAN": [-102.0, 58.0],
        "GBR": [-1.5, 52.5],
        "GBR-SCT": [-4.2, 56.8],
        "GBR-NIR": [-6.8, 54.6],
        "MYS": [102.2, 4.2],
        "IDN": [117.0, -2.5],
        "JPN": [138.2, 36.2],
        "NZL": [172.5, -41.8],
        "CHL": [-71.0, -33.5],
        "HRV": [16.4, 45.2],
        "GRC": [22.0, 39.2]
    }
};

const GLOSSARY_DEFINITIONS = {
    incarceration: {
        title: "Incarceration",
        text: "The state of being confined in prison or pre-trial detention. Rates here measure the number of prisoners per 100,000 of the general population."
    },
    jurisdiction: {
        title: "Jurisdiction",
        text: "A sovereign country, constituent national administration (such as Scotland or England & Wales), or overseas autonomous territory that reports prison statistics separately."
    }
};

/**
 * Legacy-compatible Set of overseas territories and core semantic globals.
 */
const overseasTerritories = new Set(DEFAULT_MAPPING_CONFIG.taxonomy.overseasAutonomousIsos);
let geoPathGenerator = null;
let selectedJurisdiction = null;
let hoveredJurisdiction = null;
let activeContinentFilter = "All";
const rateScale = typeof d3 !== "undefined" && d3.scaleLinear ? d3.scaleLinear() : null;

const appState = {
    mappingConfig: DEFAULT_MAPPING_CONFIG,
    data: [],
    dataByIso: new Map(),
    dataByExactName: new Map(),
    dataByNormalisedName: new Map(),
    rankedData: [],
    globalMedianRate: GLOBAL_MEDIAN_RATE,
    palette: "default",
    selectedBucket: null,
    hoveredBucket: null,
    activeContinentFilter: "All",
    activeBloc: "all",
    jurisdictionTypeFilter: "all",
    rateRangeFilter: "all",
    sortOrder: "highest",
    chartViewLimit: "top15",
    showNoData: false,
    searchQuery: "",
    pinnedJurisdictionId: null,
    hoveredJurisdictionId: null,
    selectedJurisdiction: null,
    hoveredJurisdiction: null,
    features: [],
    featuresByIso: new Map(),
    featuresByIsoParts: new Map(),
    territoryFeatures: [],
    markersByIso: new Map(),
    projection: typeof d3 !== "undefined" && d3.geoNaturalEarth1 ? d3.geoNaturalEarth1() : null,
    geoPathGenerator: null,
    zoomBehavior: null,
    currentZoomTransform: typeof d3 !== "undefined" && d3.zoomIdentity ? d3.zoomIdentity : { k: 1, x: 0, y: 0 },
    mapGroup: null,
    countriesLayer: null,
    focusLayer: null,
    borderLayer: null,
    selectedBordersLayer: null,
    territoryGroup: null,
    labelGroup: null,
    svg: null,
    barChartSvg: null
};

/**
 * Parse a raw CSV prison rate value.
 * Preserves 0 as a valid numeric rate; normalizes empty, "N/A", or invalid strings to null.
 */
const parsePrisonRate = rawValue => {
    if (rawValue === undefined || rawValue === null) return null;
    if (typeof rawValue === "number") {
        return Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : null;
    }
    const trimmed = String(rawValue).trim();
    if (!trimmed || trimmed.toUpperCase() === "N/A") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

/**
 * Normalise a jurisdiction name for fuzzy lookup.
 */
const normaliseJurisdictionName = rawName => {
    if (!rawName) return "";
    return String(rawName).replace(/\s+\(.+\)$/, "").replace(/\s{2,}/g, " ").trim();
};

/**
 * Resolve canonical ISO-3 (or documented fallback code) for a country name.
 */
const resolveCountryIso = (countryName, mappingConfig = appState.mappingConfig) => {
    if (!countryName) return "UNK";
    const trimmed = String(countryName).trim();
    const mapObj = mappingConfig?.countryToIso || DEFAULT_MAPPING_CONFIG.countryToIso;
    if (mapObj[trimmed]) return mapObj[trimmed];
    if (mapObj[countryName]) return mapObj[countryName];

    const collapsed = trimmed.replace(/\s{2,}/g, " ");
    for (const [k, v] of Object.entries(mapObj)) {
        if (k.replace(/\s{2,}/g, " ") === collapsed) return v;
    }
    return trimmed.slice(0, 3).toUpperCase();
};

/**
 * Classify a canonical ISO into one of the three strict taxonomy values:
 * "sovereign" | "constituent" | "overseas_autonomous"
 */
const classifyJurisdictionType = (iso, mappingConfig = appState.mappingConfig) => {
    const taxonomy = mappingConfig?.taxonomy || DEFAULT_MAPPING_CONFIG.taxonomy;
    if (taxonomy.constituentIsos && taxonomy.constituentIsos.includes(iso)) {
        return "constituent";
    }
    if (taxonomy.overseasAutonomousIsos && taxonomy.overseasAutonomousIsos.includes(iso)) {
        return "overseas_autonomous";
    }
    return "sovereign";
};

/**
 * Return array of bloc memberships for a canonical ISO code.
 */
const getBlocsForIso = (iso, mappingConfig = appState.mappingConfig) => {
    const blocsMap = mappingConfig?.blocMemberships || DEFAULT_MAPPING_CONFIG.blocMemberships;
    const memberships = [];
    for (const [blocName, memberIsos] of Object.entries(blocsMap)) {
        if (Array.isArray(memberIsos) && memberIsos.includes(iso)) {
            memberships.push(blocName);
        }
    }
    return memberships;
};

/**
 * Enrich a raw CSV row into the canonical jurisdiction schema:
 * { iso, country, rate, continent, jurisdiction_type, blocs }
 */
const enrichJurisdictionRecord = (rawRow, mappingConfig = appState.mappingConfig) => {
    const country = String(rawRow.country ?? rawRow.Country ?? "").trim();
    const rawRate = rawRow.rate !== undefined ? rawRow.rate : rawRow["Prison population rate"];
    const rate = parsePrisonRate(rawRate);
    const continent = String(rawRow.continent ?? rawRow.Continent ?? "").trim();
    const iso = rawRow.iso || resolveCountryIso(country, mappingConfig);
    const jurisdiction_type = classifyJurisdictionType(iso, mappingConfig);
    const blocs = Array.isArray(rawRow.blocs) ? rawRow.blocs : getBlocsForIso(iso, mappingConfig);

    return {
        iso,
        country,
        rate,
        continent,
        jurisdiction_type,
        blocs
    };
};

/**
 * Enrich a full dataset array and populate appState lookup maps by canonical ISO.
 */
const enrichDataset = (rawRows, mappingConfig = appState.mappingConfig) => {
    appState.mappingConfig = mappingConfig || DEFAULT_MAPPING_CONFIG;
    const enriched = rawRows
        .map(row => enrichJurisdictionRecord(row, appState.mappingConfig))
        .filter(row => Boolean(row.country && row.iso));

    appState.data = enriched;
    appState.dataByIso.clear();
    appState.dataByExactName.clear();
    appState.dataByNormalisedName.clear();

    enriched.forEach(record => {
        appState.dataByIso.set(record.iso, record);
        appState.dataByExactName.set(record.country, record);
        const norm = normaliseJurisdictionName(record.country).toLowerCase();
        if (!appState.dataByNormalisedName.has(norm) || record.iso === "GBR" || record.iso === "BIH") {
            appState.dataByNormalisedName.set(norm, record);
        }
    });

    appState.rankedData = enriched
        .filter(record => Number.isFinite(record.rate))
        .sort((a, b) => {
            if (b.rate !== a.rate) return b.rate - a.rate;
            return a.country.localeCompare(b.country);
        });
    appState.globalMedianRate = computeMedianRate(enriched) || GLOBAL_MEDIAN_RATE;

    return enriched;
};

/**
 * Determine whether a record or ISO represents an overseas autonomous territory.
 */
const isOverseasTerritory = recordOrIso => {
    if (!recordOrIso) return false;
    if (typeof recordOrIso === "object" && recordOrIso.jurisdiction_type) {
        return recordOrIso.jurisdiction_type === "overseas_autonomous";
    }
    const iso = typeof recordOrIso === "string"
        ? (appState.dataByIso.has(recordOrIso) ? recordOrIso : resolveCountryIso(recordOrIso))
        : recordOrIso.iso;
    return classifyJurisdictionType(iso) === "overseas_autonomous";
};

/**
 * Map CSV continent strings ("North America", "South America", etc.) to unified regions.
 */
const regionForJurisdiction = row => {
    if (!row || !row.continent) return "Unknown";
    if (row.continent === "North America" || row.continent === "South America") {
        return "Americas";
    }
    return row.continent;
};

/**
 * Return the 5-step choropleth rate bucket (or No Data bucket) for a given rate.
 */
const bucketForRate = rate => {
    if (!Number.isFinite(rate) || rate < 0) return RATE_BUCKETS[0];
    return RATE_BUCKETS.find(bucket => bucket.min !== null && rate >= bucket.min && rate <= bucket.max) || RATE_BUCKETS[0];
};

/**
 * Non-overlapping toolbar rate range filter check.
 */
const matchesRateRangeFilter = (rate, rangeKey) => {
    if (!rangeKey || rangeKey === "all") return true;
    if (!Number.isFinite(rate)) return false;
    switch (rangeKey) {
        case "under-100":
            return rate >= 0 && rate < 100;
        case "100-300":
            return rate >= 100 && rate < 300;
        case "300-600":
            return rate >= 300 && rate < 600;
        case "600-plus":
            return rate >= 600;
        default:
            return true;
    }
};

/**
 * Compute mean [lon, lat] of the outer ring of a Polygon coordinate array.
 */
const computePolygonRingMeanLonLat = polygonCoords => {
    const outerRing = Array.isArray(polygonCoords) && Array.isArray(polygonCoords[0]) ? polygonCoords[0] : [];
    if (!outerRing.length) return [0, 0];
    let sumLon = 0;
    let sumLat = 0;
    for (let i = 0; i < outerRing.length; i++) {
        sumLon += outerRing[i][0];
        sumLat += outerRing[i][1];
    }
    return [sumLon / outerRing.length, sumLat / outerRing.length];
};

/**
 * Resolve a TopoJSON/GeoJSON feature to its canonical jurisdiction ISO-3 code.
 */
const resolveFeatureIso = (feature, mappingConfig = appState.mappingConfig) => {
    if (!feature) return null;
    if (feature.properties?.iso) return feature.properties.iso;
    if (feature.properties?.csvRow?.iso) return feature.properties.csvRow.iso;

    const cfg = mappingConfig || DEFAULT_MAPPING_CONFIG;
    const rawId = feature.id !== undefined && feature.id !== null ? String(feature.id).padStart(3, "0") : null;
    if (rawId && cfg.atlasIdToIso && cfg.atlasIdToIso[rawId]) {
        return cfg.atlasIdToIso[rawId];
    }

    const rawName = feature.properties?.name ? String(feature.properties.name).trim() : "";
    if (rawName && cfg.atlasNameToIso && cfg.atlasNameToIso[rawName]) {
        return cfg.atlasNameToIso[rawName];
    }
    if (rawName && cfg.countryToIso && cfg.countryToIso[rawName]) {
        return cfg.countryToIso[rawName];
    }
    return null;
};

/**
 * Disaggregate composite MultiPolygon features in Natural Earth 110m (such as splitting
 * French Guiana [GUF] out of France [FRA], and Svalbard [SJM] out of Norway [NOR])
 * and stamp every resulting feature with its canonical properties.iso.
 */
const disaggregateAtlasFeatures = (rawFeatures, mappingConfig = appState.mappingConfig) => {
    const cfg = mappingConfig || DEFAULT_MAPPING_CONFIG;
    const rules = cfg.polygonDisaggregationRules || [];
    const outputFeatures = [];

    rawFeatures.forEach(feature => {
        const baseIso = resolveFeatureIso(feature, cfg);
        const matchingRules = rules.filter(
            rule => rule.parentIso === baseIso || String(feature.id).padStart(3, "0") === rule.parentFeatureId
        );

        if (matchingRules.length > 0 && feature.geometry?.type === "MultiPolygon") {
            let remainingPolygons = [...feature.geometry.coordinates];

            matchingRules.forEach(rule => {
                const matchedPolygons = [];
                const keptPolygons = [];

                remainingPolygons.forEach(polyCoords => {
                    const [meanLon, meanLat] = computePolygonRingMeanLonLat(polyCoords);
                    const inBox = meanLon >= rule.bbox.minLon
                        && meanLon <= rule.bbox.maxLon
                        && meanLat >= rule.bbox.minLat
                        && meanLat <= rule.bbox.maxLat;
                    if (inBox) {
                        matchedPolygons.push(polyCoords);
                    } else {
                        keptPolygons.push(polyCoords);
                    }
                });

                if (matchedPolygons.length > 0) {
                    remainingPolygons = keptPolygons;
                    const childGeometry = matchedPolygons.length === 1
                        ? { type: "Polygon", coordinates: matchedPolygons[0] }
                        : { type: "MultiPolygon", coordinates: matchedPolygons };

                    outputFeatures.push({
                        type: "Feature",
                        id: rule.childFeatureId,
                        properties: {
                            name: rule.childName,
                            iso: rule.childIso,
                            disaggregatedFrom: rule.parentIso
                        },
                        geometry: childGeometry
                    });
                }
            });

            const parentGeometry = remainingPolygons.length === 1
                ? { type: "Polygon", coordinates: remainingPolygons[0] }
                : { type: "MultiPolygon", coordinates: remainingPolygons };

            outputFeatures.push({
                ...feature,
                properties: {
                    ...(feature.properties || {}),
                    iso: baseIso
                },
                geometry: parentGeometry
            });
        } else {
            outputFeatures.push({
                ...feature,
                properties: {
                    ...(feature.properties || {}),
                    iso: baseIso
                }
            });
        }
    });

    return outputFeatures;
};

/**
 * Check if a canonical jurisdiction record matches all active filters
 * (Continent, Geopolitical Bloc, Jurisdiction Type, Rate Range, Stepped Bucket, Search).
 */
const doesRowMatchActiveFilters = (row, featureName = "", options = {}) => {
    const activeBucketKey = appState.hoveredBucket || appState.selectedBucket;
    const rowBucket = bucketForRate(row ? row.rate : null);
    const effectiveRegion = featureName === "Antarctica" ? "Antarctica" : (row ? regionForJurisdiction(row) : "Unknown");
    const dataAvailabilityMatch = options.ignoreShowNoData
        || !appState.showNoData
        || appState.chartViewLimit !== "all"
        || !row
        || !Number.isFinite(row.rate);

    const continentMatch = appState.activeContinentFilter === "All"
        || effectiveRegion === appState.activeContinentFilter
        || (row && row.continent === appState.activeContinentFilter);

    const blocMatch = !appState.activeBloc
        || appState.activeBloc === "all"
        || Boolean(row && Array.isArray(row.blocs) && row.blocs.includes(appState.activeBloc));

    const typeFilter = appState.jurisdictionTypeFilter;
    let typeMatch = true;
    if (typeFilter && typeFilter !== "all") {
        if (!row) {
            typeMatch = false;
        } else if (typeFilter === "territories" || typeFilter === "overseas_autonomous") {
            typeMatch = row.jurisdiction_type === "overseas_autonomous";
        } else if (typeFilter === "constituent") {
            typeMatch = row.jurisdiction_type === "constituent";
        } else if (typeFilter === "sovereign") {
            typeMatch = row.jurisdiction_type === "sovereign";
        }
    }

    const rangeMatch = options.ignoreRateFilters || appState.rateRangeFilter === "all"
        || (row ? matchesRateRangeFilter(row.rate, appState.rateRangeFilter) : false);

    const bucketMatch = options.ignoreRateFilters || !activeBucketKey || rowBucket.key === activeBucketKey;

    const query = appState.searchQuery;
    const searchMatch = !query
        || (row && row.country.toLowerCase().includes(query))
        || (row && row.iso && row.iso.toLowerCase().includes(query))
        || (row && normaliseJurisdictionName(row.country).toLowerCase().includes(query))
        || (featureName && featureName.toLowerCase().includes(query));

    return {
        row,
        bucket: rowBucket,
        continentMatch,
        blocMatch,
        typeMatch,
        rangeMatch,
        bucketMatch,
        searchMatch,
        dataAvailabilityMatch,
        matchesAll: continentMatch && blocMatch && typeMatch && rangeMatch && bucketMatch && searchMatch && dataAvailabilityMatch
    };
};

/**
 * Return filtered and sorted records for the horizontal bar chart explorer.
 * The chart always contains numeric rates. Show N/A data filters the map to
 * missing-rate jurisdictions without adding N/A rows to the chart.
 */
const getFilteredJurisdictions = () => {
    const activeBucketKey = appState.selectedBucket;
    return appState.data
        .filter(row => Number.isFinite(row.rate))
        .filter(row => doesRowMatchActiveFilters(row, row.country, { ignoreShowNoData: true }).matchesAll)
        .filter(row => {
            if (!activeBucketKey) return true;
            return bucketForRate(row.rate).key === activeBucketKey;
        })
        .sort((a, b) => {
            const aHasRate = Number.isFinite(a.rate);
            const bHasRate = Number.isFinite(b.rate);
            if (aHasRate !== bHasRate) return aHasRate ? -1 : 1;
            if (appState.sortOrder === "lowest") {
                return (a.rate - b.rate) || a.country.localeCompare(b.country);
            }
            if (appState.sortOrder === "alphabetical") {
                return a.country.localeCompare(b.country);
            }
            return (b.rate - a.rate) || a.country.localeCompare(b.country);
        });
};

/**
 * Return only missing-rate records for the dedicated Show N/A view.
 */
const getNoDataJurisdictions = () => appState.data
    .filter(row => !Number.isFinite(row.rate))
    .filter(row => doesRowMatchActiveFilters(row, row.country, {
        ignoreShowNoData: true,
        ignoreRateFilters: true
    }).matchesAll)
    .sort((a, b) => a.country.localeCompare(b.country));

/**
 * Compute median rate strictly from finite numeric rates.
 * Returns null if no finite numeric rates exist (never returns NaN).
 */
const computeMedianRate = records => {
    if (!Array.isArray(records)) return null;
    const finiteRates = records
        .map(r => (typeof r === "number" ? r : r?.rate))
        .filter(v => Number.isFinite(v))
        .sort((a, b) => a - b);

    if (finiteRates.length === 0) return null;
    const mid = Math.floor(finiteRates.length / 2);
    return finiteRates.length % 2 !== 0
        ? finiteRates[mid]
        : (finiteRates[mid - 1] + finiteRates[mid]) / 2;
};

/**
 * Format summary telemetry using the one global benchmark.
 */
const formatSummaryTelemetry = (numericRecords, activeBloc = appState.activeBloc, activeContinent = appState.activeContinentFilter) => {
    const count = Array.isArray(numericRecords) ? numericRecords.length : 0;
    const globalMedian = appState.globalMedianRate || GLOBAL_MEDIAN_RATE;
    const medianStr = `${Math.round(globalMedian).toLocaleString("en-US")} per 100k`;

    let scopeLabel = "All Jurisdictions";
    if (activeBloc && activeBloc !== "all" && activeContinent && activeContinent !== "All") {
        scopeLabel = `${activeBloc} (${activeContinent})`;
    } else if (activeBloc && activeBloc !== "all") {
        scopeLabel = activeBloc;
    } else if (activeContinent && activeContinent !== "All") {
        scopeLabel = activeContinent;
    }

    return `Showing ${count} jurisdictions in ${scopeLabel} — Global Median: ${medianStr}`;
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        MAP_WIDTH,
        MAP_HEIGHT,
        ZOOM_SCALE_EXTENT,
        MIN_HIT_RADIUS_PX,
        NO_DATA_COLORS,
        RATE_BUCKETS,
        PALETTES,
        CONTINENT_OPTIONS,
        BLOC_OPTIONS,
        RATE_RANGE_OPTIONS,
        JURISDICTION_TYPE_OPTIONS,
        SORT_OPTIONS,
        DEFAULT_MAPPING_CONFIG,
        appState,
        parsePrisonRate,
        normaliseJurisdictionName,
        resolveCountryIso,
        classifyJurisdictionType,
        getBlocsForIso,
        enrichJurisdictionRecord,
        enrichDataset,
        isOverseasTerritory,
        regionForJurisdiction,
        bucketForRate,
        matchesRateRangeFilter,
        resolveFeatureIso,
        disaggregateAtlasFeatures,
        doesRowMatchActiveFilters,
        getFilteredJurisdictions,
        getNoDataJurisdictions,
        computeMedianRate,
        formatSummaryTelemetry
    };
}
