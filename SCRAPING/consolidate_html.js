const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
puppeteer.use(StealthPlugin());

async function extractAndConsolidateHTML(inputJsonFilePath, outputFilePath) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Read the initial links from the JSON file
    const initialLinks = JSON.parse(fs.readFileSync(inputJsonFilePath, 'utf-8'));

    let consolidatedHTML = '<html><head><title>Consolidated Pages</title></head><body>';

    for (let link of initialLinks) {
        try {
            await page.goto(link, { waitUntil: 'networkidle2' });

            // Wait for the content to load
            await page.waitForSelector('body');

            const pageContent = await page.evaluate(() => document.documentElement.outerHTML);

            // Append the extracted HTML content to the consolidated HTML
            consolidatedHTML += `<div class="page-content">${pageContent}</div>`;

            console.log(`Content from ${link} added to consolidated HTML.`);
        } catch (e) {
            console.log(`Could not extract content from ${link}: ${e}`);
        }
    }

    consolidatedHTML += '</body></html>';

    await browser.close();

    // Save the consolidated HTML content to a file
    fs.writeFileSync(outputFilePath, consolidatedHTML, 'utf-8');

    console.log(`Consolidated HTML content saved to ${outputFilePath}.`);
}

// Usage example
const inputJsonFilePath = 'sets_links.json'; // Path to your initial JSON file
const outputFilePath = 'consolidated.html'; // Path to the output HTML file

extractAndConsolidateHTML(inputJsonFilePath, outputFilePath);
