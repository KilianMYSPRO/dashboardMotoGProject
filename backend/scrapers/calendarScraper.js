import { setupBrowser, handleCookieBanner } from './utils.js';

const CALENDAR_URL = 'https://www.motogp.com/fr/calendar?view=list';

export async function scrapeCalendarData() {
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

        const scrapedData = await page.evaluate(() => {
            let seasonCalendar = [];
            let nextGP = null;
            let lastRace = null;
            let lastFinishedEventElement = null;

            document.querySelectorAll('li.calendar-listing__event-container').forEach(event => {
                const gp = event.querySelector('.calendar-listing__event-name')?.innerText.trim();
                const countryName = event.querySelector('.calendar-listing__event-full-name')?.innerText.trim();
                const date = event.querySelector('.calendar-listing__event-date-container')?.innerText.trim();
                const isFinished = event.classList.contains('calendar-listing__event-container--finished');
                const isUpNext = event.classList.contains('up-next');
                
                let winner = null;
                if (isFinished) {
                    winner = event.querySelector('.calendar-listing__podium-result--first .calendar-listing__podium-driver-name')?.innerText.trim() || null;
                    lastFinishedEventElement = event;
                }
                
                if (gp && date) {
                    seasonCalendar.push({ gp, date, winner, countryName });
                }

                if (isUpNext) {
                    nextGP = {
                        name: gp,
                        circuit: countryName || "Circuit à déterminer",
                        countryFlag: event.querySelector('.calendar-listing__event-flag')?.getAttribute('src').split('/').pop().split('.')[0].toUpperCase(),
                        raceDate: date,
                        circuitImage: event.querySelector('.calendar-listing__track-image img')?.src || "https://placehold.co/150x80/141414/FFFFFF?text=Circuit",
                    };
                }
            });
            
            if (lastFinishedEventElement) {
                const podium = [];
                lastFinishedEventElement.querySelectorAll('.calendar-listing__podium-result').forEach(p => {
                    const posText = p.querySelector('.calendar-listing__podium-driver-position')?.innerText;
                    const name = p.querySelector('.calendar-listing__podium-driver-name')?.innerText.trim();
                    if (posText && name) podium.push({ position: parseInt(posText, 10), name });
                });
                lastRace = {
                    name: lastFinishedEventElement.querySelector('.calendar-listing__event-name')?.innerText.trim(),
                    countryName: lastFinishedEventElement.querySelector('.calendar-listing__event-full-name')?.innerText.trim(),
                    results: podium.sort((a, b) => a.position - b.position)
                };
            }
            return { seasonCalendar, nextGP, lastRace };
        });
        
        console.log(`Scraping du calendrier réussi.`);
        return scrapedData;
    } catch (error) {
        console.error("Erreur durant le scraping du calendrier:", error);
        await page.screenshot({ path: 'error_screenshot_calendar.png', fullPage: true });
        return null;
    } finally {
        await browser.close();
    }
}
