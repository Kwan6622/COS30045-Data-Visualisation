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

        /*
           Find the FAQ item containing this question.
        */
        const faqItem = question.parentElement;


        /*
           Add or remove the "open" class.
        */
        faqItem.classList.toggle("open");

    });

});


/* =========================================================
   CURRENT YEAR
   ========================================================= */

/*
   Get the current year from the user's computer.
*/
const currentYear = new Date().getFullYear();


/*
   Find the element with id="current-year".
*/
const yearElement = document.getElementById("current-year");


/*
   Update the year if the element exists.
*/
if (yearElement) {

    yearElement.textContent = currentYear;

}


/* =========================================================
   APPLIANCE ENERGY CALCULATOR
   ========================================================= */


/*
   Find the calculator form.
*/
const energyForm = document.getElementById("energy-form");


/*
   Find the results area.
*/
const calculatorResults =
    document.getElementById("calculator-results");


/*
   Only run the calculator code if the calculator
   exists on the current page.
*/
if (energyForm && calculatorResults) {


    /*
       Listen for the form being submitted.
    */
    energyForm.addEventListener("submit", function (event) {

        /*
           Stop the browser from refreshing the page.
        */
        event.preventDefault();


        /*
           Read the values entered by the user.
        */
        const power = Number(
            document.getElementById("power").value
        );

        const hours = Number(
            document.getElementById("hours").value
        );

        const price = Number(
            document.getElementById("price").value
        );


        /*
           Validate the user input.
        */
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


        /*
           Convert watts to kilowatts.

           1000 watts = 1 kilowatt
        */
        const powerInKilowatts = power / 1000;


        /*
           Calculate daily energy consumption.

           Energy = Power × Time
        */
        const dailyEnergy = powerInKilowatts * hours;


        /*
           Estimate monthly energy consumption.

           We use 30 days as an average month.
        */
        const monthlyEnergy = dailyEnergy * 30;


        /*
           Estimate yearly energy consumption.
        */
        const yearlyEnergy = dailyEnergy * 365;


        /*
           Calculate monthly electricity cost.

           Price is entered in cents, so divide by 100
           to convert it to dollars.
        */
        const monthlyCost =
            monthlyEnergy * (price / 100);


        /*
           Calculate yearly electricity cost.
        */
        const yearlyCost =
            yearlyEnergy * (price / 100);


        /*
           Display the results inside the existing
           results panel.

           innerHTML replaces the previous results,
           preventing duplicate results.
        */
        calculatorResults.innerHTML = `

            <h3>
                Your Results
            </h3>

            <div class="result-grid">

                <div class="result-item">
                    <span>Daily Energy</span>
                    <strong>
                        ${dailyEnergy.toFixed(2)} kWh
                    </strong>
                </div>


                <div class="result-item">
                    <span>Monthly Energy</span>
                    <strong>
                        ${monthlyEnergy.toFixed(2)} kWh
                    </strong>
                </div>


                <div class="result-item">
                    <span>Yearly Energy</span>
                    <strong>
                        ${yearlyEnergy.toFixed(2)} kWh
                    </strong>
                </div>


                <div class="result-item">
                    <span>Monthly Cost</span>
                    <strong>
                        $${monthlyCost.toFixed(2)}
                    </strong>
                </div>


                <div class="result-item">
                    <span>Yearly Cost</span>
                    <strong>
                        $${yearlyCost.toFixed(2)}
                    </strong>
                </div>

            </div>

        `;

    });

}