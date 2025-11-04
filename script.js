document.addEventListener('DOMContentLoaded', () => {

    // --- Page Elements ---
    const homePage = document.getElementById('home-page');
    const individualProductPage = document.getElementById('individual-product-page');
    const rollupPage = document.getElementById('rollup-page');
    const negativeReviewsPage = document.getElementById('negative-reviews-page');

    // --- Navigation ---
    document.getElementById('show-individual-page-btn').addEventListener('click', () => {
        homePage.classList.add('hidden');
        individualProductPage.classList.remove('hidden');
    });
    document.getElementById('show-rollup-page-btn').addEventListener('click', () => {
        homePage.classList.add('hidden');
        rollupPage.classList.remove('hidden');
    });
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            individualProductPage.classList.add('hidden');
            rollupPage.classList.add('hidden');
            negativeReviewsPage.classList.add('hidden');
            homePage.classList.remove('hidden');
            resetIndividualPage();
            resetRollupPage();
        });
    });
    document.getElementById('back-to-results-btn').addEventListener('click', () => {
        negativeReviewsPage.classList.add('hidden');
        individualProductPage.classList.remove('hidden');
    });


    // --- Helper Functions ---
    const reviewCategories = ["Accidental", "Order or delivery problem", "Quality issue", "Content issue", "Fitment issue"];
    const websites = ["Amazon", "CarParts.com", "O'reilly Auto", "NAPA", "AutoZone", "Advance"];

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        return `${mm}-${dd}-${yy}`;
    }
    
    // --- Date Range Default Checkbox Logic ---
    const individualDateStart = document.getElementById('date-start-input-individual');
    const individualDateEnd = document.getElementById('date-end-input-individual');
    const individualDateCheckbox = document.getElementById('default-date-checkbox-individual');

    individualDateCheckbox.addEventListener('change', () => {
        const disabled = individualDateCheckbox.checked;
        individualDateStart.disabled = disabled;
        individualDateEnd.disabled = disabled;
        if (disabled) {
            individualDateStart.value = '';
            individualDateEnd.value = '';
        }
    });

    const rollupDateStart = document.getElementById('date-start-input-rollup');
    const rollupDateEnd = document.getElementById('date-end-input-rollup');
    const rollupDateCheckbox = document.getElementById('default-date-checkbox-rollup');

    rollupDateCheckbox.addEventListener('change', () => {
        const disabled = rollupDateCheckbox.checked;
        rollupDateStart.disabled = disabled;
        rollupDateEnd.disabled = disabled;
        if (disabled) {
            rollupDateStart.value = '';
            rollupDateEnd.value = '';
        }
    });


    // --- Individual Product Page Logic ---
    const partNumberInput = document.getElementById('part-number-input');
    const scrapeAnalyzeBtn = document.getElementById('scrape-analyze-btn');
    const loadingIndicatorIndividual = document.getElementById('loading-indicator-individual');
    const individualResultsContainer = document.getElementById('individual-results');
    const resultsBody = document.getElementById('results-body');
    const downloadLinkIndividual = document.getElementById('download-link-individual');

    scrapeAnalyzeBtn.addEventListener('click', () => {
        if (!partNumberInput.value) {
            alert('Please enter a part number.');
            return;
        }

        individualResultsContainer.classList.add('hidden');
        loadingIndicatorIndividual.classList.remove('hidden');

        setTimeout(() => {
            resultsBody.innerHTML = ''; 
            const totalReviews = Math.floor(Math.random() * 200) + 20;
            const negativeReviews = Math.floor(Math.random() * (totalReviews / 5));
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${partNumberInput.value}</td>
                <td><span class="star-rating">★★☆☆☆</span> (2/5)</td>
                <td>${totalReviews}</td>
                <td>
                    ${negativeReviews}
                    <a class="view-reviews-link" data-part-number="${partNumberInput.value}" data-negative-count="${negativeReviews}">Click here to view negative reviews</a>
                </td>
                <td>Quality issue</td>
            `;
            resultsBody.appendChild(newRow);
            
            // Add event listener to the newly created link
            newRow.querySelector('.view-reviews-link').addEventListener('click', showNegativeReviewsPage);

            generateIndividualProductCSV();

            loadingIndicatorIndividual.classList.add('hidden');
            individualResultsContainer.classList.remove('hidden');
        }, 2000);
    });

    function generateIndividualProductCSV() {
        const partNumber = partNumberInput.value;
        const startDate = formatDate(document.getElementById('date-start-input-individual').value);
        const endDate = formatDate(document.getElementById('date-end-input-individual').value);
        
        let csvContent = "Customer reviews,Website,Star rating,Negative review category\n";
        for (let i = 0; i < 10; i++) {
            const randomSite = websites[Math.floor(Math.random() * websites.length)];
            const randomRating = Math.floor(Math.random() * 5) + 1;
            const randomCategory = (randomRating <= 2) ? reviewCategories[Math.floor(Math.random() * reviewCategories.length)] : '';
            csvContent += `Placeholder review of customer,${randomSite},${randomRating},${randomCategory}\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        downloadLinkIndividual.href = url;
        downloadLinkIndividual.download = `${partNumber}_reviews_${startDate || 'all'}_${endDate || 'time'}.csv`;
    }

    function resetIndividualPage() {
        partNumberInput.value = '';
        individualDateStart.value = '';
        individualDateEnd.value = '';
        individualDateCheckbox.checked = false;
        individualDateStart.disabled = false;
        individualDateEnd.disabled = false;
        loadingIndicatorIndividual.classList.add('hidden');
        individualResultsContainer.classList.add('hidden');
        negativeReviewsPage.classList.add('hidden'); // Also hide this page on reset
        // Reset custom dropdown
        allCheckbox.checked = false;
        websiteCheckboxes.forEach(cb => cb.checked = false);
        updateDropdownText();
    }

    // --- Negative Reviews Page Logic ---
    const negativeReviewsTitle = document.getElementById('negative-reviews-title');
    const negativeReviewsContainer = document.getElementById('negative-reviews-container');

    function showNegativeReviewsPage(event) {
        const partNumber = event.target.getAttribute('data-part-number');
        const negativeCount = parseInt(event.target.getAttribute('data-negative-count'), 10);

        // Update title
        negativeReviewsTitle.textContent = `Negative reviews for ${partNumber}`;
        
        // Clear previous reviews
        negativeReviewsContainer.innerHTML = '';

        // Generate placeholder reviews
        for (let i = 0; i < negativeCount; i++) {
            const reviewBox = document.createElement('div');
            reviewBox.className = 'review-box';
            
            const randomStars = Math.floor(Math.random() * 2) + 1; // 1 or 2 stars
            const starRating = '★'.repeat(randomStars) + '☆'.repeat(5 - randomStars);
            
            // Generate a random date within the last 2 years
            const randomDate = new Date(Date.now() - Math.floor(Math.random() * 2 * 365 * 24 * 60 * 60 * 1000));

            reviewBox.innerHTML = `
                <p>This is a placeholder review from this customer.</p>
                <div class="review-box-footer">
                    <span class="star-rating">${starRating} (${randomStars}/5)</span>
                    <span>${randomDate.toLocaleDateString()}</span>
                </div>
            `;
            negativeReviewsContainer.appendChild(reviewBox);
        }

        // Switch pages
        individualProductPage.classList.add('hidden');
        negativeReviewsPage.classList.remove('hidden');
    }


    // --- Custom Dropdown Logic ---
    const dropdownDisplay = document.querySelector('.dropdown-display');
    const dropdownOptions = document.querySelector('.dropdown-options');
    const dropdownText = document.getElementById('dropdown-text');
    const allCheckbox = document.querySelector('input[value="All"]');
    const websiteCheckboxes = Array.from(document.querySelectorAll('.website-checkbox:not([value="All"])'));

    dropdownDisplay.addEventListener('click', () => {
        dropdownOptions.style.display = dropdownOptions.style.display === 'block' ? 'none' : 'block';
    });

    allCheckbox.addEventListener('change', () => {
        websiteCheckboxes.forEach(checkbox => checkbox.checked = allCheckbox.checked);
        updateDropdownText();
    });

    websiteCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            allCheckbox.checked = websiteCheckboxes.every(cb => cb.checked);
            updateDropdownText();
        });
    });

    function updateDropdownText() {
        const selectedCount = websiteCheckboxes.filter(cb => cb.checked).length;
        if (selectedCount === 0) {
            dropdownText.textContent = 'Select Website/s';
        } else if (selectedCount === websiteCheckboxes.length) {
            dropdownText.textContent = 'All Websites Selected';
        } else {
            dropdownText.textContent = `${selectedCount} Website/s Selected`;
        }
    }
    
    document.addEventListener('click', (e) => {
        if (!dropdownDisplay.parentElement.contains(e.target)) {
            dropdownOptions.style.display = 'none';
        }
    });

    // --- Roll-up Interchange File Logic ---
    const csvUploadInput = document.getElementById('csv-upload');
    const uploadSection = document.getElementById('upload-section');
    const loadingIndicatorRollup = document.getElementById('loading-indicator-rollup');
    const downloadSection = document.getElementById('download-section');
    const downloadLinkRollup = document.getElementById('download-link-rollup');

    csvUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const rows = text.split('\n').slice(1);
                const partNumbers = rows.map(row => row.split(',')[0].trim()).filter(pn => pn);

                if (partNumbers.length === 0) throw new Error("No part numbers found.");

                uploadSection.classList.add('hidden');
                loadingIndicatorRollup.classList.remove('hidden');

                setTimeout(() => {
                    generateRollupCSV(partNumbers);
                    loadingIndicatorRollup.classList.add('hidden');
                    downloadSection.classList.remove('hidden');
                }, 2500);

            } catch (error) {
                alert("Invalid file format. Please ensure it is a CSV with part numbers in the first column.");
                resetRollupPage();
            }
        };
        reader.readAsText(file);
    });

    function generateRollupCSV(partNumbers) {
        const startDate = formatDate(document.getElementById('date-start-input-rollup').value);
        const endDate = formatDate(document.getElementById('date-end-input-rollup').value);

        let csvContent = "WAI part number,Average star rating,Total review count,Total negative review count (1-2 stars),Review category\n";

        partNumbers.forEach(pn => {
            const randomRating = (Math.random() * 4 + 1).toFixed(1);
            const totalReviews = Math.floor(Math.random() * 280) + 20;
            const negativeReviews = Math.floor(totalReviews * (Math.random() * 0.1 + 0.05));
            const randomCategory = reviewCategories[Math.floor(Math.random() * reviewCategories.length)];
            csvContent += `${pn},${randomRating},${totalReviews},${negativeReviews},${randomCategory}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        downloadLinkRollup.href = url;
        downloadLinkRollup.download = `review_results_${startDate || 'all'}_${endDate || 'time'}.csv`;
    }

    function resetRollupPage() {
        csvUploadInput.value = '';
        rollupDateStart.value = '';
        rollupDateEnd.value = '';
        rollupDateCheckbox.checked = false;
        rollupDateStart.disabled = false;
        rollupDateEnd.disabled = false;
        uploadSection.classList.remove('hidden');
        loadingIndicatorRollup.classList.add('hidden');
        downloadSection.classList.add('hidden');
    }
});