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

        // Wait for a second to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Wait for the button container to appear
        await page.waitForSelector('.charts-time-frame', { timeout: 5000 });

        // Specifically click the "1Y" button
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('.charts-time-frame .charts-item'));
            const oneYButton = buttons.find(button => button.textContent.trim() === '1Y');
            if (oneYButton) {
                oneYButton.click();
                console.log('Clicked 1Y button');
            }
        });

        // Wait for a second to allow the graph to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the full HTML of the page
        const pageHTML = await page.content();

        // Save the HTML to a file
        fs.writeFileSync('tcgplayer_full_page_FINAL.html', pageHTML);
        console.log('Page HTML saved as tcgplayer_full_page_FINAL.html');

    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
    }
}

scrapeTCGplayer();
