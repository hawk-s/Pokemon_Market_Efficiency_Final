const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Add stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

async function scrapeTCGplayer() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Go to the TCGplayer page
        await page.goto('https://www.tcgplayer.com/product/560387/pokemon-sv-shrouded-fable-cufant-076-064?Language=English&page=1', {
            waitUntil: 'networkidle2',
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Wait for the "View More Data" button to appear and click it
        await page.waitForSelector('.modal__activator', { timeout: 5000 });
        await page.click('.modal__activator');
        console.log('Clicked View More Data button');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Wait for the "Latest Sales" section to load
        await page.waitForSelector('h2.no-bottom-padding', { timeout: 5000 });
        console.log('Latest Sales section loaded');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Click the "Load More Sales" button until all sales are loaded
        let loadMoreVisible = true;
        while (loadMoreVisible) {
            try {
                // Wait for the "Load More Sales" button to appear
                await page.waitForSelector('.sales-history-snapshot__load-more', { timeout: 5000 });
                
                // Click the "Load More Sales" button
                await page.click('.sales-history-snapshot__load-more');
                console.log('Clicked Load More Sales button');

                // Wait for the new data to load
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Check if the "Load More Sales" button is still visible
                loadMoreVisible = await page.$('.sales-history-snapshot__load-more') !== null;
            } catch (e) {
                // If the button isn't found anymore, assume all data has been loaded
                console.log('No more Load More Sales buttons');
                loadMoreVisible = false;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));  // Pauses for 2 seconds
        //await page.waitForSelector('table');
        //await page.waitForSelector('tbody');

        // Wait a bit to make sure everything is fully loaded
        // await page.waitForTimeout(3000);

        // Get the full HTML of the page
        const pageHTML = await page.content();

        // Save the HTML to a file
        fs.writeFileSync('tcgplayer_full_page.html', pageHTML);
        console.log('Page HTML saved as tcgplayer_full_page.html');

    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
    }
}

scrapeTCGplayer();

// this fction works ok, but clicks the cookies preferences button instead load more sales button:)
// -> it is hence not used; the SCRAPE_TCG_FINAL2.js function is used - it does not click through the sales data but gets it from a graph extended to a year...