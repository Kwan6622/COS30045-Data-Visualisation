/* =========================================================
   FAQ ACCORDION
   ========================================================= */

/*
   Find all FAQ questions on the page.
*/
const faqQuestions = document.querySelectorAll(".faq-question");

/*
   Add a click event to every FAQ question.
*/
faqQuestions.forEach(function (question) {
    question.addEventListener("click", function () {
        const faqItem = question.parentElement;
        faqItem.classList.toggle("open");
    });
});


/* =========================================================
   CURRENT YEAR
   ========================================================= */

const currentYear = new Date().getFullYear();
const yearElement = document.getElementById("current-year");

if (yearElement) {
    yearElement.textContent = currentYear;
}


/* =========================================================
   OPEN ELECTRICITY API INTEGRATION
   Base URL: https://api.openelectricity.org.au/v4
   ========================================================= */

const OPEN_ELECTRICITY_API =
    "https://api.openelectricity.org.au/v4/market/network/NEM?metrics=price";
const CORS_PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    OPEN_ELECTRICITY_API
)}`;

const fetchLiveElectricityPrice = async () => {
    const priceInput = document.getElementById("price");
    const statusText = document.getElementById("price-status-text");
    const fetchBtn = document.getElementById("fetch-price-btn");
    const fetchBtnText = document.getElementById("fetch-btn-text");

    if (fetchBtnText) {
        fetchBtnText.textContent = "Fetching...";
    }
    if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.classList.add("is-loading");
    }

    try {
        let response;
        try {
            // First attempt direct API request
            response = await fetch(OPEN_ELECTRICITY_API);
            if (!response.ok) {
                throw new Error(`Direct API returned HTTP ${response.status}`);
            }
        } catch (directErr) {
            // Fallback to CORS proxy if browser restricts cross-origin response
            response = await fetch(CORS_PROXY_URL);
            if (!response.ok) {
                throw new Error(`Proxy returned HTTP ${response.status}`);
            }
        }

        const json = await response.json();
        const results = json?.data?.[0]?.results?.[0]?.data;

        if (!results || results.length === 0) {
            throw new Error("No price series found in API response");
        }

        // Extract latest recorded entry: [timestamp, $/MWh]
        const latestEntry = results[results.length - 1];
        const dollarPerMWh = Number(latestEntry[1]);

        // Convert $/MWh to cents per kWh:
        // 1 MWh = 1000 kWh, $1 = 100 cents => cents/kWh = ($/MWh) / 10
        const centsPerKwh = dollarPerMWh / 10;

        if (priceInput) {
            priceInput.value = centsPerKwh.toFixed(2);
        }

        if (statusText) {
            statusText.innerHTML = `
                <span class="live-price-badge">
                    Live NEM wholesale rate: <strong>${centsPerKwh.toFixed(
                        2
                    )}¢/kWh</strong> (via Open Electricity API).
                </span>
            `;
        }

        if (fetchBtnText) {
            fetchBtnText.textContent = "Live Rate Applied";
        }
    } catch (error) {
        console.warn(
            "Could not load live electricity price from Open Electricity API:",
            error
        );

        if (priceInput && (!priceInput.value || Number(priceInput.value) <= 0)) {
            priceInput.value = "30.00";
        }

        if (statusText) {
            statusText.innerHTML = `
                <span class="fallback-price-badge">
                    Live API unavailable. Using standard Australian average (30.00¢/kWh).
                </span>
            `;
        }

        if (fetchBtnText) {
            fetchBtnText.textContent = "Retry Live Price";
        }
    } finally {
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.classList.remove("is-loading");
        }
    }
};

const initCalculatorPriceApi = () => {
    const fetchBtn = document.getElementById("fetch-price-btn");
    const priceInput = document.getElementById("price");

    if (fetchBtn) {
        fetchBtn.addEventListener("click", fetchLiveElectricityPrice);
    }

    // Auto-fetch on page load if price field exists and is empty
    if (priceInput && !priceInput.value) {
        fetchLiveElectricityPrice();
    }
};


/* =========================================================
   APPLIANCE ENERGY CALCULATOR
   ========================================================= */

const energyForm = document.getElementById("energy-form");
const calculatorResults = document.getElementById("calculator-results");

if (energyForm && calculatorResults) {
    // Initialise the Open Electricity live price feature
    initCalculatorPriceApi();

    energyForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const power = Number(document.getElementById("power").value);
        const hours = Number(document.getElementById("hours").value);
        const price = Number(document.getElementById("price").value);

        if (
            power <= 0 ||
            hours <= 0 ||
            hours > 24 ||
            price <= 0 ||
            isNaN(power) ||
            isNaN(hours) ||
            isNaN(price)
        ) {
            calculatorResults.innerHTML = `
                <h3>Invalid input</h3>

                <p class="error-message">
                    Please enter valid values.
                    Power and electricity price must be greater
                    than 0, while daily usage must be between
                    0 and 24 hours.
                </p>
            `;
            return;
        }

        // 1000 watts = 1 kilowatt
        const powerInKilowatts = power / 1000;

        // Energy = Power × Time
        const dailyEnergy = powerInKilowatts * hours;
        const monthlyEnergy = dailyEnergy * 30;
        const yearlyEnergy = dailyEnergy * 365;

        // Price is in cents, divide by 100 for dollars
        const monthlyCost = monthlyEnergy * (price / 100);
        const yearlyCost = yearlyEnergy * (price / 100);

        calculatorResults.innerHTML = `
            <h3>Your Results</h3>

            <div class="result-grid">
                <div class="result-item">
                    <span>Daily Energy</span>
                    <strong>${dailyEnergy.toFixed(2)} kWh</strong>
                </div>

                <div class="result-item">
                    <span>Monthly Energy</span>
                    <strong>${monthlyEnergy.toFixed(2)} kWh</strong>
                </div>

                <div class="result-item">
                    <span>Yearly Energy</span>
                    <strong>${yearlyEnergy.toFixed(2)} kWh</strong>
                </div>

                <div class="result-item">
                    <span>Monthly Cost</span>
                    <strong>$${monthlyCost.toFixed(2)}</strong>
                </div>

                <div class="result-item">
                    <span>Yearly Cost</span>
                    <strong>$${yearlyCost.toFixed(2)}</strong>
                </div>
            </div>
        `;
    });
}