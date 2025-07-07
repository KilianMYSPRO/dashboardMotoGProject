import { handleCookieBanner } from './utils.js';

export async function scrapeLastRaceResults(browser, url) {
    if (!url) {
        console.log("Aucune URL de résultats de course fournie, scraping annulé.");
        return null;
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    try {
        console.log(`Navigation vers la page des résultats : ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await handleCookieBanner(page);

        const rowSelector = 'tr.results-table__body-row';
        await page.waitForSelector(rowSelector, { timeout: 45000 });
        console.log("Tableau des résultats de la dernière course trouvé.");

        const raceResults = await page.evaluate(() => {
            const results = [];
            const table = document.querySelector('table.results-table__table');
            if (!table) return [];

            table.querySelectorAll('tbody > tr.results-table__body-row').forEach(row => {
                const cells = row.querySelectorAll('td.results-table__body-cell');
                if (cells.length < 5) return;

                const positionText = cells[1]?.innerText.trim();
                const riderCell = cells[3];
                
                if (!riderCell) return;

                const riderName = riderCell.querySelector('.results-table__rider-name a')?.innerText.trim();
                
                if (riderName) {
                    // Gère les pilotes classés (avec un numéro) et non classés (texte vide)
                    const position = !isNaN(parseInt(positionText)) ? parseInt(positionText) : 'NC';
                    results.push({
                        position: position,
                        name: riderName,
                    });
                }
            });
            return results;
        });

        console.log(`Scraping des résultats réussi : ${raceResults.length} pilotes trouvés.`);
        return raceResults;

    } catch (error) {
        console.error("Erreur durant le scraping des résultats de la course :", error);
        await page.screenshot({ path: 'error_screenshot_last_race.png', fullPage: true });
        return null;
    } finally {
        await page.close();
    }
}
