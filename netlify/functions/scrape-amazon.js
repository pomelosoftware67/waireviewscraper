import { ApifyClient } from 'apify-client';

// Helper function to safely create a CSV field
const toCsvField = (data) => {
    if (data === null || data === undefined) {
        return '""';
    }
    const stringData = String(data);
    // Escape double quotes by doubling them and wrap the whole thing in quotes
    const escaped = stringData.replace(/"/g, '""');
    return `"${escaped}"`;
};

// Helper function to extract date from Amazon's date string
const parseReviewDate = (dateString) => {
    if (!dateString) return '';
    const match = dateString.match(/on (.+)/);
    return match ? match[1] : dateString;
};

export async function handler(event) {
    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

    const { asin } = JSON.parse(event.body);
    if (!asin) {
        return { statusCode: 400, body: JSON.stringify({ error: 'ASIN is required.' }) };
    }

    const createActorInput = (starFilter) => ({
        "input": [{
            "asin": asin,
            "domainCode": "com",
            "sortBy": "recent",
            "maxPages": 1,
            "filterByStar": starFilter
        }]
    });

    try {
        console.log(`Starting scraper for ${asin} with one_star and two_star filters.`);
        const oneStarPromise = client.actor("axesso_data/amazon-reviews-scraper").call(createActorInput("one_star"));
        const twoStarPromise = client.actor("axesso_data/amazon-reviews-scraper").call(createActorInput("two_star"));

        const [oneStarRun, twoStarRun] = await Promise.all([oneStarPromise, twoStarPromise]);

        const oneStarItemsPromise = client.dataset(oneStarRun.defaultDatasetId).listItems();
        const twoStarItemsPromise = client.dataset(twoStarRun.defaultDatasetId).listItems();
        const [oneStarResult, twoStarResult] = await Promise.all([oneStarItemsPromise, twoStarItemsPromise]);

        const allItems = [...oneStarResult.items, ...twoStarResult.items];
        console.log(`Found ${allItems.length} total reviews.`);
        
        if (allItems.length === 0) {
            return { statusCode: 200, body: "No reviews found." };
        }

        // --- DATA TRANSFORMATION LOGIC ---
        const firstReview = allItems[0];
        const singleRowData = {
            'WAI partnum/Amazon ASIN': asin,
            'Average Start Rating -> Previous': '',
            'Average Star Rating - Current': firstReview.productRating ? firstReview.productRating.replace(' out of 5', '') : '',
            'Rating Count': firstReview.countRatings || '',
            'Review Count': firstReview.countReviews || '',
            'Review Sentiment Analysis (Below 3 stars only)': '',
        };

        // Add up to 10 reviews as separate columns
        for (let i = 0; i < 10; i++) {
            const review = allItems[i];
            if (review) {
                const reviewDate = parseReviewDate(review.date);
                const combinedReview = `${reviewDate}: ${review.title}: ${review.text}`;
                singleRowData[`Review ${i + 1}`] = combinedReview;
            } else {
                singleRowData[`Review ${i + 1}`] = ''; // Add empty columns if less than 10 reviews
            }
        }

        // --- CSV GENERATION ---
        const headers = Object.keys(singleRowData);
        const values = headers.map(header => toCsvField(singleRowData[header]));

        const csvHeader = headers.map(h => toCsvField(h)).join(',');
        const csvRow = values.join(',');
        const csvContent = `${csvHeader}\n${csvRow}`;
        
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${asin}_reviews.csv"`
            },
            body: csvContent,
        };

    } catch (error) {
        console.error("Error during Apify actor execution:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to scrape reviews. See function logs for details.' }),
        };
    }
}