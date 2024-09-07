const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
puppeteer.use(StealthPlugin());

async function scrapeLinksAndSaveHTML(folderPath) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Read the links from the JSON file
    const linksJsonFilePath = path.join(folderPath, 'links.json');
    const linksData = JSON.parse(fs.readFileSync(linksJsonFilePath, 'utf-8'));

    for (const link of linksData) {
        let consolidatedHTML = '';
        let cardName = 'unknown_card';  // Default card name

        try {
            await page.goto(link, { waitUntil: 'networkidle2' });
            
            // Try to extract the card name early
            cardName = await page.evaluate(() => {
                const cardNameElement = document.querySelector('h1.text-xlarge.text-semibold');
                return cardNameElement ? cardNameElement.innerText.trim().replace(/[<>:"\/\\|?*]+/g, '') : 'unknown_card';
            });

            await page.waitForSelector('tbody');   // CAN HAPPEN THERE IS NO TBODY SINCE NO SALES...! (solve!!)

            // Check if the select element exists and set the number of observations per page to 250 if possible
            const selectExists = await page.$('select[name="itemResults_length"]');
            if (selectExists) {
                await page.waitForSelector('tbody');
                await page.select('select[name="itemResults_length"]', '250');
                await page.waitForSelector('tbody'); // Wait for the page to load
            }

            let hasNextPage = true;

            while (hasNextPage) {
                // Extract the current page content
                const pageContent = await page.evaluate(() => document.documentElement.outerHTML);
                consolidatedHTML += pageContent;

                // Check if there is a next page and navigate to it
                const nextButton = await page.$('a#itemResults_next:not(.disabled)');
                if (nextButton) {
                    await page.waitForSelector('tbody');
                    console.log('About to click next button...');
                    await nextButton.click();
                    console.log('Clicked next button');
                    await page.waitForSelector('tbody'); // Wait for the page to load
                } else {
                    hasNextPage = false;
                }
            }

            // Save the consolidated HTML to a file in the set folder
            const htmlFilePath = path.join(folderPath, `${cardName}.html`);
            fs.writeFileSync(htmlFilePath, consolidatedHTML, 'utf-8');

            console.log(`Consolidated HTML content for ${cardName} saved to ${htmlFilePath}`);
        } catch (e) {
            console.log(`Could not extract content from ${link}: ${e}`);

            // Capture the current HTML content even after the error occurs
            const errorPageContent = await page.evaluate(() => document.documentElement.outerHTML);
            consolidatedHTML += errorPageContent; // Append it to the existing HTML content

            // Use a fallback name based on the card name or part of the URL if card name is unknown
            if (cardName === 'unknown_card') {
                // Extract a fallback name from the URL
                const urlParts = link.split('/');
                const fallbackName = urlParts[urlParts.length - 1] || `error_${Date.now()}`;
                cardName = fallbackName.replace(/[<>:"\/\\|?*]+/g, '');
            }

            // Save the HTML that has been captured so far, using the card name with 'error' appended
            const errorHtmlFilePath = path.join(folderPath, `${cardName}_error_${Date.now()}.html`);
            fs.writeFileSync(errorHtmlFilePath, consolidatedHTML, 'utf-8');
            console.log(`Partial HTML content saved at: ${errorHtmlFilePath}`);

            // Capture a screenshot of the full page in case of an error
            const screenshotPath = path.join(folderPath, `${cardName}_error_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Full-page screenshot saved at: ${screenshotPath}`);
        }
    }

    await browser.close();
    console.log(`Scraping process for folder ${folderPath} completed.`);
}

async function processAllFolders(basePath) {
    const folderNames = fs.readdirSync(basePath).filter(name => {
        if (fs.lstatSync(path.join(basePath, name)).isDirectory()) {
            const match = name.match(/^Set_(\d+)$/);
            if (match) {
                const setNumber = parseInt(match[1], 10);
                return setNumber >= 4 && setNumber <= 20;
            }
        }
        return false;
    });

    for (const folderName of folderNames) {
        const folderPath = path.join(basePath, folderName);
        const linksJsonFilePath = path.join(folderPath, 'links.json');

        if (fs.existsSync(linksJsonFilePath)) {
            console.log(`Processing folder: ${folderPath}`);
            await scrapeLinksAndSaveHTML(folderPath);
        } else {
            console.log(`No links.json found in folder: ${folderPath}`);
        }
    }
}

// Usage
const basePath = __dirname; // Assuming this script is in the same directory as the set_19, set_20, ... folders
processAllFolders(basePath);
