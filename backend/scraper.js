import puppeteer from 'puppeteer';

// URL de la page des classements du site officiel
const STANDINGS_URL = 'https://www.motogp.com/fr/world-standing';

// Fonction principale pour scraper les données
export async function scrapeMotogpData() {
    console.log("Lancement du navigateur pour le scraping...");
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        protocolTimeout: 60000 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log(`Navigation vers ${STANDINGS_URL}...`);
        await page.goto(STANDINGS_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        try {
            console.log("Recherche du bouton 'Accepter les cookies'...");
            const acceptButtonSelector = '#onetrust-accept-btn-handler';
            await page.waitForSelector(acceptButtonSelector, { timeout: 10000 });
            await page.click(acceptButtonSelector);
            console.log("Bouton 'Accepter les cookies' cliqué. Attente de la navigation...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (e) {
            console.log("Bannière de cookies non trouvée ou déjà acceptée, continuation...");
        }

        const rowSelector = 'tbody > tr'; 
        console.log(`Recherche des lignes du tableau avec le sélecteur: "${rowSelector}"`);
        await page.waitForSelector(rowSelector, { timeout: 45000 });
        console.log("Lignes du tableau des classements trouvées.");

        // CORRECTION: Logique d'extraction simplifiée et plus robuste
        const riderStandings = await page.evaluate(() => {
            const data = [];
            const rows = document.querySelectorAll('tbody > tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 5) return; // Une ligne valide a au moins 5 cellules

                // Extraction brute du texte de chaque cellule pertinente
                const position = cells[0]?.innerText.trim();
                const riderCellText = cells[1]?.innerText.trim();
                const teamName = cells[2]?.innerText.trim();
                const bike = cells[3]?.innerText.trim();
                
                // Les points sont TOUJOURS dans la dernière cellule de la ligne.
                const points = cells[cells.length - 1]?.innerText.trim();

                const countryImg = cells[1]?.querySelector('img.rider-flag');
                const countryCode = countryImg ? countryImg.getAttribute('src').split('/').pop().split('.')[0].toUpperCase() : 'XX';
                
                // Nettoyage du nom du pilote pour enlever le numéro
                const riderName = riderCellText.replace(/^\d+\s/, '').trim();

                if (position && riderName && teamName && points && !isNaN(parseInt(points))) {
                    data.push({
                        position: parseInt(position, 10),
                        name: riderName,
                        team: teamName,
                        points: parseInt(points, 10),
                        country: countryCode,
                        // Les autres données ne sont pas sur cette page, nous les simulons
                        wins: Math.floor(Math.random() * 3),
                        podiums: Math.floor(Math.random() * 8),
                        poles: Math.floor(Math.random() * 4),
                        dnfs: Math.floor(Math.random() * 3),
                        constructor: bike
                    });
                }
            });
            return data;
        });

        if (riderStandings.length === 0) {
            console.warn("Les lignes du tableau ont été trouvées, mais aucune donnée n'a pu être extraite. La structure interne a peut-être changé.");
            await page.screenshot({ path: 'debug_screenshot_no_data.png' });
        }

        console.log(`Scraping réussi : ${riderStandings.length} pilotes trouvés.`);
        return { riderStandings };

    } catch (error) {
        console.error("Erreur durant le scraping :", error);
        console.log("Prise d'une capture d'écran pour le débogage : error_screenshot.png");
        await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
        return null; // Renvoyer null en cas d'erreur
    } finally {
        await browser.close();
        console.log("Navigateur fermé.");
    }
}
