import { ApifyClient } from 'apify-client';

// Helper function to convert JSON array to CSV string
function convertToCSV(items) {
    if (!items || items.length === 0) {
        return "";
    }
    
    // Use the keys from the first object as headers, ensuring a consistent order
    const headers = Object.keys(items[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const item of items) {
        const values = headers.map(header => {
            const value = item[header] === null || item[header] === undefined ? '' : item[header];
            const escaped = ('' + value).replace(/"/g, '""'); // escape double quotes
            return `"${escaped}"`; // wrap everything in quotes for safety
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

export async function handler(event) {
    // 1. Initialize the Apify Client
    const client = new ApifyClient({
        token: process.env.APIFY_API_TOKEN,
    });

    // 2. Get the ASIN from the request body
    const { asin } = JSON.parse(event.body);
    if (!asin) {
        return { statusCode: 400, body: JSON.stringify({ error: 'ASIN is required.' }) };
    }

    // 3. Define the base input for the actor
    const createActorInput = (starFilter) => ({
        "input": [{
            "asin": asin,
            "domainCode": "com",
            "sortBy": "recent",
            "maxPages": 1, // Limit to ~10 reviews per run
            "filterByStar": starFilter
        }]
    });

    try {
        // 4. Start both actor runs in parallel
        console.log(`Starting scraper for ${asin} with one_star and two_star filters.`);
        const oneStarPromise = client.actor("axesso_data/amazon-reviews-scraper").call(createActorInput("one_star"));
        const twoStarPromise = client.actor("axesso_data/amazon-reviews-scraper").call(createActorInput("two_star"));

        // 5. Wait for both runs to complete
        const [oneStarRun, twoStarRun] = await Promise.all([oneStarPromise, twoStarPromise]);
        console.log("Both actor runs completed.");

        // 6. Fetch results from both datasets in parallel
        const oneStarItemsPromise = client.dataset(oneStarRun.defaultDatasetId).listItems();
        const twoStarItemsPromise = client.dataset(twoStarRun.defaultDatasetId).listItems();

        const [oneStarResult, twoStarResult] = await Promise.all([oneStarItemsPromise, twoStarItemsPromise]);

        // 7. Combine the items from both results
        const allItems = [...oneStarResult.items, ...twoStarResult.items];
        console.log(`Found ${allItems.length} total reviews.`);
        
        if (allItems.length === 0) {
            return {
                statusCode: 200,
                body: "No reviews found.",
            };
        }

        // 8. Convert the combined JSON result to a CSV string
        const csvContent = convertToCSV(allItems);

        // 9. Return the CSV content
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