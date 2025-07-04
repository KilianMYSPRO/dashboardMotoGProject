import express from 'express';
import cors from 'cors';
import { scrapeRiderStandings, scrapeMotogpCalendar } from './scraper.js';

const app = express();
const port = 3001;
app.use(cors());

// --- Configuration du Cache ---
let cache = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 heures

// Données statiques
const staticData = {
    funFacts: [
        "Valentino Rossi est le seul pilote à avoir remporté des championnats du monde en 125cc, 250cc, 500cc et MotoGP.",
        "Le circuit le plus long du calendrier est Silverstone avec 5.9 km."
    ],
    nextGP: { name: "Prochain Grand Prix", circuit: "À déterminer", countryFlag: "🏁", circuitImage: "https://placehold.co/150x80/141414/FFFFFF?text=Circuit", raceDate: new Date().toISOString(), length: "N/A", corners: "N/A", lapRecord: "N/A", weather: [{day: "Ven", icon: "sun", temp: "?"},{day: "Sam", icon: "cloudy", temp: "?"},{day: "Dim", icon: "rain", temp: "?"}] }
};

app.get('/api/data', async (req, res) => {
    const now = Date.now();

    if (cache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
        console.log("SERVING FROM CACHE: Les données sont fraîches.");
        return res.json(cache);
    }

    console.log("CACHE EXPIRED: Lancement du scraping pour obtenir des données fraîches.");

    try {
        // Lancer les deux scrapings en parallèle
        const [standingsData, calendarData] = await Promise.all([
            scrapeRiderStandings(),
            scrapeMotogpCalendar()
        ]);

        if (!standingsData || !calendarData) {
            throw new Error("L'une des tâches de scraping a échoué.");
        }

        // Combiner les données
        const fullData = {
            season: new Date().getFullYear(),
            ...staticData,
            riderStandings: standingsData.riderStandings,
            seasonCalendar: calendarData.seasonCalendar,
            // Simuler les classements manquants
            teamStandings: [],
            constructorStandings: [],
            lastRace: { name: "Dernière Course", results: [] },
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

