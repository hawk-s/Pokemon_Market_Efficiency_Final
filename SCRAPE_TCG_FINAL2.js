const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Add stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

async function scrapeTCGplayer() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Path to the folder containing JSON files with links
        const linksFolder = path.join(__dirname, 'tcg_price_guide_links');
        
        // Get all JSON files from the folder
        const jsonFiles = fs.readdirSync(linksFolder).filter(file => file.endsWith('.json'));

        // Loop through each JSON file
        for (const jsonFile of jsonFiles) {
            const jsonFilePath = path.join(linksFolder, jsonFile);
            
            // Read the JSON file and parse it
            const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
            const pokemonSet = JSON.parse(fileContent);

            // Create a folder for each Pokémon set inside the 'tcg_price_guide_links' folder
            const setFolder = path.join(linksFolder, pokemonSet.set_name);
            if (!fs.existsSync(setFolder)) {
                fs.mkdirSync(setFolder);
            }

            // Loop through each card link in the set
            for (const [index, link] of pokemonSet.links.entries()) {
                try {
                    console.log(`Scraping card ${index + 1} of ${pokemonSet.links.length} from set ${pokemonSet.set_name}: ${link}`);

                    // Navigate to the card page
                    await page.goto(link, { waitUntil: 'networkidle2' });

                    // Wait for a second to ensure everything is loaded
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Wait for the button container to appear
                    await page.waitForSelector('.charts-time-frame', { timeout: 5000 });

                    // Specifically click the "1Y" button
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('.charts-time-frame .charts-item'));
                        const oneYButton = buttons.find(button => button.textContent.trim() === '1Y');
                        if (oneYButton) {
                            oneYButton.click();
                            console.log('Clicked 1Y button');
                        }
                    });

                    // Wait for the graph to update
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Get the full HTML of the page
                    const pageHTML = await page.content();

                    // Extract the card name from the HTML or use the last part of the URL
                    let cardName;
                    try {
                        // Extract card name from the HTML (h1 tag with class 'product-details__name')
                        cardName = await page.evaluate(() => {
                            const nameElement = document.querySelector('h1.product-details__name');
                            return nameElement ? nameElement.textContent.trim() : null;
                        });

                        if (!cardName) {
                            // If not found in HTML, fall back to extracting from the URL
                            cardName = link.split('/').pop();
                        }

                        // Clean up card name (remove problematic characters for file names)
                        cardName = cardName.replace(/[<>:"/\\|?*]+/g, '');

                    } catch (nameError) {
                        console.error('Error extracting card name:', nameError);
                        cardName = `card_${index + 1}`; // fallback
                    }

                    // Define the HTML file name based on the card name
                    const htmlFileName = `${cardName}.html`;
                    const htmlFilePath = path.join(setFolder, htmlFileName);

                    // Save the HTML to the set folder
                    fs.writeFileSync(htmlFilePath, pageHTML);
                    console.log(`HTML saved for card ${index + 1} as ${htmlFileName}`);

                } catch (cardError) {
                    console.error(`Error scraping card ${index + 1} from set ${pokemonSet.set_name}:`, cardError);
                }
            }
        }

    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
    }
}

scrapeTCGplayer();
