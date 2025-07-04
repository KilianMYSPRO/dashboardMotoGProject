import { handleCookieBanner } from './utils.js';

const STANDINGS_URL = 'https://www.motogp.com/fr/world-standing';

export async function scrapeRiderStandings(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    try {
        console.log(`Navigation vers ${STANDINGS_URL}...`);
        await page.goto(STANDINGS_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await handleCookieBanner(page);

        // CORRECTION: Revenir au sélecteur de lignes qui fonctionnait
        const rowSelector = 'tr.standings-table__body-row';
        await page.waitForSelector(rowSelector, { timeout: 45000 });
        console.log("Lignes du tableau des classements trouvées.");

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
                const points = pointsCell.innerText.trim().split(/[\s\n]/)[0];
                const teamColorStyle = cells[0]?.getAttribute('style');
                const colorMatch = teamColorStyle ? teamColorStyle.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/) : null;
                const teamColor = colorMatch ? colorMatch[0] : '#BBBBBB';
                if (position && riderName && teamName && points && !isNaN(parseInt(points))) {
                    data.push({
                        position: parseInt(position, 10), name: riderName, team: teamName,
                        points: parseInt(points, 10), country: countryCode, constructor: "N/A", teamColor: teamColor,
                        wins: 0, podiums: 0, poles: 0, dnfs: 0,
                    });
                }
            });
            return data;
        });
        console.log(`Scraping des pilotes réussi : ${riderStandings.length} pilotes trouvés.`);
        return { riderStandings };
    } catch (error) {
        console.error("Erreur durant le scraping des pilotes:", error);
        await page.screenshot({ path: 'error_screenshot_standings.png', fullPage: true });
        return null;
    } finally {
        await page.close();
    }
}
