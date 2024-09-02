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
        try {
            await page.goto(link, { waitUntil: 'networkidle2' });
            await page.waitForSelector('tbody');

            // Check if the select element exists and set the number of observations per page to 250 if possible
            const selectExists = await page.$('select[name="itemResults_length"]');
            if (selectExists) {
                await page.waitForSelector('tbody');
                await page.select('select[name="itemResults_length"]', '250');
                await page.waitForSelector('tbody'); // Wait for the page to load
            }

            let consolidatedHTML = '';
            let hasNextPage = true;

            while (hasNextPage) {
                // Extract the current page content
                const pageContent = await page.evaluate(() => document.documentElement.outerHTML);
                consolidatedHTML += pageContent;

                // Check if there is a next page and navigate to it
                const nextButton = await page.$('a#itemResults_next:not(.disabled)');
                if (nextButton) {
                    await page.waitForSelector('tbody');
                    await nextButton.click();
                    // await page.waitForTimeout(3000); // Adding a delay to wait for the page to load completely
                    await page.waitForSelector('tbody'); // Wait for the page to load
                } else {
                    hasNextPage = false;
                }
            }

            // Extract the card name from the consolidated HTML
            const cardName = await page.evaluate(() => {
                const cardNameElement = document.querySelector('h1.text-xlarge.text-semibold');
                return cardNameElement ? cardNameElement.innerText.trim().replace(/[<>:"\/\\|?*]+/g, '') : 'unknown_card';
            });

            // Save the consolidated HTML to a file in the set folder
            const htmlFilePath = path.join(folderPath, `${cardName}.html`);
            fs.writeFileSync(htmlFilePath, consolidatedHTML, 'utf-8');

            console.log(`Consolidated HTML content for ${cardName} saved to ${htmlFilePath}`);
        } catch (e) {
            console.log(`Could not extract content from ${link}: ${e}`);
        }
    }

    await browser.close();
    console.log(`Scraping process for folder ${folderPath} completed.`);
}

async function processAllFolders(basePath) {
    const folderNames = fs.readdirSync(basePath).filter(name => fs.lstatSync(path.join(basePath, name)).isDirectory());

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
const basePath = __dirname; // Assuming this script is in the same directory as the Set_1, Set_2, ... folders
processAllFolders(basePath);
