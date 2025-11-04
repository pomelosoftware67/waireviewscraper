document.addEventListener('DOMContentLoaded', () => {
    
    // --- Page Elements ---
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    const homePage = document.getElementById('home-page');
    const individualProductPage = document.getElementById('individual-product-page');

    // --- Login Logic ---
    // Check session storage to see if user is already logged in
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        loginPage.classList.add('hidden');
        mainApp.classList.remove('hidden');
    }

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'wai1' && password === 'wai1') {
            sessionStorage.setItem('isLoggedIn', 'true');
            loginPage.classList.add('hidden');
            mainApp.classList.remove('hidden');
            loginError.classList.add('hidden');
        } else {
            loginError.classList.remove('hidden');
        }
    });


    // --- Main App Navigation ---
    document.getElementById('show-individual-page-btn').addEventListener('click', () => {
        homePage.classList.add('hidden');
        individualProductPage.classList.remove('hidden');
    });

    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            individualProductPage.classList.add('hidden');
            homePage.classList.remove('hidden');
            resetIndividualPage();
        });
    });

    // --- Individual Product Page Logic ---
    const partNumberInput = document.getElementById('part-number-input');
    const scrapeAnalyzeBtn = document.getElementById('scrape-analyze-btn');
    const loadingIndicatorIndividual = document.getElementById('loading-indicator-individual');
    const individualResultsContainer = document.getElementById('individual-results');
    const resultsBody = document.getElementById('results-body');
    const downloadLinkIndividual = document.getElementById('download-link-individual');

    scrapeAnalyzeBtn.addEventListener('click', async () => {
        const asin = partNumberInput.value.trim();
        if (!asin) {
            alert('Please enter an Amazon ASIN.');
            return;
        }

        individualResultsContainer.classList.add('hidden');
        loadingIndicatorIndividual.classList.remove('hidden');

        try {
            // Call our Netlify serverless function
            const response = await fetch('/.netlify/functions/scrape-amazon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ asin: asin }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred.');
            }

            const csvContent = await response.text();
            
            if (csvContent === "No reviews found.") {
                 alert("No 1-star or 2-star reviews were found for this ASIN.");
                 resultsBody.innerHTML = '';
                 return;
            }

            // 1. Create a Blob for the download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            downloadLinkIndividual.href = url;
            downloadLinkIndividual.download = `${asin}_negative_reviews.csv`;

            // 2. Display a simple summary in the results table
            // We get this info from the CSV itself by splitting it.
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
            const values = lines[1].split(',').map(v => v.replace(/"/g, ''));
            
            const reviewCount = values[headers.indexOf('Review Count')];
            const avgRating = values[headers.indexOf('Average Star Rating - Current')];
            
            // Count how many "Review X" columns have content
            const negativeReviewCount = headers.filter(h => h.startsWith('Review ')).length;


            resultsBody.innerHTML = `
                <tr>
                    <td>${asin}</td>
                    <td>${avgRating}</td>
                    <td>${reviewCount}</td>
                    <td>${negativeReviewCount}</td>
                    <td>N/A</td>
                </tr>
            `;
            
            individualResultsContainer.classList.remove('hidden');

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Scraping failed:', error);
        } finally {
            loadingIndicatorIndividual.classList.add('hidden');
        }
    });

    function resetIndividualPage() {
        partNumberInput.value = '';
        loadingIndicatorIndividual.classList.add('hidden');
        individualResultsContainer.classList.add('hidden');
    }
});