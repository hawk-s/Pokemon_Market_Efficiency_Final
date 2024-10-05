const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function downloadHtmlAfterTableLoad(jsonFile, outputFolder = 'tcg_price_guide_htmls_full', timeout = 20000) {
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

                // Wait for the SVG button to appear and click it
                const svgButtonSelector = 'svg.fa-sliders';
                await page.waitForSelector(svgButtonSelector, { timeout });
                await page.click(svgButtonSelector);

                // Wait for the side banner to open
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Locate the checkbox label "Expand Printings" by searching its text and its parent label
                const expandPrintingsLabel = await page.evaluateHandle(() => {
                    const labels = [...document.querySelectorAll('label')];
                    return labels.find(label => label.textContent.includes('Expand Printings'));
                });

                if (expandPrintingsLabel) {
                    // Click the checkbox toggle inside the label
                    const checkboxToggle = await expandPrintingsLabel.$('.tcg-input-checkbox__input-toggle');
                    if (checkboxToggle) {
                        await checkboxToggle.click();
                        console.log("Clicked on 'Expand Printings' checkbox.");
                    } else {
                        console.error("Checkbox toggle for 'Expand Printings' not found.");
                    }
                } else {
                    console.error("'Expand Printings' label not found.");
                }

                // Wait for 2 seconds to ensure the checkbox action is registered
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Click the "Save Changes" button after clicking the checkbox
                const saveChangesButtonSelector = 'button.save';
                await page.waitForSelector(saveChangesButtonSelector, { timeout });
                await page.click(saveChangesButtonSelector);
                console.log("Clicked 'Save Changes' button.");

                // Wait for 2 seconds to ensure the changes are saved
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Now proceed with your existing actions
                // Wait for the "Load All" button to appear
                const loadAllButtonSelector = 'button.tcg-button.tcg-button--md.tcg-standard-button';
                await page.waitForSelector(loadAllButtonSelector, { timeout });

                // Click the "Load All" button
                await page.click(loadAllButtonSelector);
                console.log("Clicked 'Load All' button.");


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
