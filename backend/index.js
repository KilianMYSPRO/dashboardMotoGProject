import express from 'express';
import cors from 'cors';
import { scrapeMotogpData } from './scraper.js'; // Importer notre scraper

const app = express();
const port = 3001;

app.use(cors());

// --- Configuration du Cache ---
let cache = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 heures

// Données statiques pour les widgets non couverts par le scraper
const staticData = {
    funFacts: [
        "Valentino Rossi est le seul pilote à avoir remporté des championnats du monde en 125cc, 250cc, 500cc et MotoGP.",
        "Le circuit le plus long du calendrier est Silverstone avec 5.9 km."
    ],
    seasonCalendar: [ // Le calendrier est difficile à scraper, on le garde statique pour l'instant
        { gp: "Thaïlande", date: "2025-03-02", winner: "M. Marquez" },
        { gp: "Allemagne", date: "2025-07-06", winner: null },
    ],
    nextGP: { name: "Grand Prix d'Allemagne", circuit: "Sachsenring", countryFlag: "🇩🇪", circuitImage: "https://placehold.co/150x80/141414/FFFFFF?text=Sachsenring", raceDate: "2025-07-06T14:00:00", length: "3.7 km", corners: "13 (10 G, 3 D)", lapRecord: "1:21.225 (J. Martin)", weather: [{day: "Ven", icon: "sun", temp: "24°"}, {day: "Sam", icon: "cloudy", temp: "22°"}, {day: "Dim", icon: "sun", temp: "25°"}] }
};

app.get('/api/data', async (req, res) => {
    const now = Date.now();

    if (cache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
        console.log("SERVING FROM CACHE: Les données sont fraîches.");
        return res.json(cache);
    }

    console.log("CACHE EXPIRED: Lancement du scraping pour obtenir des données fraîches.");

    try {
        const scrapedData = await scrapeMotogpData();

        if (!scrapedData) {
            throw new Error("Le scraping a échoué, aucune donnée n'a été retournée.");
        }

        // Simuler les classements manquants à partir des données des pilotes
        const teamStandings = []; // Logique à ajouter si nécessaire
        const constructorStandings = []; // Logique à ajouter si nécessaire

        // Combiner les données scrapées avec les données statiques
        const fullData = {
            season: new Date().getFullYear(),
            ...staticData,
            riderStandings: scrapedData.riderStandings,
            teamStandings,
            constructorStandings,
            lastRace: { name: "Dernière Course", results: [] }, // A scraper sur une autre page si besoin
        };

        // Mettre à jour le cache
        cache = fullData;
        cacheTimestamp = now;
        console.log("CACHE UPDATED: Le cache a été mis à jour avec les données scrapées.");

        res.json(fullData);

    } catch (error) {
        console.error("Erreur dans la route /api/data:", error.message);
        if (cache) {
            console.warn("SERVING STALE CACHE: Le scraping a échoué, service des anciennes données du cache.");
            return res.json(cache);
        }
        res.status(500).json({ message: "Erreur lors de la récupération des données via le scraping." });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
