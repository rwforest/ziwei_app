import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    DestinyBoard,
    DestinyConfigBuilder,
    DayTimeGround,
    ConfigType,
    Gender,
    Runtime,
    Sky,
    Ground
} from 'fortel-ziweidoushu';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const palaceNames = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '事業', '田宅', '福德', '父母'];
const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

// Star brightness table (廟旺得地平不得地落陷)
// Ground order: 子丑寅卯辰巳午未申酉戌亥
const brightessTable = {
    // Major Stars (甲級主星)
    '紫微': ['旺', '得', '廟', '廟', '得', '得', '旺', '廟', '廟', '平', '得', '得'],
    '天機': ['廟', '陷', '廟', '旺', '得', '平', '廟', '陷', '旺', '得', '平', '得'],
    '太陽': ['陷', '陷', '旺', '廟', '廟', '廟', '旺', '得', '平', '陷', '陷', '陷'],
    '武曲': ['旺', '得', '廟', '得', '旺', '旺', '旺', '得', '廟', '得', '得', '得'],
    '天同': ['廟', '得', '平', '陷', '陷', '廟', '陷', '得', '平', '陷', '陷', '得'],
    '廉貞': ['平', '廟', '得', '得', '得', '平', '平', '廟', '得', '得', '得', '平'],
    '天府': ['廟', '旺', '得', '得', '廟', '廟', '旺', '廟', '得', '得', '旺', '廟'],
    '太陰': ['廟', '廟', '陷', '陷', '陷', '陷', '陷', '陷', '得', '旺', '廟', '廟'],
    '貪狼': ['旺', '廟', '平', '平', '得', '得', '旺', '廟', '平', '平', '平', '得'],
    '巨門': ['旺', '得', '廟', '廟', '得', '平', '旺', '得', '廟', '廟', '得', '平'],
    '天相': ['廟', '得', '廟', '陷', '得', '廟', '廟', '得', '廟', '陷', '得', '廟'],
    '天梁': ['廟', '陷', '廟', '得', '得', '廟', '廟', '陷', '旺', '得', '得', '廟'],
    '七殺': ['廟', '旺', '平', '廟', '旺', '平', '廟', '旺', '平', '廟', '旺', '平'],
    '破軍': ['旺', '得', '廟', '陷', '陷', '平', '旺', '得', '廟', '陷', '陷', '平'],
    // Key Minor Stars (乙級輔星)
    '文昌': ['得', '得', '陷', '旺', '平', '廟', '得', '得', '陷', '旺', '平', '廟'],
    '文曲': ['旺', '平', '得', '廟', '陷', '得', '旺', '平', '得', '廟', '陷', '得'],
    '左輔': ['廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟'],
    '右弼': ['廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟'],
    '天魁': ['廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟'],
    '天鉞': ['廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟'],
    '祿存': ['廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟', '廟'],
    '天馬': ['旺', '平', '旺', '平', '旺', '平', '旺', '平', '旺', '平', '旺', '平'],
    '擎羊': ['陷', '廟', '陷', '廟', '陷', '廟', '陷', '廟', '陷', '廟', '陷', '廟'],
    '陀羅': ['廟', '陷', '廟', '陷', '廟', '陷', '廟', '陷', '廟', '陷', '廟', '陷'],
    '火星': ['廟', '得', '廟', '得', '廟', '得', '廟', '得', '廟', '得', '廟', '得'],
    '鈴星': ['得', '廟', '得', '廟', '得', '廟', '得', '廟', '得', '廟', '得', '廟'],
    '地空': ['平', '平', '平', '平', '平', '平', '平', '平', '平', '平', '平', '平'],
    '地劫': ['平', '平', '平', '平', '平', '平', '平', '平', '平', '平', '平', '平']
};

const groundOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Get brightness for a star at a specific ground
function getStarBrightness(starName, groundName) {
    const groundIndex = groundOrder.indexOf(groundName);
    if (groundIndex === -1) return null;
    const brightness = brightessTable[starName];
    if (!brightness) return null;
    return brightness[groundIndex];
}

function getMonthSky(yearSkyIndex, lunarMonth) {
    return Sky.get(((yearSkyIndex % 5) * 2 + lunarMonth) % 10);
}

function getMonthGround(lunarMonth) {
    return Ground.get((lunarMonth + 1) % 12);
}

// API: Generate destiny board
app.post('/api/destiny', (req, res) => {
    try {
        const { year, month, day, hour, gender, calendarType, isLeapMonth } = req.body;

        const config = calendarType === 'solar'
            ? DestinyConfigBuilder.withSolar({ year: +year, month: +month, day: +day, bornTimeGround: DayTimeGround.getByHour(+hour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F })
            : DestinyConfigBuilder.withlunar({ year: +year, month: +month, day: +day, isLeapMonth: isLeapMonth || false, bornTimeGround: DayTimeGround.getByHour(+hour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F });

        const board = new DestinyBoard(config);
        const bornSiHua = {};
        board.bornStarDerivativeMap.forEach((star, d) => { bornSiHua[d.displayName] = star.displayName; });

        // Triangle relationships (三方四正)
        // Each palace sees itself + 3 others: opposite (對宮), and two sides (三合)
        const triangleMap = {
            '命宮': ['命宮', '遷移', '事業', '財帛'],
            '兄弟': ['兄弟', '交友', '田宅', '疾厄'],
            '夫妻': ['夫妻', '事業', '遷移', '福德'],
            '子女': ['子女', '田宅', '交友', '父母'],
            '財帛': ['財帛', '福德', '命宮', '遷移'],
            '疾厄': ['疾厄', '父母', '兄弟', '交友'],
            '遷移': ['遷移', '命宮', '財帛', '事業'],
            '交友': ['交友', '兄弟', '子女', '田宅'],
            '事業': ['事業', '夫妻', '命宮', '財帛'],
            '田宅': ['田宅', '子女', '兄弟', '交友'],
            '福德': ['福德', '財帛', '夫妻', '遷移'],
            '父母': ['父母', '疾厄', '子女', '田宅']
        };

        res.json({
            config: { year: config.year, month: config.month, day: config.day, yearSky: config.yearSky.displayName, yearGround: config.yearGround.displayName, bornTime: config.bornTimeGround.displayName, gender: gender === 'M' ? '男' : '女' },
            element: board.element.displayName,
            destinyMaster: board.destinyMaster.displayName,
            bodyMaster: board.bodyMaster.displayName,
            bornSiHua,
            triangleMap,
            cells: board.cells.map(c => ({
                sky: c.sky.displayName,
                ground: c.ground.displayName,
                temples: c.temples.map(t => t.displayName),
                majorStars: c.majorStars.map(s => ({
                    name: s.displayName,
                    brightness: getStarBrightness(s.displayName, c.ground.displayName)
                })),
                minorStars: c.minorStars.map(s => ({
                    name: s.displayName,
                    brightness: getStarBrightness(s.displayName, c.ground.displayName)
                })),
                miniStars: c.miniStars.map(s => s.displayName),
                scholarStar: c.scholarStar?.displayName || null,
                yearGodStar: c.yearGodStar?.displayName || null,
                leaderStar: c.leaderStar?.displayName || null,
                ageStart: c.ageStart,
                ageEnd: c.ageEnd,
                lifeStage: c.lifeStage?.displayName || null,
                // Find the first temple that exists in triangleMap (skip 身宮 which is not a standard palace)
                triangle: (() => {
                    for (const t of c.temples) {
                        if (triangleMap[t.displayName]) {
                            return triangleMap[t.displayName];
                        }
                    }
                    return [];
                })()
            }))
        });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// API: Yearly fortune (流年)
app.post('/api/liuNian', (req, res) => {
    try {
        const { birthYear, birthMonth, birthDay, birthHour, gender, calendarType, isLeapMonth, targetYear } = req.body;

        const config = calendarType === 'solar'
            ? DestinyConfigBuilder.withSolar({ year: +birthYear, month: +birthMonth, day: +birthDay, bornTimeGround: DayTimeGround.getByHour(+birthHour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F })
            : DestinyConfigBuilder.withlunar({ year: +birthYear, month: +birthMonth, day: +birthDay, isLeapMonth: isLeapMonth || false, bornTimeGround: DayTimeGround.getByHour(+birthHour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F });

        const board = new DestinyBoard(config);
        const yr = +targetYear;
        const yearSky = Sky.get((yr - 4) % 10);
        const yearGround = Ground.get((yr - 4) % 12);
        const runtimeStars = Runtime.getRuntimeStarsLocation(yearSky);
        const yearDerivatives = Runtime.getDerivativeMapOf(yearSky);

        const liuNianSiHua = {};
        yearDerivatives.forEach((star, d) => { liuNianSiHua[d.displayName] = star.displayName; });

        const palaces = [];
        for (let i = 0; i < 12; i++) {
            const pg = Ground.get((yearGround.index - i + 12) % 12);
            const cell = board.getCellByGround(pg);
            const lnStars = [], lnSiHua = [];
            runtimeStars.forEach((g, s) => { if (g.index === pg.index) lnStars.push(s.displayName); });
            yearDerivatives.forEach((s, d) => { if (cell.majorStars.concat(cell.minorStars).some(x => x.displayName === s.displayName)) lnSiHua.push(d.displayName); });
            palaces.push({
                liuNianPalace: palaceNames[i],
                ground: pg.displayName,
                benMingPalace: cell.temples.map(t => t.displayName),
                majorStars: cell.majorStars.map(s => s.displayName),
                minorStars: cell.minorStars.map(s => s.displayName),
                miniStars: cell.miniStars.map(s => s.displayName),
                scholarStar: cell.scholarStar?.displayName || null,
                yearGodStar: cell.yearGodStar?.displayName || null,
                leaderStar: cell.leaderStar?.displayName || null,
                liuNianStars: lnStars,
                liuNianSiHua: lnSiHua
            });
        }

        res.json({ year: yr, yearSky: yearSky.displayName, yearGround: yearGround.displayName, age: yr - +birthYear, liuNianSiHua, palaces });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// API: Monthly fortune (流月)
app.post('/api/liuYue', (req, res) => {
    try {
        const { birthYear, birthMonth, birthDay, birthHour, gender, calendarType, isLeapMonth, targetYear } = req.body;

        const config = calendarType === 'solar'
            ? DestinyConfigBuilder.withSolar({ year: +birthYear, month: +birthMonth, day: +birthDay, bornTimeGround: DayTimeGround.getByHour(+birthHour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F })
            : DestinyConfigBuilder.withlunar({ year: +birthYear, month: +birthMonth, day: +birthDay, isLeapMonth: isLeapMonth || false, bornTimeGround: DayTimeGround.getByHour(+birthHour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F });

        const board = new DestinyBoard(config);
        const yr = +targetYear;
        const yearSkyIndex = (yr - 4) % 10;

        const months = [];
        for (let m = 1; m <= 12; m++) {
            const mSky = getMonthSky(yearSkyIndex, m);
            const mGround = getMonthGround(m);
            const mDerivatives = Runtime.getDerivativeMapOf(mSky);
            const mRuntimeStars = Runtime.getRuntimeStarsLocation(mSky);

            const liuYueSiHua = {};
            mDerivatives.forEach((s, d) => { liuYueSiHua[d.displayName] = s.displayName; });

            const palaces = [];
            for (let i = 0; i < 12; i++) {
                const pg = Ground.get((mGround.index - i + 12) % 12);
                const cell = board.getCellByGround(pg);
                const lyStars = [], lySiHua = [];
                mRuntimeStars.forEach((g, s) => { if (g.index === pg.index) lyStars.push(s.displayName); });
                mDerivatives.forEach((s, d) => { if (cell.majorStars.concat(cell.minorStars).some(x => x.displayName === s.displayName)) lySiHua.push(d.displayName); });
                palaces.push({ liuYuePalace: palaceNames[i], ground: pg.displayName, benMingPalace: cell.temples.map(t => t.displayName), majorStars: cell.majorStars.map(s => s.displayName), liuYueStars: lyStars, liuYueSiHua: lySiHua });
            }

            months.push({ month: m, monthName: monthNames[m - 1], monthSky: mSky.displayName, monthGround: mGround.displayName, liuYueSiHua, palaces });
        }

        res.json({ year: yr, months });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// API: 10-Year Fortune (大運)
app.post('/api/daYun', (req, res) => {
    try {
        const { birthYear, birthMonth, birthDay, birthHour, gender, calendarType, isLeapMonth, targetAge } = req.body;

        const config = calendarType === 'solar'
            ? DestinyConfigBuilder.withSolar({ year: +birthYear, month: +birthMonth, day: +birthDay, bornTimeGround: DayTimeGround.getByHour(+birthHour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F })
            : DestinyConfigBuilder.withlunar({ year: +birthYear, month: +birthMonth, day: +birthDay, isLeapMonth: isLeapMonth || false, bornTimeGround: DayTimeGround.getByHour(+birthHour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F });

        const board = new DestinyBoard(config);
        const age = +targetAge;

        // Get the 10-year period sky for this age
        const daYunSky = board.getTenYearSky(age);
        const daYunDerivatives = Runtime.getDerivativeMapOf(daYunSky);
        const daYunStarsLocation = Runtime.getRuntimeStarsLocation(daYunSky);

        const daYunSiHua = {};
        daYunDerivatives.forEach((star, d) => { daYunSiHua[d.displayName] = star.displayName; });

        // Find the 10-year period palace (based on age range)
        let daYunPalaceGround = null;
        let daYunAgeStart = 0;
        let daYunAgeEnd = 0;
        for (const cell of board.cells) {
            if (age >= cell.ageStart && age <= cell.ageEnd) {
                daYunPalaceGround = cell.ground;
                daYunAgeStart = cell.ageStart;
                daYunAgeEnd = cell.ageEnd;
                break;
            }
        }

        // Get all 大運 periods
        const allDaYun = board.cells.map(cell => ({
            ground: cell.ground.displayName,
            ageStart: cell.ageStart,
            ageEnd: cell.ageEnd,
            palace: cell.temples.map(t => t.displayName),
            sky: board.getTenYearSky(cell.ageStart).displayName,
            isActive: age >= cell.ageStart && age <= cell.ageEnd
        })).sort((a, b) => a.ageStart - b.ageStart);

        // Build palaces with 大運 overlay
        const palaces = [];
        for (let i = 0; i < 12; i++) {
            const pg = daYunPalaceGround ? Ground.get((daYunPalaceGround.index - i + 12) % 12) : board.cells[i].ground;
            const cell = board.getCellByGround(pg);
            const dyStars = [];
            daYunStarsLocation.forEach((g, s) => { if (g.index === pg.index) dyStars.push(s.displayName); });
            const dySiHua = [];
            daYunDerivatives.forEach((s, d) => { if (cell.majorStars.concat(cell.minorStars).some(x => x.displayName === s.displayName)) dySiHua.push(d.displayName); });

            palaces.push({
                daYunPalace: palaceNames[i],
                ground: pg.displayName,
                benMingPalace: cell.temples.map(t => t.displayName),
                majorStars: cell.majorStars.map(s => s.displayName),
                minorStars: cell.minorStars.map(s => s.displayName),
                daYunStars: dyStars,
                daYunSiHua: dySiHua
            });
        }

        res.json({
            age: age,
            ageRange: `${daYunAgeStart}-${daYunAgeEnd}`,
            daYunSky: daYunSky.displayName,
            daYunSiHua,
            allDaYun,
            palaces
        });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`🌟 紫微斗數 Server: http://localhost:${PORT}`));
