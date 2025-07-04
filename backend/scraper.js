import puppeteer from 'puppeteer';

const STANDINGS_URL = 'https://www.motogp.com/fr/world-standing';
const CALENDAR_URL = 'https://www.motogp.com/fr/calendar?view=list';

async function setupBrowser() {
    console.log("Lancement du navigateur pour le scraping...");
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        protocolTimeout: 60000 
    });
}

async function handleCookieBanner(page) {
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
}

export async function scrapeRiderStandings() {
    const browser = await setupBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log(`Navigation vers ${STANDINGS_URL}...`);
        await page.goto(STANDINGS_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await handleCookieBanner(page);

        const rowSelector = 'tr.standings-table__body-row';
        await page.waitForSelector(rowSelector, { timeout: 45000 });
        console.log("Lignes du tableau des classements trouvées.");

        // CORRECTION: Logique d'extraction entièrement revue pour être plus robuste
        const riderStandings = await page.evaluate(() => {
            const data = [];
            document.querySelectorAll('tr.standings-table__body-row').forEach(row => {
                const cells = row.querySelectorAll('td.standings-table__body-cell');
                if (cells.length < 4) return;

                const position = cells[0]?.innerText.trim();
                const riderCell = cells[1];
                const teamCell = cells[2];
                const pointsCell = cells[3];
                
                if (!position || !riderCell || !teamCell || !pointsCell) return;
                
                const riderName = riderCell.querySelector('.standings-table__rider-name a')?.innerText.trim();
                const countryImg = riderCell.querySelector('img.standings-table__body-cell-flag');
                const countryCode = countryImg ? countryImg.getAttribute('src').split('/').pop().split('.')[0].toUpperCase() : 'XX';
                const teamName = teamCell.querySelector('span')?.innerText.trim();
                // Prend uniquement la partie numérique du texte de la cellule des points
                const points = pointsCell.innerText.trim().split(/[\s\n]/)[0];
                const bike = "N/A";

                const teamColorStyle = cells[0]?.getAttribute('style');
                const colorMatch = teamColorStyle ? teamColorStyle.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/) : null;
                const teamColor = colorMatch ? colorMatch[0] : '#BBBBBB';

                if (position && riderName && teamName && points && !isNaN(parseInt(points))) {
                    data.push({
                        position: parseInt(position, 10), name: riderName, team: teamName,
                        points: parseInt(points, 10), country: countryCode, constructor: bike,
                        teamColor: teamColor,
                        wins: 0, podiums: 0, poles: 0, dnfs: 0,
                    });
                }
            });
            return data;
        });

        console.log(`Scraping des pilotes réussi : ${riderStandings.length} pilotes trouvés.`);
        return { riderStandings };
    } catch (error) {
        console.error("Erreur durant le scraping des pilotes :", error);
        await page.screenshot({ path: 'error_screenshot_standings.png', fullPage: true });
        return null;
    } finally {
        await browser.close();
    }
}

export async function scrapeMotogpCalendar() {
    const browser = await setupBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log(`Navigation vers ${CALENDAR_URL}...`);
        await page.goto(CALENDAR_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await handleCookieBanner(page);
        
        const eventSelector = 'li.calendar-listing__event-container';
        await page.waitForSelector(eventSelector, { timeout: 45000 });
        console.log("Événements du calendrier trouvés.");

        const seasonCalendar = await page.evaluate(() => {
            const data = [];
            document.querySelectorAll('li.calendar-listing__event-container').forEach(event => {
                const gp = event.querySelector('.calendar-listing__event-name')?.innerText.trim();
                const date = event.querySelector('.calendar-listing__event-date-container')?.innerText.trim();
                const winner = event.querySelector('.calendar-listing__podium-result--first .calendar-listing__podium-driver-name')?.innerText.trim() || null;
                
                if (gp && date) {
                    data.push({ gp, date, winner });
                }
            });
            return data;
        });
        
        console.log(`Scraping du calendrier réussi : ${seasonCalendar.length} courses trouvées.`);
        return { seasonCalendar };

    } catch (error) {
        console.error("Erreur durant le scraping du calendrier :", error);
        await page.screenshot({ path: 'error_screenshot_calendar.png', fullPage: true });
        return null;
    } finally {
        await browser.close();
    }
}


