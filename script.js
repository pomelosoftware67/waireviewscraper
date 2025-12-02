document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    const fileInput = document.getElementById('file-input');
    const fileMsg = document.querySelector('.file-msg');
    const fileInfo = document.getElementById('file-info');
    const filenameDisplay = document.getElementById('filename-display');
    const startScrapeBtn = document.getElementById('start-scrape-btn');

    const uploadSection = document.getElementById('upload-section');
    const processingSection = document.getElementById('processing-section');
    const resultsSection = document.getElementById('results-section');
    const progressBar = document.getElementById('progress-bar');
    const statusLog = document.getElementById('status-log');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resetBtn = document.getElementById('reset-btn');

    // --- Login Logic ---
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        showMainApp();
    }

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'wai1' && password === 'wai1') {
            sessionStorage.setItem('isLoggedIn', 'true');
            showMainApp();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isLoggedIn');
        mainApp.classList.add('hidden');
        loginPage.classList.remove('hidden');
    });

    function showMainApp() {
        loginPage.classList.add('hidden');
        mainApp.classList.remove('hidden');
        resetUI();
    }


    // --- File Input Logic ---
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            filenameDisplay.textContent = file.name;
            fileInfo.classList.remove('hidden');
            fileMsg.textContent = "File Selected";
            startScrapeBtn.disabled = false;
        }
    });


    // --- Scrape Button Logic ---
    startScrapeBtn.addEventListener('click', () => {
        // 1. UI Updates
        uploadSection.classList.add('hidden');
        processingSection.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        addLog("Initializing upload...");

        // 2. Prepare Data (For when we have the backend)
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        // --- TODO: REPLACE THIS SECTION WITH REAL BACKEND FETCH CALL ---
        // Simulate a process for the Demo
        simulateBackendProcess(); 
        // ---------------------------------------------------------------
    });

    resetBtn.addEventListener('click', resetUI);

    function resetUI() {
        // Reset Logic
        fileInput.value = '';
        fileMsg.textContent = "Drag & Drop CSV here or Click to Browse";
        fileInfo.classList.add('hidden');
        startScrapeBtn.disabled = true;
        
        uploadSection.classList.remove('hidden');
        processingSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        
        progressBar.style.width = '0%';
        statusLog.innerHTML = '<p class="log-entry">Waiting to start...</p>';
    }

    function addLog(message) {
        const p = document.createElement('p');
        p.className = 'log-entry';
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        statusLog.appendChild(p);
        statusLog.scrollTop = statusLog.scrollHeight; // Auto scroll to bottom
    }

    // --- MOCK FUNCTION (To be removed later) ---
    function simulateBackendProcess() {
        let progress = 0;
        
        addLog("File uploaded successfully.");
        addLog("Sending to Apify Scraper...");

        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${progress}%`;

            if (progress === 30) addLog("Scraping Amazon (20 ASINs detected)...");
            if (progress === 60) addLog("Scraping Bazaarvoice Reviews...");
            if (progress === 80) addLog("Cleaning data and formatting CSV...");

            if (progress >= 100) {
                clearInterval(interval);
                loadingSpinner.classList.add('hidden');
                addLog("Process Complete!");
                
                // Show Results
                setTimeout(() => {
                    processingSection.classList.add('hidden');
                    resultsSection.classList.remove('hidden');
                }, 1000);
            }
        }, 800); // Fast simulation
    }

});