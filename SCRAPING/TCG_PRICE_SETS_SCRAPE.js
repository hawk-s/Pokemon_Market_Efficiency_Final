// FUNCTION GETTING THE HTMLS OF THE (FULL) TCGPLAYER SETS PRICE GUIDES

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function downloadHtmlAfterTableLoad(jsonFile, outputFolder = 'tcg_price_guide_htmls', timeout = 20000) {
    try {
        // Load URLs from JSON file
        const urls = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

        // Create the output folder if it doesn't exist
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: false, // Set to false if you want to see the browser window
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        for (const url of urls) {
            const page = await browser.newPage();

            try {
                // Set the viewport size to ensure the page loads all content
                await page.setViewport({ width: 1920, height: 1080 });

                // Navigate to the URL
                await page.goto(url, { waitUntil: 'networkidle2', timeout });

                // Wait for the "Load All" button to appear
                const loadAllButtonSelector = 'button.tcg-button.tcg-button--md.tcg-standard-button';
                await page.waitForSelector(loadAllButtonSelector, { timeout });

                // Click the "Load All" button
                await page.click(loadAllButtonSelector);

                // Wait for 3 seconds (3000 milliseconds) for the content to load after clicking
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Wait for the table to fully load after clicking "Load All"
                await page.waitForSelector('.tcg-table__table', { timeout });

                // Get the page content (HTML)
                const htmlContent = await page.content();

                // Extract the last part of the URL for the filename
                const urlParts = url.split('/');
                const filename = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];

                // Define the output filename
                const outputFilename = path.join(outputFolder, `${filename}.html`);

                // Save the HTML to a file in the designated folder
                fs.writeFileSync(outputFilename, htmlContent, 'utf8');

                console.log(`Downloaded HTML from ${url} and saved as ${outputFilename}`);

            } catch (error) {
                console.error(`Failed to process ${url}: ${error.name} - ${error.message}`);
            } finally {
                await page.close();
            }
        }

        await browser.close();

    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    }
}

// Example usage:
downloadHtmlAfterTableLoad('links_tcgp_sets.json');
