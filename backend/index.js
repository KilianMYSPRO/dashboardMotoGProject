import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { scrapeRiderStandings } from './scrapers/standingsScraper.js';
import { scrapeCalendarData } from './scrapers/calendarScraper.js';

const app = express();
const port = 3001;
app.use(cors());

let cache = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000;

const staticData = {
    funFacts: [
        "Valentino Rossi est le seul pilote à avoir remporté des championnats du monde en 125cc, 250cc, 500cc et MotoGP.",
        "Le circuit le plus long du calendrier est Silverstone avec 5.9 km."
    ],
    // CORRECTION: Objet de base complet pour le prochain GP
    nextGP: { 
        name: "Prochain Grand Prix", 
        circuit: "À déterminer", 
        countryFlag: "🏁", 
        circuitImage: "https://placehold.co/150x80/141414/FFFFFF?text=Circuit", 
        raceDate: new Date().toISOString(), 
        length: "N/A", 
        corners: "N/A", 
        lapRecord: "N/A", 
        weather: [{day: "Ven", icon: "sun", temp: "?"},{day: "Sam", icon: "cloudy", temp: "?"},{day: "Dim", icon: "rain", temp: "?"}] 
    }
};

const parseRaceDateForCountdown = (dateString, year) => {
    if (!dateString || typeof dateString !== 'string') return new Date().toISOString();
    const monthMapping = { 'Jan':0, 'Feb':1, 'Mar':2, 'Apr':3, 'May':4, 'Jun':5, 'Jul':6, 'Aug':7, 'Sep':8, 'Oct':9, 'Nov':10, 'Dec':11 };
    const parts = dateString.split(' - ');
    const endDatePart = parts[parts.length - 1];
    const [day, monthAbbr] = endDatePart.split(' ');
    if (!day || !monthAbbr || monthMapping[monthAbbr] === undefined) return new Date().toISOString();
    return new Date(year, monthMapping[monthAbbr], parseInt(day)).toISOString();
}

app.get('/api/data', async (req, res) => {
    const now = Date.now();

    if (cache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
        console.log("SERVING FROM CACHE: Les données sont fraîches.");
        return res.json(cache);
    }

    console.log("CACHE EXPIRED: Lancement du scraping pour obtenir des données fraîches.");
    
    let browser = null;
    try {
        console.log("Lancement d'une instance unique de navigateur...");
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            protocolTimeout: 60000
        });

        const [standingsData, calendarPageData] = await Promise.all([
            scrapeRiderStandings(browser),
            scrapeCalendarData(browser)
        ]);
        
        if (!standingsData || !calendarPageData) {
            throw new Error("L'une des tâches de scraping a échoué.");
        }

        const year = new Date().getFullYear();
        
        // CORRECTION: Assurer que l'objet nextGP est toujours complet
        const nextGpFromScraper = calendarPageData.nextGP || {};
        const nextGpData = { ...staticData.nextGP, ...nextGpFromScraper };
        if (calendarPageData.nextGP) {
            nextGpData.raceDate = parseRaceDateForCountdown(calendarPageData.nextGP.raceDate, year);
        }

        const fullData = {
            season: year,
            funFacts: staticData.funFacts,
            riderStandings: standingsData.riderStandings,
            seasonCalendar: calendarPageData.seasonCalendar,
            nextGP: nextGpData,
            lastRace: calendarPageData.lastRace || { name: "Dernière Course", results: [] },
            teamStandings: [],
            constructorStandings: [],
        };

        cache = fullData;
        cacheTimestamp = now;
        console.log("CACHE UPDATED: Le cache a été mis à jour.");

        res.json(fullData);

    } catch (error) {
        console.error("Erreur dans la route /api/data:", error.message);
        if (cache) {
            console.warn("SERVING STALE CACHE: Le scraping a échoué.");
            return res.json(cache);
        }
        res.status(500).json({ message: "Erreur lors de la récupération des données via le scraping." });
    } finally {
        if (browser) {
            await browser.close();
            console.log("Instance de navigateur unique fermée.");
        }
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
