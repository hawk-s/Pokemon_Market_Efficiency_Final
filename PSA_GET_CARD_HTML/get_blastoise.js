
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Add stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

async function scrapeCardData() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Visit the URL
    await page.goto("https://www.psacard.com/auctionprices/tcg-cards/2016-pokemon-xy-evolutions/charizard-holo/values/2354697", { waitUntil: 'networkidle2' });

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
        const nextButton = await page.$('#itemResults_next');
        const isDisabled = await page.evaluate(el => el.classList.contains('disabled'), nextButton);

        if (isDisabled) {
            break;
        }

        // Click the next page button
        await nextButton.click();

        // Wait for the table body to load again
        await page.waitForSelector('tbody');

        // Append the new HTML content to the full HTML variable
        const nextPageHtml = await page.evaluate(() => document.querySelector('#itemResults').outerHTML);
        fullHtml += nextPageHtml;
    }

    // Save the HTML content to a file
    fs.writeFileSync('charizard-xy-evolutions.html', fullHtml);

    await browser.close();
}

scrapeCardData();
