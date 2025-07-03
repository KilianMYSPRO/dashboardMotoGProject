import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());

// --- DONNÉES SIMULÉES (MOCK DATA) ---
// Données mises à jour pour la saison 2025 (basées sur les informations disponibles)
const mockApiData = {
    season: 2025,
    funFacts: [
        "Valentino Rossi est le seul pilote à avoir remporté des championnats du monde en 125cc, 250cc, 500cc et MotoGP.",
        "Le circuit le plus long du calendrier est Silverstone avec 5.9 km.",
        "Les motos de MotoGP peuvent atteindre plus de 360 km/h en ligne droite.",
        "Une moto de MotoGP pèse environ 157 kg, soit à peine plus que son pilote."
    ],
    seasonCalendar: [
        { gp: "Thaïlande", date: "2025-03-02", winner: "M. Marquez" },
        { gp: "Argentine", date: "2025-03-30", winner: "A. Marquez" },
        { gp: "Amériques", date: "2025-04-13", winner: "M. Marquez" },
        { gp: "Espagne", date: "2025-04-27", winner: "F. Bagnaia" },
        { gp: "France", date: "2025-05-11", winner: "M. Marquez" },
        { gp: "Italie", date: "2025-06-22", winner: "M. Marquez" },
        { gp: "Pays-Bas", date: "2025-06-29", winner: "M. Marquez" },
        { gp: "Allemagne", date: "2025-07-06", winner: null },
        { gp: "Grande-Bretagne", date: "2025-08-17", winner: null },
        { gp: "Autriche", date: "2025-08-24", winner: null },
        { gp: "Aragon", date: "2025-09-07", winner: null }
    ],
    teamStandings: [
        { name: "Ducati Lenovo Team", points: 488 },
        { name: "BK8 Gresini Racing MotoGP", points: 436 },
        { name: "Pertamina Enduro VR46", points: 275 },
        { name: "Aprilia Racing", points: 266 },
        { name: "Red Bull KTM Factory Racing", points: 145 },
        { name: "CASTROL Honda LCR", points: 101 },
        { name: "Monster Energy Yamaha", points: 102 },
        { name: "Red Bull KTM Tech3", points: 111 }
    ],
    riderStandings: [
        { position: 1, name: "M. Marquez", team: "Ducati Lenovo Team", points: 307, country: "ES", wins: 5, podiums: 7, poles: 4, dnfs: 0, constructor: "Ducati" },
        { position: 2, name: "A. Marquez", team: "BK8 Gresini Racing MotoGP", points: 239, country: "ES", wins: 1, podiums: 5, poles: 2, dnfs: 1, constructor: "Ducati" },
        { position: 3, name: "F. Bagnaia", team: "Ducati Lenovo Team", points: 181, country: "IT", wins: 1, podiums: 4, poles: 1, dnfs: 2, constructor: "Ducati" },
        { position: 4, name: "F. Morbidelli", team: "Pertamina Enduro VR46", points: 139, country: "IT", wins: 0, podiums: 2, poles: 0, dnfs: 1, constructor: "Ducati" },
        { position: 5, name: "F. Di Giannantonio", team: "Pertamina Enduro VR46", points: 136, country: "IT", wins: 0, podiums: 1, poles: 0, dnfs: 0, constructor: "Ducati" },
        { position: 6, name: "M. Bezzecchi", team: "Aprilia Racing", points: 121, country: "IT", wins: 0, podiums: 2, poles: 1, dnfs: 2, constructor: "Aprilia" },
        { position: 7, name: "J. Zarco", team: "CASTROL Honda LCR", points: 101, country: "FR", wins: 0, podiums: 1, poles: 0, dnfs: 1, constructor: "Honda" },
        { position: 8, name: "P. Acosta", team: "Red Bull KTM Factory Racing", points: 98, country: "ES", wins: 0, podiums: 1, poles: 0, dnfs: 3, constructor: "KTM" },
        { position: 9, name: "F. Aldeguer", team: "BK8 Gresini Racing MotoGP", points: 81, country: "ES", wins: 0, podiums: 1, poles: 0, dnfs: 2, constructor: "Ducati" },
        { position: 10, name: "M. Viñales", team: "Red Bull KTM Tech3", points: 69, country: "ES", wins: 0, podiums: 0, poles: 0, dnfs: 4, constructor: "KTM" },
        { position: 11, name: "F. Quartararo", team: "Monster Energy Yamaha", points: 67, country: "FR", wins: 0, podiums: 0, poles: 0, dnfs: 2, constructor: "Yamaha" },
        { position: 12, name: "A. Ogura", team: "Trackhouse MotoGP Team", points: 49, country: "JP", wins: 0, podiums: 0, poles: 0, dnfs: 3, constructor: "Aprilia" }
    ],
    constructorStandings: [
        { position: 1, name: "Ducati", points: 356 },
        { position: 2, name: "Aprilia", points: 145 },
        { position: 3, name: "KTM", points: 137 },
        { position: 4, name: "Honda", points: 128 },
        { position: 5, name: "Yamaha", points: 98 },
    ],
    lastRace: { name: "GP des Pays-Bas", results: [ { position: 1, name: "M. Marquez" }, { position: 2, name: "M. Bezzecchi" }, { position: 3, name: "F. Bagnaia" }, { position: 7, name: "F. Quartararo" }, { position: 12, name: "J. Zarco" } ] },
    nextGP: { name: "Grand Prix d'Allemagne", circuit: "Sachsenring", countryFlag: "🇩🇪", circuitImage: "https://placehold.co/150x80/141414/FFFFFF?text=Sachsenring", raceDate: "2025-07-06T14:00:00", length: "3.7 km", corners: "13 (10 G, 3 D)", lapRecord: "1:21.225 (J. Martin)", weather: [{day: "Ven", icon: "sun", temp: "24°"}, {day: "Sam", icon: "cloudy", temp: "22°"}, {day: "Dim", icon: "sun", temp: "25°"}] }
};

app.get('/api/data', (req, res) => {
    console.log("Serving mock data from backend.");
    res.json(mockApiData);
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
