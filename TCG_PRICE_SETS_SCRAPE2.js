
// not working right - does not click the expand all printings...

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function downloadHtmlAfterTableLoad(jsonFile, outputFolder = 'tcg_price_guide_htmls2', timeout = 30000) {
    try {
        // Load URLs from JSON file
        const urls = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

        // Create the output folder if it doesn't exist
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: false });

        for (const url of urls) {
            const page = await browser.newPage();

            try {
                // Set the viewport size to ensure the page loads all content
                //await page.setViewport({ width: 1920, height: 1080 });

                // Navigate to the URL
                await page.goto(url, { waitUntil: 'networkidle2', timeout });

                // Click the "Preferences" button
                const preferencesButtonSelector = 'button.tcg-button.tcg-button--sm.tcg-standard-button.tcg-standard-button--alternate.preferences';
                await page.waitForSelector(preferencesButtonSelector, { timeout });
                await page.click(preferencesButtonSelector);

                  // Wait for the "Expand Printings" checkbox to appear
                const expandPrintingsCheckboxSelector = 'label[for="tcg-input-404"] input[type="checkbox"]';
                await page.waitForSelector(expandPrintingsCheckboxSelector, { timeout });

                // Ensure that the checkbox is visible before clicking
                const isVisible = await page.evaluate((selector) => {
                    const element = document.querySelector(selector);
                    return element && element.offsetWidth > 0 && element.offsetHeight > 0;
                }, expandPrintingsCheckboxSelector);

                if (isVisible) {
                    const isChecked = await page.$eval(expandPrintingsCheckboxSelector, checkbox => checkbox.checked);

                    // If the checkbox is not checked, click it
                    if (!isChecked) {
                        await page.click(expandPrintingsCheckboxSelector);
                        console.log('Clicked on Expand Printings checkbox');
                    }
                } else {
                    console.log('Checkbox is not visible, forcing click via JavaScript...');
                    // Force the click using JavaScript in case it's hidden by some overlay
                    await page.evaluate((selector) => {
                        const checkbox = document.querySelector(selector);
                        if (!checkbox.checked) {
                            checkbox.click();
                        }
                    }, expandPrintingsCheckboxSelector);
                
                // Click the "Save Changes" button
                const saveChangesButtonSelector = 'button.tcg-button.tcg-button--sm.tcg-standard-button.tcg-standard-button--priority.save';
                await page.waitForSelector(saveChangesButtonSelector, { timeout });
                await page.click(saveChangesButtonSelector);

                // Wait for 3 seconds for the page to reload with new settings
                await page.waitForTimeout(3000);

                // Wait for the table to fully load after settings are applied
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
