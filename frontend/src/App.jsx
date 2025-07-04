/*
  ==============================================================================
  FICHIER : frontend/src/App.jsx
  INSTRUCTION : Remplacez TOUT le contenu de ce fichier par le code ci-dessous.
  ==============================================================================
*/
import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- Palettes de couleurs (utilisées comme fallback) ---
const teamColors = {
    'Ducati Lenovo Team': '#CC0000', 'Prima Pramac Racing': '#9B59B6', 'Gresini Racing MotoGP': '#85C1E9',
    'Aprilia Racing': '#009846', 'Pertamina Enduro VR46': '#FFEB3B', 'Red Bull KTM Factory Racing': '#FF6600',
    'Monster Energy Yamaha': '#003399', 'LCR Honda Castrol': '#27AE60', 'Red Bull GASGAS Tech3': '#E74C3C',
    'CASTROL Honda LCR': '#27AE60', 'Trackhouse MotoGP Team': '#0055A4', 'Honda HRC Castrol': '#E4000F',
    'Yamaha Factory Racing': '#003399', 'Prima Pramac Yamaha MotoGP': '#9B59B6', 'IDEMITSU Honda LCR': '#27AE60',
    'Default': '#BBBBBB'
};
const constructorColors = { 'Ducati': '#CC0000', 'KTM': '#FF6600', 'Aprilia': '#009846', 'Yamaha': '#003399', 'Honda': '#E4000F', 'Default': '#FFFFFF' };

// --- Icônes (composants React) ---
const WeatherIcon = ({ iconName }) => {
    const icons = {
        sun: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        cloudy: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
        rain: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 10a4 4 0 11-8 0 4 4 0 018 0zm-4 8v1m0-13v-1m4 4h1m-13 0h-1m11.657 5.657l.707.707m-12.728 0l-.707-.707m12.728-12.728l-.707.707m-12.728 0l.707.707" /></svg>
    };
    return icons[iconName] || null;
};
const MotoIcon = ({ color }) => <svg width="24" height="24" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H16V4C16 3.45 15.55 3 15 3H12C11.45 3 11 3.45 11 4V5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V17C3 17.55 3.45 18 4 18H5C5.55 18 6 17.55 6 17V16H18V17C18 17.55 18.45 18 19 18H20C20.55 18 21 17.55 21 17V12L18.92 6.01ZM6.5 14C5.67 14 5 13.33 5 12.5C5 11.67 5.67 11 6.5 11C7.33 11 8 11.67 8 12.5C8 13.33 7.33 14 6.5 14ZM17.5 14C16.67 14 16 13.33 16 12.5C16 11.67 16.67 11 17.5 11C18.33 11 19 11.67 19 12.5C19 13.33 18.33 14 17.5 14Z"/></svg>;
const CrownIcon = () => <span className="leader-crown">👑</span>;
const TrophyIcon = ({ type }) => {
    const icons = { 1: '🏆', 2: '🥈', 3: '🥉' };
    return <span className="text-2xl">{icons[type]}</span>;
};
const ArrowIcon = ({ collapsed }) => <svg className={`arrow w-6 h-6 text-gray-400 transition-transform duration-300 ${!collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>;

// --- Composants des Widgets ---
const Widget = ({ children, delay, className = '' }) => (
    <div className={`widget ${className}`} style={{ animationDelay: `${delay}s` }}>
        {children}
    </div>
);

const WidgetHeader = ({ title, collapsible = false, collapsed, onToggle }) => (
    <div className={`widget-header ${collapsible ? 'cursor-pointer' : ''}`} onClick={onToggle}>
        <h2 className="text-xl font-bold uppercase">{title}</h2>
        {collapsible && (
            <>
                <span className="ml-auto text-gray-400 text-sm">{collapsed ? '[Déplier pour suivre]' : '[Cliquer pour replier]'}</span>
                <ArrowIcon collapsed={collapsed} />
            </>
        )}
    </div>
);

const FunFactWidget = ({ data, delay }) => (
    <Widget delay={delay} className="lg:col-span-1">
        <WidgetHeader title="Stat du Jour" />
        <div className="widget-body flex items-center text-center text-gray-300 italic">
            <p>"{data}"</p>
        </div>
    </Widget>
);

const CalendarWidget = ({ data, year, delay }) => {
    const calendarRef = useRef(null);
    const nextRaceRef = useRef(null);

    // CORRECTION: Fonction unifiée pour parser et formater la date
    const parseAndFormatDate = (dateString, year) => {
        if (!dateString || typeof dateString !== 'string') return { dateObj: null, formattedDate: 'Date N/A' };

        const monthMapping = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const monthMappingFr = {
            'janv.': 0, 'févr.': 1, 'mars': 2, 'avr.': 3, 'mai': 4, 'juin': 5,
            'juil.': 6, 'août': 7, 'sept.': 8, 'oct.': 9, 'nov.': 10, 'déc.': 11
        };

        const parts = dateString.split(' - ');
        const endDatePart = parts[parts.length - 1];
        const [day, monthAbbr] = endDatePart.split(' ');

        const monthIndex = monthMapping[monthAbbr] || monthMappingFr[monthAbbr?.toLowerCase()];

        if (!day || monthIndex === undefined) {
            return { dateObj: null, formattedDate: dateString };
        }
        
        const dateObj = new Date(year, monthIndex, parseInt(day));
        dateObj.setHours(23, 59, 59, 999);

        if (isNaN(dateObj.getTime())) {
            return { dateObj: null, formattedDate: dateString };
        }

        return {
            dateObj,
            formattedDate: dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        };
    };

    useEffect(() => {
        if (nextRaceRef.current) {
            setTimeout(() => {
                nextRaceRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }, 1200);
        }
    }, [data]);
    
    let nextRaceFound = false;
    const today = new Date();

    return (
        <Widget delay={delay} className="lg:col-span-3">
            <WidgetHeader title="Calendrier de la Saison" />
            <div ref={calendarRef} className="widget-body overflow-x-auto">
                <div className="flex gap-4 p-2">
                    {data.map(race => {
                        const { dateObj, formattedDate } = parseAndFormatDate(race.date, year);
                        const isPast = dateObj ? dateObj < today : race.winner !== null;
                        
                        let isNext = false;
                        if (!isPast && !nextRaceFound) {
                            isNext = true;
                            nextRaceFound = true;
                        }
                        const stateClass = isPast ? 'opacity-50' : isNext ? 'bg-red-500/20 scale-105 ring-2 ring-red-500' : '';
                        
                        return (
                            <div key={race.gp} ref={isNext ? nextRaceRef : null} className={`flex-none text-center p-3 rounded-lg ${stateClass} transition-transform duration-300 hover:bg-gray-500/10`}>
                                <p className="font-bold">{race.gp}</p>
                                <p className="text-sm text-gray-400">{race.date}</p>
                                {race.winner && <p className="text-xs mt-1 text-yellow-400">🏆 {race.winner}</p>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Widget>
    );
};

const LiveRaceWidget = ({ data, delay }) => {
    const [collapsed, setCollapsed] = useState(true);
    const [liveData, setLiveData] = useState([]);
    const intervalRef = useRef(null);

    const toggleCollapse = () => setCollapsed(!collapsed);

    useEffect(() => {
        if (!collapsed) {
            const initialData = data.map((rider, index) => ({ ...rider, progress: 0, currentPosition: index + 1 }));
            setLiveData(initialData);

            intervalRef.current = setInterval(() => {
                setLiveData(prevData => {
                    const newData = prevData.map(rider => {
                        let newProgress = rider.progress;
                        if (newProgress < 100) {
                            newProgress += Math.random() * 0.5;
                            if (newProgress > 100) newProgress = 100;
                        }
                        return { ...rider, progress: newProgress };
                    });
                    newData.sort((a, b) => b.progress - a.progress);
                    return newData.map((rider, index) => ({ ...rider, currentPosition: index + 1 }));
                });
            }, 200);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [collapsed, data]);

    return (
        <Widget delay={delay} className="lg:col-span-4">
            <WidgetHeader title="Course en Direct" collapsible={true} collapsed={collapsed} onToggle={toggleCollapse} />
            <div className={`widget-body collapsible ${collapsed && 'collapsed'} flex flex-col gap-2`}>
                {liveData.map(rider => (
                    <div key={rider.position} className="rider-track flex items-center gap-4 p-2 rounded-md transition-all duration-500 ease-in-out relative overflow-hidden" style={{ order: rider.currentPosition }}>
                        <div className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: rider.teamColor || teamColors.Default, boxShadow: `0 0 8px ${(rider.teamColor || teamColors.Default)}90` }}></div>
                        <div className="w-8 text-center font-bold text-lg pl-2">{rider.currentPosition}</div>
                        <div className="w-24 font-semibold truncate">{rider.name}</div>
                        <div className="flex-1 h-6 bg-gray-800/50 rounded-full overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full w-full bg-repeat-x" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '5% 100%' }}></div>
                            <div className="moto-icon absolute top-1/2 -translate-y-1/2 transition-all duration-200 ease-linear" style={{ left: `${rider.progress}%`, color: rider.teamColor || teamColors.Default }}>
                                <MotoIcon color="currentColor" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Widget>
    );
};

const NextGpWidget = ({ data, delay }) => {
    const [countdown, setCountdown] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

    useEffect(() => {
        if (!data || !data.raceDate) return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const targetDate = new Date(data.raceDate).getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(interval);
                return;
            }

            const days = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
            const hours = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
            const minutes = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
            const seconds = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');
            setCountdown({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(interval);
    }, [data.raceDate]);

    if (!data) return null;

    return (
        <Widget delay={delay} className="lg:col-span-2">
            <WidgetHeader title="Prochain Grand Prix" />
            <div className="widget-body flex flex-col justify-between">
                <div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-shrink-0"><img src={data.circuitImage} alt="Tracé du circuit" className="rounded-lg w-36 h-20 object-cover border border-gray-700"/></div>
                        <div className="text-center sm:text-left">
                            <p className="text-gray-400">À venir</p>
                            <h3 className="text-2xl font-bold">{data.name} {data.countryFlag}</h3>
                            <p className="text-gray-300">{data.circuit}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-3 gap-4 text-center">
                        <div><div className="font-bold text-lg">{data.length}</div><div className="text-xs text-gray-400">Longueur</div></div>
                        <div><div className="font-bold text-lg">{data.corners.split(' ')[0]}</div><div className="text-xs text-gray-400">Virages</div></div>
                        <div><div className="font-bold text-lg">{data.lapRecord}</div><div className="text-xs text-gray-400">Record</div></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-around items-center">
                        {data.weather.map(day => (
                            <div key={day.day} className="text-center">
                                <div className="text-2xl flex justify-center"><WeatherIcon iconName={day.icon} /></div>
                                <div className="font-bold">{day.temp}</div>
                                <div className="text-xs text-gray-400">{day.day}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full mt-4 text-center font-black">
                    <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center">
                        <div className="text-3xl sm:text-4xl">{countdown.days}</div>
                        <div className="text-3xl sm:text-4xl">{countdown.hours}</div>
                        <div className="text-3xl sm:text-4xl">{countdown.minutes}</div>
                        <div className="text-3xl sm:text-4xl motogp-red">{countdown.seconds}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Jours</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Heures</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Min</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Sec</div>
                    </div>
                </div>
            </div>
        </Widget>
    );
};

const LastRaceWidget = ({ data, riders, delay }) => {
    const podium = data.results?.filter(r => r.position <= 3).sort((a, b) => a.position - b.position) || [];
    const frenchRiders = data.results?.filter(r => riders.find(rs => rs.name === r.name && rs.country === 'FR' && r.position > 3)) || [];
    const podiumColors = ['border-yellow-400', 'border-gray-400', 'border-yellow-600'];

    return (
        <Widget delay={delay} className="lg:col-span-2">
            <WidgetHeader title="Derniers Résultats" />
            <div className="widget-body">
                <h3 className="font-bold mb-3 text-gray-300">Podium du {data.name}</h3>
                <div className="space-y-2">
                    {podium.map((rider, index) => {
                        const riderDetails = riders.find(r => r.name.includes(rider.name));
                        return (
                            <div key={index} className={`flex items-center gap-3 p-2 rounded-md bg-gray-500/10 border-l-4 ${podiumColors[index]}`}>
                                <TrophyIcon type={rider.position} />
                                <div className="font-bold">{riderDetails?.name}</div>
                                <div className="text-sm text-gray-400 ml-auto">{riderDetails?.team}</div>
                            </div>
                        );
                    })}
                </div>
                {frenchRiders.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <h4 className="font-semibold text-gray-300">Nos Français :</h4>
                        <p className="text-sm text-gray-400">{frenchRiders.map(r => `${r.name} - P${r.position}`).join(', ')}</p>
                    </div>
                )}
            </div>
        </Widget>
    );
};

const LeadersComparisonWidget = ({ data, delay }) => {
    const leaders = data.slice(0, 5);
    const maxDnfs = Math.max(...leaders.map(l => l.dnfs));
    const chartData = {
        labels: ['Victoires', 'Podiums', 'Pôles', 'Fiabilité (Abandons)'],
        datasets: leaders.map((leader, index) => {
            const colors = ['#FF4136', '#00AEEF', '#FFDC00', '#2ECC40', '#AAAAAA'];
            const color = colors[index % colors.length];
            return {
                label: leader.name,
                data: [leader.wins, leader.podiums, leader.poles, maxDnfs - leader.dnfs + 1],
                borderColor: color,
                backgroundColor: `${color}33`,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: color
            };
        })
    };
    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { color: '#f0f0f0', font: { family: "'Titillium Web', sans-serif" } } } },
        scales: { r: { angleLines: { color: 'rgba(255, 255, 255, 0.2)' }, grid: { color: 'rgba(255, 255, 255, 0.2)' }, pointLabels: { color: '#f0f0f0', font: { size: 12, family: "'Titillium Web', sans-serif" } }, ticks: { display: false, stepSize: 2 } } }
    };

    return (
        <Widget delay={delay} className="lg:col-span-4">
            <WidgetHeader title="Comparatif des Leaders" />
            <div className="widget-body relative h-96"><Radar data={chartData} options={chartOptions} /></div>
        </Widget>
    );
};

const StandingsBarWidget = ({ title, data, colorPalette, delay }) => {
    if (!data || data.length === 0) return null;
    
    const standings = data.sort((a, b) => b.points - a.points);
    const maxPoints = Math.max(...standings.map(c => c.points));

    return (
        <Widget delay={delay} className="lg:col-span-4">
            <WidgetHeader title={title} />
            <div className="widget-body space-y-4 pt-2">
                {standings.map(item => {
                    const color = colorPalette[item.name] || colorPalette.Default;
                    const widthPercentage = (item.points / maxPoints) * 100;
                    return (
                        <div key={item.name} className="w-full">
                            <div className="flex justify-between items-baseline mb-1">
                                <p className="font-bold uppercase text-base">{item.name}</p>
                                <p className="font-black text-lg" style={{ color: color }}>{item.points} pts</p>
                            </div>
                            <div className="h-2 w-full bg-gray-700/50 rounded-full">
                                <div className="h-2 rounded-full" style={{ width: `${widthPercentage}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}90` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Widget>
    );
};


// --- App principal ---
function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3001/api/data')
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(apiData => {
                setData(apiData);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erreur de chargement des données:", error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-2xl">Chargement du Dashboard...</div>;
    }

    if (!data) {
        return <div className="flex justify-center items-center h-screen text-2xl text-red-500">Erreur: Impossible de charger les données. Le backend est-il lancé ?</div>;
    }
    
    const getCountryFlag = (countryCode) => {
        const flags = { 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'ZA': '🇿🇦', 'AU': '🇦🇺', 'PT': '🇵🇹', 'GB': '🇬🇧', 'JP': '🇯🇵', 'THA': '🇹🇭', 'QAT': '🇶🇦', 'USA': '🇺🇸', 'ARG': '🇦🇷', 'DEU': '🇩🇪', 'CZE': '🇨🇿', 'AUT': '🇦🇹', 'HUN': '🇭🇺', 'CAT': '🏁', 'SMR': '🇸🇲', 'IDN': '🇮🇩', 'MYS': '🇲🇾', 'NLD': '🇳🇱', 'VAL': '🏁' };
        return flags[countryCode] || '🏳️';
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider">
                        Moto<span className="motogp-red">GP</span> Dashboard
                    </h1>
                    <div className="text-right"><p className="text-sm text-gray-400">Saison {data.season}</p></div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <FunFactWidget data={data.funFacts[0]} delay={0.1} />
                    <CalendarWidget data={data.seasonCalendar} year={data.season} delay={0.2} />
                    <LiveRaceWidget data={data.riderStandings} delay={0.3} />

                    <Widget delay={0.4} className="lg:col-span-3">
                        <WidgetHeader title="Classement Pilotes" />
                        <div className="widget-body space-y-2">
                            {data.riderStandings.slice(0, 12).map(rider => {
                                const isLeader = rider.position === 1;
                                const highlightClass = isLeader ? 'bg-red-500/20 border-l-2 border-red-500' : 'hover:bg-gray-500/10';
                                // CORRECTION: Utilisation de la couleur scrapée
                                const color = rider.teamColor || teamColors[rider.team] || teamColors.Default;
                                return (
                                    <div key={rider.position} className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-md transition-all duration-300 ${highlightClass}`}>
                                        <div className={`col-span-1 text-center font-black text-lg ${isLeader && 'motogp-red'}`}>{rider.position}</div>
                                        <div className="col-span-1 text-2xl">{getCountryFlag(rider.country)}</div>
                                        <div className="col-span-5 sm:col-span-4 font-bold flex items-center gap-2 text-base">{rider.name} {isLeader && <CrownIcon />}</div>
                                        <div className="col-span-5 sm:col-span-4 text-sm font-semibold" style={{ color: color, textShadow: `0 0 5px ${color}50` }}>{rider.team}</div>
                                        <div className="col-span-12 sm:col-span-2 text-right font-black text-lg pr-2">{rider.points} pts</div>
                                    </div>
                                );
                            })}
                        </div>
                    </Widget>
                    
                    <Widget delay={0.5} className="lg:col-span-1">
                        <WidgetHeader title="Le Coin des Français 🇫🇷" />
                        <div className="widget-body space-y-4">
                            {data.riderStandings.filter(r => r.country === 'FR').map(rider => (
                                <div key={rider.name} className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30 hover:bg-blue-900/40 transition-colors">
                                    <p className="font-bold text-lg">{rider.name}</p>
                                    <p className="text-sm text-gray-300">{rider.team}</p>
                                </div>
                            ))}
                        </div>
                    </Widget>
                    
                    <NextGpWidget data={data.nextGP} delay={0.6} />
                    <LastRaceWidget data={data.lastRace} riders={data.riderStandings} delay={0.7} />
                    <LeadersComparisonWidget data={data.riderStandings} delay={0.8} />
                    <StandingsBarWidget title="Classement Constructeurs" data={data.constructorStandings} colorPalette={constructorColors} delay={0.9} />
                    <StandingsBarWidget title="Classement Équipes" data={data.teamStandings} colorPalette={teamColors} delay={1.0} />
                </main>
            </div>
        </div>
    );
}

export default App;
