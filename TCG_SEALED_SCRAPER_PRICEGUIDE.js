const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function downloadHtmlAfterTableLoad(jsonFile, outputFolder = 'tcg_price_guide_sealed_htmls_full', timeout = 20000) {
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

                // Wait for the "sealed products" tab to appear and click it
                const sealedProductsTabSelector = 'button#sealed\\ products';
                await page.waitForSelector(sealedProductsTabSelector, { timeout });
                await page.click(sealedProductsTabSelector);
                console.log("Clicked 'sealed products' tab.");

                // Wait for 2 seconds to ensure the tab content loads
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check for the presence of the "Load All" button
                const loadAllButtonSelector = 'button.tcg-button.tcg-button--md.tcg-standard-button';
                const loadAllButtonExists = await page.$(loadAllButtonSelector);

                if (loadAllButtonExists) {
                    // If the "Load All" button is present, click it
                    await page.click(loadAllButtonSelector);
                    console.log("Clicked 'Load All' button for sealed products.");

                    // Wait for 3 seconds (3000 milliseconds) for the content to load after clicking
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Wait for the table to fully load
                    await page.waitForSelector('.tcg-table__table', { timeout });
                } else {
                    console.log("No 'Load All' button found for sealed products.");
                }

                // Get the page content (HTML)
                const htmlContent = await page.content();

                // Extract the last part of the URL for the filename
                const urlParts = url.split('/');
                const filename = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];

                // Define the output filename
                const outputFilename = path.join(outputFolder, `${filename}_sealed.html`);

                // Save the HTML to a file in the designated folder
                fs.writeFileSync(outputFilename, htmlContent, 'utf8');

                console.log(`Downloaded HTML for sealed products from ${url} and saved as ${outputFilename}`);

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
