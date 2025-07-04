import puppeteer from 'puppeteer';

// Lance et configure une instance de navigateur
export async function setupBrowser() {
    console.log("Lancement du navigateur pour le scraping...");
    return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        protocolTimeout: 60000 
    });
}

// Gère la bannière de consentement aux cookies
export async function handleCookieBanner(page) {
    try {
        console.log("Recherche du bouton 'Accepter les cookies'...");
        await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 10000 });
        await page.click('#onetrust-accept-btn-handler');
        console.log("Bouton 'Accepter les cookies' cliqué.");
        await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
        console.log("Bannière de cookies non trouvée ou déjà acceptée.");
    }
}
