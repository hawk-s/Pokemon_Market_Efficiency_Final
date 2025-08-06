const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
puppeteer.use(StealthPlugin());

async function extractAndSaveHTMLInFolders(inputJsonFilePath) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Read the initial links from the JSON file
    const initialLinks = JSON.parse(fs.readFileSync(inputJsonFilePath, 'utf-8'));

    for (let i = 0; i < initialLinks.length; i++) {
        const link = initialLinks[i];
        const folderName = `Set_${i+1}`;
        const folderPath = path.join(__dirname, folderName);

        try {
            await page.goto(link, { waitUntil: 'networkidle2' });

            // Wait for the content to load
            await page.waitForSelector('body');

            const pageContent = await page.evaluate(() => document.documentElement.outerHTML);

            // Create the folder if it doesn't exist
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }

            // Save the HTML content to a file in the folder
            const filePath = path.join(folderPath, 'index.html');
            fs.writeFileSync(filePath, pageContent, 'utf-8');

            console.log(`Content from ${link} saved to ${filePath}.`);
        } catch (e) {
            console.log(`Could not extract content from ${link}: ${e}`);
        }
    }

    await browser.close();
    console.log('Extraction and saving process completed.');
}

// Usage example
const inputJsonFilePath = 'apr_links.json'; // Path to initial JSON file

extractAndSaveHTMLInFolders(inputJsonFilePath);
