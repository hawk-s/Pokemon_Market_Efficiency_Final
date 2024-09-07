const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Add stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

async function scrapeCardData() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Visit the URL
    await page.goto('https://www.psacard.com/auctionprices/tcg-cards/1999-pokemon-game/blastoise-holo/values/544024', { waitUntil: 'networkidle2' });

    // Wait for the table body to load
    await page.waitForSelector('tbody');

    // Select "250" from the dropdown
    await page.select('#itemResults_length select', '250');

    // Wait for the table body to reload
    await page.waitForSelector('tbody');

    // Initialize HTML content variable
    let fullHtml = await page.evaluate(() => document.querySelector('#itemResults').outerHTML);

    // Loop through the pagination if available
    while (true) {
        // Wait for a short time to ensure the page has rendered
        await page.waitForTimeout(1000);

        // Ensure the next button is visible
        const nextButton = await page.$('#itemResults_next');
        if (!nextButton) break;

        await nextButton.evaluate(button => button.scrollIntoView());

        // Check if the next button is disabled
        const isDisabled = await page.evaluate(el => el.classList.contains('disabled'), nextButton);
        if (isDisabled) break;

        // Try clicking the next button, with retries if it fails
        try {
            await nextButton.click();
        } catch (err) {
            console.error("Click failed, retrying...", err);
            continue;  // Retry the click if it fails
        }

        // Wait for the table body to load again
        await page.waitForSelector('tbody');

        // Append the new HTML content to the full HTML variable
        const nextPageHtml = await page.evaluate(() => document.querySelector('#itemResults').outerHTML);
        fullHtml += nextPageHtml;
    }

    // Save the HTML content to a file
    fs.writeFileSync('blastoise-holo.html', fullHtml);

    await browser.close();
}

scrapeCardData();
