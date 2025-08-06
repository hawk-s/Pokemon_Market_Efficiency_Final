from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

def persist_html_content_dynamic(url, file_name='page.html', wait_time=30):
    """
    Fetches the HTML content of a web page using Selenium after waiting for a specific table to load,
    and persists it as a single HTML document.

    Args:
        url (str): URL of the site.
        file_name (str): The name of the output HTML file. Default is 'page.html'.
        wait_time (int): Maximum time in seconds to wait for page elements. Default is 20 seconds.

    Returns:
        None
    """
    # Set up Chrome options
    chrome_options = Options()
    #chrome_options.add_argument("--headless")  # Run in headless mode
    #chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    # Set up the Selenium WebDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Open the website
        driver.get(url)
        
        # Print part of the page source for debugging
        print(driver.page_source[:1000])  # Print the first 1000 characters of the page source
        
        # Wait for the table to be loaded
        WebDriverWait(driver, wait_time).until(
            EC.presence_of_element_located((By.ID, 'tableSets'))
        )

        # Give some time for all JavaScript to execute (optional, you can adjust the sleep time as needed)
        time.sleep(5)

        # Get the page HTML
        page_html = driver.page_source

        # Save the HTML to a file
        with open(file_name, 'w', encoding='utf-8') as file:
            file.write(page_html)

        print(f"HTML content persisted to {file_name}.")
    
    finally:
        # Close the WebDriver
        driver.quit()

# Usage example:
#url = 'https://www.psacard.com/priceguide/non-sports-tcg-card-values/7'
#persist_html_content_dynamic(url, 'page.html')


##############################################2#######################################################################################

import json
from bs4 import BeautifulSoup

def extract_sets_links(html_file_path, json_file_path='sets_links.json'):
    """
    Extracts all Pokémon card set links from a given HTML file and saves them to a JSON file.

    Args:
        html_file_path (str): Path to the HTML file.
        json_file_path (str): Path to the output JSON file. Default is 'sets_links.json'.

    Returns:
        None
    """
    # Read the HTML content from the file
    with open(html_file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()

    # Parse the HTML content with BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract links related to Pokémon card sets
    pokemon_links = []
    for a_tag in soup.find_all('a', href=True):
        if 'poke-mon' in a_tag['href']:
            # Construct full URL if needed, assuming the base URL is 'https://www.psacard.com'
            full_url = 'https://www.psacard.com' + a_tag['href']
            pokemon_links.append(full_url)

    # Save the links to a JSON file
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(pokemon_links, json_file, indent=4)

    print(f"Pokémon links extracted and saved to {json_file_path}.")

# Usage example:
#html_file_path = 'sets_list_page.html'  # Path to the downloaded HTML file
#extract_sets_links(html_file_path, 'sets_links.json')




#########################################################3########################################################################

import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def extract_pop_links(json_file_path, output_json_file='pop_links.json', wait_time=10):
    """
    Loads links from a JSON file, navigates to each link using Selenium, extracts links containing 'POP',
    and saves the extracted links to a new JSON file.

    Args:
        json_file_path (str): Path to the input JSON file containing initial links.
        output_json_file (str): Path to the output JSON file for saving 'POP' links. Default is 'pop_links.json'.
        wait_time (int): Maximum time in seconds to wait for page elements. Default is 10 seconds.

    Returns:
        None
    """
    # Load the initial links from the JSON file
    with open(json_file_path, 'r', encoding='utf-8') as file:
        initial_links = json.load(file)

    # Set up Selenium WebDriver
    service = Service(ChromeDriverManager().install())
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(service=service, options=chrome_options)

    # List to hold the extracted 'POP' links
    pop_links = []

    # Iterate through each link in the initial list
    for link in initial_links:
        driver.get(link)

        try:
            # Wait until the page is fully loaded and Cloudflare challenge is bypassed
            WebDriverWait(driver, wait_time).until(
                lambda d: d.execute_script('return document.readyState') == 'complete'
            )
            
            # Introduce delay to mimic human interaction
            time.sleep(5)

            # Check if Cloudflare challenge page is present
            if "cf-challenge" in driver.page_source.lower():
                print(f"Cloudflare challenge detected on {link}. Please solve it manually.")
                while "cf-challenge" in driver.page_source.lower():
                    time.sleep(10)  # Wait until Cloudflare challenge is solved

            # Wait until the 'POP' link is present
            pop_link_element = WebDriverWait(driver, wait_time).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/pop/tcg-cards/']"))
            )
            pop_link = pop_link_element.get_attribute('href')
            pop_links.append(pop_link)
        except Exception as e:
            print(f"Could not extract 'POP' link from {link}: {e}")

    # Close the WebDriver
    driver.quit()

    # Save the extracted 'POP' links to a JSON file
    with open(output_json_file, 'w', encoding='utf-8') as output_file:
        json.dump(pop_links, output_file, indent=4)

    print(f"'POP' links extracted and saved to {output_json_file}.")

# Usage example:
#json_file_path = 'pokemon_links.json'  
#extract_pop_links(json_file_path, 'pop_links.json')



#########################################4#######################################################################
import json
from bs4 import BeautifulSoup

def extract_pop_apr_links(input_html_file, output_pop_json_file, output_apr_json_file, prefix='https://www.psacard.com'):
    """
    Extracts all POP and APR links from the given HTML file, adds a prefix to each link,
    and writes them to separate JSON files.

    Parameters:
    input_html_file (str): The name of the input HTML file.
    output_pop_json_file (str): The name of the output JSON file for POP links.
    output_apr_json_file (str): The name of the output JSON file for APR links.
    prefix (str): The prefix to add to each link. Default is 'https://www.psacard.com'.
    """
    # Read the HTML content from the file
    with open(input_html_file, 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Initialize lists to store the links
    pop_links = []
    apr_links = []
    
    # Find all anchor tags
    anchor_tags = soup.find_all('a', href=True)
    
    # Loop through all anchor tags to find the relevant links
    for tag in anchor_tags:
        href = tag['href']
        if '/pop/' in href:
            pop_links.append(prefix + href)
        elif '/auctionprices/' in href:
            apr_links.append(prefix + href)
    
    # Write the pop links to the output POP JSON file
    with open(output_pop_json_file, 'w', encoding='utf-8') as json_file:
        json.dump(pop_links, json_file, ensure_ascii=False, indent=4)
    
    # Write the apr links to the output APR JSON file
    with open(output_apr_json_file, 'w', encoding='utf-8') as json_file:
        json.dump(apr_links, json_file, ensure_ascii=False, indent=4)

# Sample usage
'''
prefix = 'https://www.psacard.com'
input_html_file = 'consolidated.html'  # input HTML file name
output_pop_json_file = 'pop_links.json'  #  output JSON file name for POP links
output_apr_json_file = 'apr_links.json'  # output JSON file name for APR links
extract_pop_apr_links(input_html_file, output_pop_json_file, output_apr_json_file, prefix)
'''



#######################5##################################################################

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

def close_compliance_banner(driver):
    """
    Closes the compliance banner if it exists.
    """
    try:
        compliance_banner = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'compliance-banner'))
        )
        allow_button = compliance_banner.find_element(By.XPATH, ".//button[contains(text(), 'Allow All')]")
        allow_button.click()
        time.sleep(1)  # Wait for the banner to close
    except:
        pass  # No compliance banner found or failed to close

def scrape_tcgplayer(url, output_filename):
    """
    Scrapes all pages from the given URL by iterating through the pages using URL syntax and consolidates the HTML content.
    
    Parameters:
    - url (str): The URL to start scraping from.
    - output_filename (str): The name of the file where the consolidated HTML will be saved.
    """
    # Set up Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")

    # Set up the Selenium WebDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        driver.get(url)
        '''
        # Wait for the "View All Sets" button to be clickable and click it
        view_all_sets_button = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.XPATH, "//div[@class='view-sets']//a[contains(text(), 'View All Sets')]"))
        )

        close_compliance_banner(driver)  # Close the compliance banner if it exists

        # Wait for the "View All Sets" button to be clickable and click it
        view_all_sets_button = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.XPATH, "//div[@class='view-sets']//a[contains(text(), 'View All Sets')]"))
        )
        view_all_sets_button.click()
        '''
        wait_time = 20

        # Wait for the table to be loaded
        WebDriverWait(driver, wait_time).until(
            EC.presence_of_element_located((By.ID, 'app'))
        )

        # Give some time for all JavaScript to execute (optional, you can adjust the sleep time as needed)
        time.sleep(2)

        # Initialize a variable to store the consolidated HTML
        consolidated_html = ""

        page_number = 1
        while page_number <= 6:
            # Construct the URL for the current page
            page_url = f"{url}?p={page_number}"
            driver.get(page_url)
            
            # Wait for the table to be loaded
            WebDriverWait(driver, wait_time).until(
                EC.presence_of_element_located((By.ID, 'app'))
            )

            # Give some time for all JavaScript to execute (optional, adjust the sleep time as needed)
            time.sleep(2)

            # Get the page HTML and add it to the consolidated HTML
            page_html = driver.page_source
            consolidated_html += page_html
            
            '''
            # Check if there is a "Next Page" button or if it is disabled
            try:
                next_button = driver.find_element(By.XPATH, "//span[@aria-label='Next Page']//a")
                is_disabled = next_button.get_attribute("disabled")
                if is_disabled == "true" or is_disabled is not None:
                    break
            except:
                break  # No more pages found
            '''
            # Increment the page number
            page_number += 1
            
            # Wait for a short time to ensure the next page is loaded
            time.sleep(2)

            


        
        # Save the consolidated HTML to the specified file
        with open(output_filename, 'w', encoding='utf-8') as file:
            file.write(consolidated_html)
    
    finally:
        driver.quit()

# Example usage
#scrape_tcgplayer('https://www.tcgplayer.com/categories/trading-and-collectible-card-games/pokemon', 'tcg_player_all_sets.html')















################################# 6 #################################################### PSA:

import os
import json
from bs4 import BeautifulSoup

def extract_links_from_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    links = []
    base_url = "https://www.psacard.com"
    
    # Find all <a> tags within the specific table structure
    table = soup.find('table', id='setItemResults')
    if table:
        for row in table.find_all('tr'):
            link_tag = row.find('a')
            if link_tag:
                href = link_tag.get('href')
                if href:
                    links.append(base_url + href)
    
    return links

def process_folders(base_path):
    for folder_name in os.listdir(base_path):
        folder_path = os.path.join(base_path, folder_name)
        if os.path.isdir(folder_path):
            html_file_path = os.path.join(folder_path, 'index.html')
            if os.path.exists(html_file_path):
                with open(html_file_path, 'r', encoding='utf-8') as file:
                    html_content = file.read()
                    links = extract_links_from_html(html_content)
                    
                    # Save links to JSON file
                    json_file_path = os.path.join(folder_path, 'links.json')
                    with open(json_file_path, 'w', encoding='utf-8') as json_file:
                        json.dump(links, json_file, indent=4)
                    
                    print(f"Extracted links from {html_file_path} and saved to {json_file_path}")

# Usage
#base_path = 'path_to_the_folders'  # Replace with the path to the directory containing Set_1, Set_2, ...
#process_folders(base_path)


####################################### 7 ####################################################################



import json
from bs4 import BeautifulSoup

def extract_links_from_html_tcg(input_html: str, output_json: str, prefix: str = "https://www.tcgplayer.com") -> None:
    """
    Extracts all links from the HTML document that match a specific format, attaches a prefix to them,
    and saves the complete URLs into a JSON file.

    Parameters:
    - input_html (str): The path to the HTML file containing the links.
    - output_json (str): The path to the output JSON file where the extracted links will be saved.
    - prefix (str): The prefix to attach to each link. Default is 'https://www.tcgplayer.com'.

    Returns:
    - None: This function does not return anything but saves the extracted links in a JSON file.
    """
    
    # Open and read the HTML file
    with open(input_html, 'r', encoding='utf-8') as file:
        content = file.read()

    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(content, 'html.parser')

    # Find all 'a' tags that match the given format
    links = []
    for a_tag in soup.find_all('a', class_='martech-base-link'):
        href = a_tag.get('href')
        if href and href.startswith("/categories/trading-and-collectible-card-games/pokemon/price-guides/"):
            full_url = prefix + href
            links.append(full_url)

    # Save the full URLs to a JSON file
    with open(output_json, 'w', encoding='utf-8') as json_file:
        json.dump(links, json_file, indent=4)

    print(f"Extracted {len(links)} links and saved to {output_json}")

# Example usage:
# extract_links_from_html_tcg('tcg_player_all_sets.html', 'pokemon_links_tcg_sets.json')




############################################# 8 #################################