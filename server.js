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
    Ground,
    defaultCalendar
} from 'fortel-ziweidoushu';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const palaceNames = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '事業', '田宅', '福德', '父母'];
const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

// 飛星四化 Transformation Table - maps 天干 to which stars receive 祿權科忌
const flyingStarTable = {
    '甲': { '祿': '廉貞', '權': '破軍', '科': '武曲', '忌': '太陽' },
    '乙': { '祿': '天機', '權': '天梁', '科': '紫微', '忌': '太陰' },
    '丙': { '祿': '天同', '權': '天機', '科': '文昌', '忌': '廉貞' },
    '丁': { '祿': '太陰', '權': '天同', '科': '天機', '忌': '巨門' },
    '戊': { '祿': '貪狼', '權': '太陰', '科': '右弼', '忌': '天機' },
    '己': { '祿': '武曲', '權': '貪狼', '科': '天梁', '忌': '文曲' },
    '庚': { '祿': '太陽', '權': '武曲', '科': '太陰', '忌': '天同' },
    '辛': { '祿': '巨門', '權': '太陽', '科': '文曲', '忌': '文昌' },
    '壬': { '祿': '天梁', '權': '紫微', '科': '左輔', '忌': '武曲' },
    '癸': { '祿': '破軍', '權': '巨門', '科': '太陰', '忌': '貪狼' }
};

// ========== BRIGHTNESS TABLE CONFIGURATION ==========
// 'zhongzhou' = 中州派 brightness (from brightness.csv)
// 'sanhe' = 三合派 brightness (hardcoded default)
const BRIGHTNESS_SCHOOL = 'zhongzhou';
// ====================================================

// 中州派 Brightness table from brightness.csv (ground order: 寅卯辰巳午未申酉戌亥子丑)
const zhongzhouBrightnessTable = {
    '紫微': { '寅': '旺', '卯': '旺', '辰': '得', '巳': '旺', '午': '廟', '未': '廟', '申': '旺', '酉': '旺', '戌': '得', '亥': '旺', '子': '平', '丑': '廟' },
    '天機': { '寅': '得', '卯': '旺', '辰': '利', '巳': '平', '午': '廟', '未': '陷', '申': '得', '酉': '旺', '戌': '利', '亥': '平', '子': '廟', '丑': '陷' },
    '太陽': { '寅': '旺', '卯': '廟', '辰': '旺', '巳': '旺', '午': '旺', '未': '得', '申': '得', '酉': '陷', '戌': '不', '亥': '陷', '子': '陷', '丑': '不' },
    '武曲': { '寅': '得', '卯': '利', '辰': '廟', '巳': '平', '午': '旺', '未': '廟', '申': '得', '酉': '利', '戌': '廟', '亥': '平', '子': '旺', '丑': '廟' },
    '天同': { '寅': '利', '卯': '平', '辰': '平', '巳': '廟', '午': '陷', '未': '不', '申': '旺', '酉': '平', '戌': '平', '亥': '廟', '子': '旺', '丑': '不' },
    '廉貞': { '寅': '廟', '卯': '平', '辰': '利', '巳': '陷', '午': '平', '未': '利', '申': '廟', '酉': '平', '戌': '利', '亥': '陷', '子': '平', '丑': '利' },
    '天府': { '寅': '廟', '卯': '得', '辰': '廟', '巳': '得', '午': '旺', '未': '廟', '申': '得', '酉': '旺', '戌': '廟', '亥': '得', '子': '廟', '丑': '廟' },
    '太陰': { '寅': '旺', '卯': '陷', '辰': '陷', '巳': '陷', '午': '不', '未': '不', '申': '利', '酉': '不', '戌': '旺', '亥': '廟', '子': '廟', '丑': '廟' },
    '貪狼': { '寅': '平', '卯': '利', '辰': '廟', '巳': '陷', '午': '旺', '未': '廟', '申': '平', '酉': '利', '戌': '廟', '亥': '陷', '子': '旺', '丑': '廟' },
    '巨門': { '寅': '廟', '卯': '廟', '辰': '陷', '巳': '旺', '午': '旺', '未': '不', '申': '廟', '酉': '廟', '戌': '陷', '亥': '旺', '子': '旺', '丑': '不' },
    '天相': { '寅': '廟', '卯': '陷', '辰': '得', '巳': '得', '午': '廟', '未': '得', '申': '廟', '酉': '陷', '戌': '得', '亥': '得', '子': '廟', '丑': '廟' },
    '天梁': { '寅': '廟', '卯': '廟', '辰': '廟', '巳': '陷', '午': '廟', '未': '旺', '申': '陷', '酉': '得', '戌': '廟', '亥': '陷', '子': '廟', '丑': '旺' },
    '七殺': { '寅': '廟', '卯': '旺', '辰': '廟', '巳': '平', '午': '旺', '未': '廟', '申': '廟', '酉': '廟', '戌': '廟', '亥': '平', '子': '旺', '丑': '廟' },
    '破軍': { '寅': '得', '卯': '陷', '辰': '旺', '巳': '平', '午': '廟', '未': '旺', '申': '得', '酉': '陷', '戌': '旺', '亥': '平', '子': '廟', '丑': '旺' },
    '文昌': { '寅': '陷', '卯': '利', '辰': '得', '巳': '廟', '午': '陷', '未': '利', '申': '得', '酉': '廟', '戌': '陷', '亥': '利', '子': '得', '丑': '廟' },
    '文曲': { '寅': '平', '卯': '旺', '辰': '得', '巳': '廟', '午': '陷', '未': '旺', '申': '得', '酉': '廟', '戌': '陷', '亥': '旺', '子': '得', '丑': '廟' },
    '火星': { '寅': '廟', '卯': '利', '辰': '陷', '巳': '得', '午': '廟', '未': '利', '申': '陷', '酉': '得', '戌': '廟', '亥': '利', '子': '陷', '丑': '得' },
    '鈴星': { '寅': '廟', '卯': '利', '辰': '陷', '巳': '得', '午': '廟', '未': '利', '申': '陷', '酉': '得', '戌': '廟', '亥': '利', '子': '陷', '丑': '得' },
    '擎羊': { '寅': '-', '卯': '陷', '辰': '廟', '巳': '-', '午': '陷', '未': '廟', '申': '-', '酉': '陷', '戌': '廟', '亥': '-', '子': '陷', '丑': '廟' },
    '陀羅': { '寅': '陷', '卯': '-', '辰': '廟', '巳': '陷', '午': '-', '未': '廟', '申': '陷', '酉': '-', '戌': '廟', '亥': '陷', '子': '-', '丑': '廟' }
};

// 三合派 Brightness table (ground order: 子丑寅卯辰巳午未申酉戌亥)
const sanheBrightnessTable = {
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

const sanheGroundOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Get brightness for a star at a specific ground
function getStarBrightness(starName, groundName) {
    if (BRIGHTNESS_SCHOOL === 'zhongzhou') {
        // Use 中州派 table (direct ground lookup)
        const starData = zhongzhouBrightnessTable[starName];
        if (!starData) return null;
        const brightness = starData[groundName];
        return brightness === '-' ? null : brightness;
    } else {
        // Use 三合派 table (index-based lookup)
        const groundIndex = sanheGroundOrder.indexOf(groundName);
        if (groundIndex === -1) return null;
        const brightness = sanheBrightnessTable[starName];
        if (!brightness) return null;
        return brightness[groundIndex];
    }
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

        // Find 命宮 and get its major stars (if 空宮, get from 對宮 遷移)
        const destinyPalaceCell = board.cells.find(c => c.temples.some(t => t.displayName === '命宮'));
        let destinyPalaceMajorStars = '';
        if (destinyPalaceCell && destinyPalaceCell.majorStars.length > 0) {
            destinyPalaceMajorStars = destinyPalaceCell.majorStars.map(s => s.displayName).join(' ');
        } else if (destinyPalaceCell) {
            // 命宮 is 空宮, get from 對宮 (opposite palace, 6 positions away)
            const destinyGround = destinyPalaceCell.ground;
            const oppositeGroundIndex = (destinyGround.index + 6) % 12;
            const oppositeCell = board.cells.find(c => c.ground.index === oppositeGroundIndex);
            if (oppositeCell && oppositeCell.majorStars.length > 0) {
                destinyPalaceMajorStars = oppositeCell.majorStars.map(s => s.displayName).join(' ') + ' (借)';
            } else {
                destinyPalaceMajorStars = '空宮';
            }
        } else {
            destinyPalaceMajorStars = '空宮';
        }

        res.json({
            config: { year: config.year, month: config.month, day: config.day, yearSky: config.yearSky.displayName, yearGround: config.yearGround.displayName, bornTime: config.bornTimeGround.displayName, gender: gender === 'M' ? '男' : '女' },
            element: board.element.displayName,
            destinyMaster: board.destinyMaster.displayName,
            bodyMaster: board.bodyMaster.displayName,
            destinyPalaceMajorStars,
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
                // Flying star (飛星四化) - where the 4 transformations fly to from this palace
                flyingStar: (() => {
                    const skyName = c.sky.displayName;
                    const transforms = flyingStarTable[skyName];
                    if (!transforms) return null;

                    const result = {};
                    for (const [type, starName] of Object.entries(transforms)) {
                        // Find which cell contains this star
                        const targetCell = board.cells.find(cell =>
                            cell.majorStars.some(s => s.displayName === starName) ||
                            cell.minorStars.some(s => s.displayName === starName)
                        );
                        if (targetCell) {
                            result[type] = {
                                star: starName,
                                ground: targetCell.ground.displayName,
                                palace: targetCell.temples.map(t => t.displayName).join(' ')
                            };
                        } else {
                            result[type] = { star: starName, ground: null, palace: null };
                        }
                    }
                    return result;
                })(),
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
                majorStars: cell.majorStars.map(s => ({
                    name: s.displayName,
                    brightness: getStarBrightness(s.displayName, pg.displayName)
                })),
                minorStars: cell.minorStars.map(s => ({
                    name: s.displayName,
                    brightness: getStarBrightness(s.displayName, pg.displayName)
                })),
                miniStars: cell.miniStars.map(s => s.displayName),
                scholarStar: cell.scholarStar?.displayName || null,
                yearGodStar: cell.yearGodStar?.displayName || null,
                leaderStar: cell.leaderStar?.displayName || null,
                liuNianStars: lnStars,
                liuNianSiHua: lnSiHua
            });
        }

        // Find 流年命宮 (first palace) and get its major stars
        const liuNianMingGong = palaces.find(p => p.liuNianPalace === '命宮');
        let liuNianMajorStars = '';
        if (liuNianMingGong && liuNianMingGong.majorStars.length > 0) {
            liuNianMajorStars = liuNianMingGong.majorStars.map(s => s.name).join(' ');
        } else if (liuNianMingGong) {
            // 流年命宮 is 空宮, get from 對宮
            const oppositeIdx = palaces.findIndex(p => p.liuNianPalace === '遷移');
            if (oppositeIdx !== -1 && palaces[oppositeIdx].majorStars.length > 0) {
                liuNianMajorStars = palaces[oppositeIdx].majorStars.map(s => s.name).join(' ') + ' (借)';
            } else {
                liuNianMajorStars = '空宮';
            }
        } else {
            liuNianMajorStars = '空宮';
        }

        res.json({ year: yr, yearSky: yearSky.displayName, yearGround: yearGround.displayName, age: yr - +birthYear, liuNianSiHua, liuNianMajorStars, palaces });
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
                palaces.push({
                    liuYuePalace: palaceNames[i],
                    ground: pg.displayName,
                    benMingPalace: cell.temples.map(t => t.displayName),
                    majorStars: cell.majorStars.map(s => ({
                        name: s.displayName,
                        brightness: getStarBrightness(s.displayName, pg.displayName)
                    })),
                    minorStars: cell.minorStars.map(s => ({
                        name: s.displayName,
                        brightness: getStarBrightness(s.displayName, pg.displayName)
                    })),
                    liuYueStars: lyStars,
                    liuYueSiHua: lySiHua
                });
            }

            // Find 流月命宮 and get its major stars
            const liuYueMingGong = palaces.find(p => p.liuYuePalace === '命宮');
            let liuYueMajorStars = '';
            if (liuYueMingGong && liuYueMingGong.majorStars.length > 0) {
                liuYueMajorStars = liuYueMingGong.majorStars.map(s => s.name).join(' ');
            } else if (liuYueMingGong) {
                // 流月命宮 is 空宮, get from 對宮
                const oppositeIdx = palaces.findIndex(p => p.liuYuePalace === '遷移');
                if (oppositeIdx !== -1 && palaces[oppositeIdx].majorStars.length > 0) {
                    liuYueMajorStars = palaces[oppositeIdx].majorStars.map(s => s.name).join(' ') + ' (借)';
                } else {
                    liuYueMajorStars = '空宮';
                }
            } else {
                liuYueMajorStars = '空宮';
            }

            months.push({ month: m, monthName: monthNames[m - 1], monthSky: mSky.displayName, monthGround: mGround.displayName, liuYueSiHua, liuYueMajorStars, palaces });
        }

        res.json({ year: yr, months });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// Helper function: Calculate Day Sky (日干) and Day Ground (日支)
// Based on: 日干 = (年干 * 5 + 月干) * 2 + 日數 mod 10
// 日支 = (月支 + 日數) mod 12
function getDaySkyGround(yearSkyIndex, lunarMonth, lunarDay) {
    const monthSkyIndex = ((yearSkyIndex % 5) * 2 + lunarMonth) % 10;
    const monthGroundIndex = (lunarMonth + 1) % 12;

    // Simplified day calculation based on lunar day
    // Day Sky cycles every 10 days, Day Ground cycles every 12 days
    const daySkyIndex = (monthSkyIndex * 2 + lunarDay - 1) % 10;
    const dayGroundIndex = (monthGroundIndex + lunarDay - 1) % 12;

    return {
        daySky: Sky.get(daySkyIndex),
        dayGround: Ground.get(dayGroundIndex)
    };
}

// API: Daily fortune (流日)
app.post('/api/liuRi', (req, res) => {
    try {
        const { birthYear, birthMonth, birthDay, birthHour, gender, calendarType, isLeapMonth, targetSolarDate } = req.body;

        const config = calendarType === 'solar'
            ? DestinyConfigBuilder.withSolar({ year: +birthYear, month: +birthMonth, day: +birthDay, bornTimeGround: DayTimeGround.getByHour(+birthHour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F })
            : DestinyConfigBuilder.withlunar({ year: +birthYear, month: +birthMonth, day: +birthDay, isLeapMonth: isLeapMonth || false, bornTimeGround: DayTimeGround.getByHour(+birthHour), configType: ConfigType.SKY, gender: gender === 'M' ? Gender.M : Gender.F });

        const board = new DestinyBoard(config);

        // Convert solar date to lunar
        const [sYear, sMonth, sDay] = targetSolarDate.split('-').map(Number);
        const lunarDate = defaultCalendar.solar2lunar(sYear, sMonth, sDay);
        const yr = lunarDate.lunarYear;
        const lMonth = lunarDate.lunarMonth;
        const lDay = lunarDate.lunarDay;

        const yearSkyIndex = (yr - 4) % 10;
        const monthSky = getMonthSky(yearSkyIndex, lMonth);
        const monthGround = getMonthGround(lMonth);

        // Calculate Day Sky and Ground
        const { daySky, dayGround } = getDaySkyGround(yearSkyIndex, lMonth, lDay);

        const dayDerivatives = Runtime.getDerivativeMapOf(daySky);
        const dayRuntimeStars = Runtime.getRuntimeStarsLocation(daySky);

        const liuRiSiHua = {};
        dayDerivatives.forEach((s, d) => { liuRiSiHua[d.displayName] = s.displayName; });

        // 流日宮位 - starting from the day's ground position
        const palaces = [];
        for (let i = 0; i < 12; i++) {
            const pg = Ground.get((dayGround.index - i + 12) % 12);
            const cell = board.getCellByGround(pg);
            const lrStars = [], lrSiHua = [];
            dayRuntimeStars.forEach((g, s) => { if (g.index === pg.index) lrStars.push(s.displayName); });
            dayDerivatives.forEach((s, d) => { if (cell.majorStars.concat(cell.minorStars).some(x => x.displayName === s.displayName)) lrSiHua.push(d.displayName); });
            palaces.push({
                liuRiPalace: palaceNames[i],
                ground: pg.displayName,
                benMingPalace: cell.temples.map(t => t.displayName),
                majorStars: cell.majorStars.map(s => ({
                    name: s.displayName,
                    brightness: getStarBrightness(s.displayName, pg.displayName)
                })),
                minorStars: cell.minorStars.map(s => ({
                    name: s.displayName,
                    brightness: getStarBrightness(s.displayName, pg.displayName)
                })),
                liuRiStars: lrStars,
                liuRiSiHua: lrSiHua
            });
        }

        // Find 流日命宮 and get its major stars
        const liuRiMingGong = palaces.find(p => p.liuRiPalace === '命宮');
        let liuRiMajorStars = '';
        if (liuRiMingGong && liuRiMingGong.majorStars.length > 0) {
            liuRiMajorStars = liuRiMingGong.majorStars.map(s => s.name).join(' ');
        } else if (liuRiMingGong) {
            // 流日命宮 is 空宮, get from 對宮
            const oppositeIdx = palaces.findIndex(p => p.liuRiPalace === '遷移');
            if (oppositeIdx !== -1 && palaces[oppositeIdx].majorStars.length > 0) {
                liuRiMajorStars = palaces[oppositeIdx].majorStars.map(s => s.name).join(' ') + ' (借)';
            } else {
                liuRiMajorStars = '空宮';
            }
        } else {
            liuRiMajorStars = '空宮';
        }

        res.json({
            year: yr,
            lunarMonth: lMonth,
            lunarDay: lDay,
            monthName: monthNames[lMonth - 1],
            daySky: daySky.displayName,
            dayGround: dayGround.displayName,
            liuRiSiHua,
            liuRiMajorStars,
            palaces
        });
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
                majorStars: cell.majorStars.map(s => ({
                    name: s.displayName,
                    brightness: getStarBrightness(s.displayName, pg.displayName)
                })),
                minorStars: cell.minorStars.map(s => ({
                    name: s.displayName,
                    brightness: getStarBrightness(s.displayName, pg.displayName)
                })),
                daYunStars: dyStars,
                daYunSiHua: dySiHua
            });
        }

        // Find 大運命宮 (first palace) and get its major stars
        const daYunMingGong = palaces.find(p => p.daYunPalace === '命宮');
        let daYunMajorStars = '';
        if (daYunMingGong && daYunMingGong.majorStars.length > 0) {
            daYunMajorStars = daYunMingGong.majorStars.map(s => s.name).join(' ');
        } else if (daYunMingGong) {
            // 大運命宮 is 空宮, get from 對宮
            const oppositeIdx = palaces.findIndex(p => p.daYunPalace === '遷移');
            if (oppositeIdx !== -1 && palaces[oppositeIdx].majorStars.length > 0) {
                daYunMajorStars = palaces[oppositeIdx].majorStars.map(s => s.name).join(' ') + ' (借)';
            } else {
                daYunMajorStars = '空宮';
            }
        } else {
            daYunMajorStars = '空宮';
        }

        res.json({
            age: age,
            ageRange: `${daYunAgeStart}-${daYunAgeEnd}`,
            daYunSky: daYunSky.displayName,
            daYunSiHua,
            daYunMajorStars,
            allDaYun,
            palaces
        });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`🌟 紫微斗數 Server: http://localhost:${PORT}`));
