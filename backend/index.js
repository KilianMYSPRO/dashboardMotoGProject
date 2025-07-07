import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { scrapeRiderStandings } from './scrapers/standingsScraper.js';
import { scrapeCalendarData } from './scrapers/calendarScraper.js';
import { scrapeLastRaceResults } from './scrapers/lastRaceScraper.js';

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
    nextGP: { name: "Prochain Grand Prix", circuit: "À déterminer", countryFlag: "🏁", circuitImage: "https://placehold.co/150x80/141414/FFFFFF?text=Circuit", raceDate: new Date().toISOString(), length: "N/A", corners: "N/A", lapRecord: "N/A", weather: [{day: "Ven", icon: "sun", temp: "?"},{day: "Sam", icon: "cloudy", temp: "?"},{day: "Dim", icon: "rain", temp: "?"}] }
};

const countryTranslations = {
    'THAILAND': 'de Thaïlande', 'ARGENTINA': "d'Argentine", 'USA': 'des Amériques', 'SPAIN': "d'Espagne",
    'FRANCE': 'de France', 'ITALY': "d'Italie", 'NETHERLANDS': 'des Pays-Bas', 'GERMANY': "d'Allemagne",
    'UNITED KINGDOM': 'de Grande-Bretagne', 'AUSTRIA': "d'Autriche", 'ARAGON': "d'Aragon",
    'CATALONIA': 'de Catalogne', 'SAN MARINO': 'de Saint-Marin', 'JAPAN': 'du Japon',
    'INDONESIA': "d'Indonésie", 'AUSTRALIA': "d'Australie", 'MALAYSIA': 'de Malaisie',
    'PORTUGAL': 'du Portugal', 'VALENCIA': 'de Valence', 'QATAR': 'du Qatar',
    'CZECHIA': 'de Tchéquie', 'HUNGARY': 'de Hongrie'
};

const gpNameTranslations = countryTranslations;

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

        const standingsData = await scrapeRiderStandings(browser);
        const calendarPageData = await scrapeCalendarData(browser);
        
        let lastRaceResults = null;
        if (calendarPageData && calendarPageData.lastRace && calendarPageData.lastRace.countryCode) {
            const year = new Date().getFullYear();
            const countryCode = calendarPageData.lastRace.countryCode.toLowerCase();
            const resultsUrl = `https://www.motogp.com/fr/gp-results/${year}/${countryCode}/motogp/rac/classification`;
            lastRaceResults = await scrapeLastRaceResults(browser, resultsUrl);
        }
        
        if (!standingsData || !calendarPageData) {
            throw new Error("L'une des tâches de scraping a échoué.");
        }

        const year = new Date().getFullYear();
        
        const translatedCalendar = calendarPageData.seasonCalendar.map(race => ({
            ...race,
            gp: `Grand Prix ${gpNameTranslations[race.countryName] || race.countryName || race.gp}`
        }));

        let nextGpData = calendarPageData.nextGP || {};
        if (calendarPageData.nextGP) {
            nextGpData.name = `Grand Prix ${gpNameTranslations[nextGpData.circuit] || nextGpData.circuit}`;
            nextGpData.circuit = countryTranslations[nextGpData.circuit] || nextGpData.circuit;
            nextGpData.raceDate = parseRaceDateForCountdown(calendarPageData.nextGP.raceDate, year);
        }

        let lastRaceData = calendarPageData.lastRace || { name: "Dernière Course", results: [] };
        if (calendarPageData.lastRace && calendarPageData.lastRace.countryName) {
            lastRaceData.name = `Grand Prix ${gpNameTranslations[calendarPageData.lastRace.countryName] || calendarPageData.lastRace.countryName}`;
        }
        if (lastRaceResults && lastRaceResults.length > 0) {
            lastRaceData.results = lastRaceResults;
        }

        const fullData = {
            season: year,
            ...staticData,
            riderStandings: standingsData.riderStandings,
            seasonCalendar: translatedCalendar,
            nextGP: { ...staticData.nextGP, ...nextGpData },
            lastRace: lastRaceData,
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
