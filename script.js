document.addEventListener('DOMContentLoaded', () => {

    // --- Page Elements ---
    const homePage = document.getElementById('home-page');
    const individualProductPage = document.getElementById('individual-product-page');

    // --- Navigation ---
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
                // If the server responded with an error, show it
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred.');
            }

            // Get the CSV content from the response
            const csvContent = await response.text();
            
            if (csvContent === "No reviews found.") {
                 alert("No 1-star or 2-star reviews were found for this ASIN.");
                 resultsBody.innerHTML = ''; // Clear previous results
                 return; // Stop execution
            }

            // --- Populate UI and set the download link ---
            // 1. Create a Blob for the download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            downloadLinkIndividual.href = url;
            downloadLinkIndividual.download = `${asin}_negative_reviews.csv`;

            // 2. Display a simple summary in the results table
            // Subtract 1 for the header row
            const reviewCount = (csvContent.match(/\n/g) || []).length;
            resultsBody.innerHTML = `
                <tr>
                    <td>${asin}</td>
                    <td>N/A (1-2 Stars Only)</td>
                    <td>${reviewCount > 0 ? reviewCount : 0}</td>
                    <td>${reviewCount > 0 ? reviewCount : 0}</td>
                    <td>N/A</td>
                </tr>
            `;
            
            individualResultsContainer.classList.remove('hidden');

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Scraping failed:', error);
        } finally {
            // Always hide the loading indicator
            loadingIndicatorIndividual.classList.add('hidden');
        }
    });

    function resetIndividualPage() {
        partNumberInput.value = '';
        loadingIndicatorIndividual.classList.add('hidden');
        individualResultsContainer.classList.add('hidden');
    }
});