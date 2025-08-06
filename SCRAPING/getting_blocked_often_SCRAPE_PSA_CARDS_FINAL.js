const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Add stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

// Helper function to add random delay
function getRandomDelay(min = 500, max = 2000) {  // Delay between 500ms to 2000ms (customizable)
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function scrapeCardData(url, outputPath) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Visit the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Random delay to mimic human behavior
    await delay(getRandomDelay());

    // Wait for the table body to load
    await page.waitForSelector('tbody');

    // Select "250" from the dropdown
    await page.select('#itemResults_length select', '250');

    // Random delay to mimic human behavior
    await delay(getRandomDelay());

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

        // Random delay before clicking the next button
        await delay(getRandomDelay());

        // Click the next page button
        await nextButton.click();

        // Random delay to mimic human behavior
        await delay(getRandomDelay());

        // Wait for the table body to load again
        await page.waitForSelector('tbody');

        // Append the new HTML content to the full HTML variable
        const nextPageHtml = await page.evaluate(() => document.querySelector('#itemResults').outerHTML);
        fullHtml += nextPageHtml;
    }

    // Save the HTML content to a file
    fs.writeFileSync(outputPath, fullHtml);

    await browser.close();
}

async function processSets() {
    for (let i = 1; i <= 151; i++) {
        const setName = `Set_${i}`;
        const setPath = path.join(__dirname, setName);
        const linksFilePath = path.join(setPath, 'links.json');

        // Check if the links.json file exists
        if (fs.existsSync(linksFilePath)) {
            const links = JSON.parse(fs.readFileSync(linksFilePath, 'utf8'));

            // Create an output folder for the set if it doesn't exist
            if (!fs.existsSync(setName)) {
                fs.mkdirSync(setName);
            }

            // Iterate over each link in the links.json file
            for (let j = 0; j < links.length; j++) {
                const url = links[j];
                const cardName = `card_${j + 1}.html`;  // Customize file naming as needed
                const outputPath = path.join(setName, cardName);

                console.log(`Processing ${url} -> ${outputPath}`);

                // Random delay between processing each card
                await delay(getRandomDelay());

                // Scrape the card data and save it to the appropriate set folder
                await scrapeCardData(url, outputPath);
            }
        } else {
            console.warn(`links.json not found for ${setName}`);
        }
    }
}

processSets();
