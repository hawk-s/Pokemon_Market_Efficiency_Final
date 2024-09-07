const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
puppeteer.use(StealthPlugin());

async function extractPopLinks(inputJsonFilePath, outputJsonFilePath) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Read the initial links from the JSON file
    const initialLinks = JSON.parse(fs.readFileSync(inputJsonFilePath, 'utf-8'));

    const popLinks = [];

    for (let link of initialLinks) {
        try {
            await page.goto(link, { waitUntil: 'networkidle2' });

            // Wait for the 'POP' link to appear
            await page.waitForSelector('a[href*="/pop/tcg-cards/"]');

            const popLink = await page.evaluate(() => {
                const element = document.querySelector('a[href*="/pop/tcg-cards/"]');
                return element ? element.href : null;
            });

            if (popLink) {
                popLinks.push(`https://www.psacard.com${popLink}`);
            }
        } catch (e) {
            console.log(`Could not extract 'POP' link from ${link}: ${e}`);
        }
    }

    await browser.close();

    // Save the extracted 'POP' links to a JSON file
    fs.writeFileSync(outputJsonFilePath, JSON.stringify(popLinks, null, 4), 'utf-8');

    console.log(`'POP' links extracted and saved to ${outputJsonFilePath}.`);
}

// Usage example
const inputJsonFilePath = 'sets_links.json'; // Path to your initial JSON file
const outputJsonFilePath = 'pop_links.json'; // Path to the output JSON file
extractPopLinks(inputJsonFilePath, outputJsonFilePath);
