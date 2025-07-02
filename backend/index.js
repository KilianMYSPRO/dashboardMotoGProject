import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = 3001;

app.use(cors());

// Données simulées (mock data) - comme dans notre version précédente
// Dans une version de production, vous remplaceriez ceci par un appel à une vraie API
const mockApiData = {
    season: 2025,
    funFacts: ["Valentino Rossi est le seul pilote à avoir remporté des championnats du monde en 125cc, 250cc, 500cc et MotoGP.", "Les motos de MotoGP peuvent atteindre plus de 360 km/h en ligne droite."],
    seasonCalendar: [{ gp: "Qatar", date: "2025-03-09", winner: "F. Bagnaia" }, { gp: "Portugal", date: "2025-03-23", winner: "J. Martín" }, { gp: "Pays-Bas", date: "2025-08-15", winner: null }],
    teamStandings: [{ name: "Ducati Lenovo Team", points: 378 }, { name: "Prima Pramac Racing", points: 280 }],
    riderStandings: [{ position: 1, name: "F. Bagnaia", team: "Ducati Lenovo Team", points: 218, country: "IT", wins: 5, podiums: 8, poles: 4, dnfs: 1, constructor: "Ducati" }, { position: 7, name: "F. Quartararo", team: "Monster Energy Yamaha", points: 115, country: "FR", wins: 0, podiums: 1, poles: 0, dnfs: 1, constructor: "Yamaha" }],
    constructorStandings: [{ position: 1, name: "Ducati", points: 310 }, { position: 2, name: "KTM", points: 205 }],
    lastRace: { name: "GP d'Italie", results: [{ position: 1, name: "F. Bagnaia" }] },
    nextGP: { name: "Grand Prix des Pays-Bas", circuit: "TT Circuit Assen", countryFlag: "🇳🇱", raceDate: "2025-08-15T14:00:00", length: "4.5 km", corners: "18 (6 G, 12 D)", lapRecord: "1:31.892 (F. Bagnaia)", weather: [{day: "Ven", icon: "sun", temp: "22°"}, {day: "Sam", icon: "cloudy", temp: "20°"}, {day: "Dim", icon: "rain", temp: "19°"}] }
};

// Route principale de l'API
app.get('/api/data', async (req, res) => {
    // ICI : LOGIQUE POUR APPELER UNE VRAIE API
    // Exemple avec une vraie API (à décommenter quand vous aurez une clé)
    /*
    try {
        const options = {
            method: 'GET',
            url: 'URL_DE_VOTRE_API_MOTOGP',
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'HOST_DE_VOTRE_API'
            }
        };
        const response = await axios.request(options);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
    */
    
    // Pour l'instant, nous renvoyons les données simulées
    res.json(mockApiData);
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
