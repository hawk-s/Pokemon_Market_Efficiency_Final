const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function scrapeTcgplayer(url, outputFilename) {
    // Launch the browser with puppeteer stealth
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    const waitTime = 20000; // 20 seconds

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Wait for the page content to load (adjust selector as needed)
        await page.waitForSelector('#app', { timeout: waitTime });

        // Give extra time for JavaScript to load, adjust if necessary
        await new Promise(resolve => setTimeout(resolve, 2000));

        let consolidatedHtml = '';
        let pageNumber = 1;
        const maxPages = 6;  // Maximum number of pages to scrape

        while (pageNumber <= maxPages) {
            const pageUrl = `${url}?p=${pageNumber}`;
            console.log(`Scraping page ${pageNumber}: ${pageUrl}`);

            // Navigate to the current page URL
            await page.goto(pageUrl, { waitUntil: 'networkidle2' });

            // Wait for the page content to load
            await page.waitForSelector('#app', { timeout: waitTime });

            // Wait for extra time to ensure all JS is executed
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Get the page HTML
            const pageHtml = await page.content();
            consolidatedHtml += pageHtml;

            // Simulate a short pause before moving to the next page
            await new Promise(resolve => setTimeout(resolve, 2000));

            pageNumber += 1;
        }

        // Save the consolidated HTML content to the output file
        const outputPath = path.join(__dirname, outputFilename);
        fs.writeFileSync(outputPath, consolidatedHtml, 'utf-8');
        console.log(`HTML saved to ${outputPath}`);
    } catch (err) {
        console.error('Error during scraping:', err);
    } finally {
        await browser.close();
    }
}

// Example usage
scrapeTcgplayer('https://www.tcgplayer.com/categories/trading-and-collectible-card-games/pokemon', 'tcg_player_all_sets_FINAL.html');
