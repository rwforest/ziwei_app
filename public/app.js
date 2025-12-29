// State
let currentData = null;
let currentLiuNianData = null;
let currentDaYunData = null;
let currentLiuYueData = null;

// DOM Elements
const birthForm = document.getElementById('birthForm');
const calendarType = document.getElementById('calendarType');
const leapMonthRow = document.getElementById('leapMonthRow');

// Show/hide leap month option
calendarType.addEventListener('change', () => {
    leapMonthRow.style.display = calendarType.value === 'lunar' ? 'flex' : 'none';
});

// Auto-calculate current age when birth date changes
const birthDateInput = document.getElementById('birthDate');
birthDateInput.addEventListener('change', updateCurrentAge);

function updateCurrentAge() {
    const birthDate = document.getElementById('birthDate').value;
    if (birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        document.getElementById('targetAge').value = Math.max(1, age);
    }
}

// Initialize age on page load
updateCurrentAge();

// Form submission
birthForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await generateDestiny();
});

// Generate destiny board
async function generateDestiny() {
    // Parse date from date picker
    const birthDate = document.getElementById('birthDate').value;
    const [year, month, day] = birthDate.split('-');

    const formData = {
        year: year,
        month: month,
        day: day,
        hour: document.getElementById('hour').value,
        gender: document.getElementById('gender').value,
        calendarType: document.getElementById('calendarType').value,
        isLeapMonth: document.getElementById('isLeapMonth').checked
    };

    try {
        const res = await fetch('/api/destiny', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error((await res.json()).error);

        currentData = await res.json();
        renderDestinyBoard(currentData);

        document.getElementById('destinyResult').style.display = 'block';
        document.getElementById('liuNianSection').style.display = 'block';
        document.getElementById('liuYueSection').style.display = 'none';
    } catch (err) {
        alert('錯誤: ' + err.message);
    }
}

// Render destiny board
function renderDestinyBoard(data) {
    // Basic info
    document.getElementById('basicInfo').innerHTML = `
        <p><span class="label">出生:</span> <span class="value">${data.config.year}年${data.config.month}月${data.config.day}日 ${data.config.bornTime}</span></p>
        <p><span class="label">年柱:</span> <span class="value">${data.config.yearSky}${data.config.yearGround}年</span></p>
        <p><span class="label">性別:</span> <span class="value">${data.config.gender}</span></p>
        <p><span class="label">五行局:</span> <span class="value">${data.element}</span></p>
        <p><span class="label">主星:</span> <span class="value">${data.destinyPalaceMajorStars}</span></p>
        <p><span class="label">命主:</span> <span class="value">${data.destinyMaster}</span></p>
        <p><span class="label">身主:</span> <span class="value">${data.bodyMaster}</span></p>
    `;

    // Born SiHua
    document.getElementById('bornSiHua').innerHTML = Object.entries(data.bornSiHua)
        .map(([k, v]) => `<p><span class="label">化${k}:</span> <span class="value">${v}</span></p>`)
        .join('');

    // Grid
    renderGrid('destinyGrid', data.cells, null);
}

// Export chart data to JSON file
function exportToJSON() {
    if (!currentData) {
        alert('請先生成命盤');
        return;
    }

    // Create comprehensive export data
    const exportData = {
        exportDate: new Date().toISOString(),
        birthChart: currentData,
        liuYue: currentLiuYueData || null
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `紫微斗數_${currentData.config.year}年${currentData.config.month}月${currentData.config.day}日.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export Liu Nian data to JSON file
function exportLiuNianToJSON() {
    if (!currentData) {
        alert('請先生成命盤');
        return;
    }

    const targetYear = document.getElementById('targetYear').value;

    // Create Liu Nian export data
    const exportData = {
        exportDate: new Date().toISOString(),
        targetYear: targetYear,
        birthChart: currentData,
        liuNian: currentLiuNianData || null,
        liuYue: currentLiuYueData || null
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `紫微斗數_流年${targetYear}年_${currentData.config.year}年${currentData.config.month}月${currentData.config.day}日.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export Liu Yue data to JSON file
function exportLiuYueToJSON() {
    if (!currentData) {
        alert('請先生成命盤');
        return;
    }
    if (!currentLiuYueData) {
        alert('請先查看流月運勢');
        return;
    }

    const targetYear = document.getElementById('targetYear').value;

    // Create Liu Yue export data
    const exportData = {
        exportDate: new Date().toISOString(),
        targetYear: targetYear,
        birthChart: currentData,
        liuNian: currentLiuNianData || null,
        liuYue: currentLiuYueData
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `紫微斗數_流月${targetYear}年_${currentData.config.year}年${currentData.config.month}月${currentData.config.day}日.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Get Da Yun (10-year fortune)
async function getDaYun() {
    const birthDate = document.getElementById('birthDate').value;
    const [year, month, day] = birthDate.split('-');

    const formData = {
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        birthHour: document.getElementById('hour').value,
        gender: document.getElementById('gender').value,
        calendarType: document.getElementById('calendarType').value,
        isLeapMonth: document.getElementById('isLeapMonth').checked,
        targetAge: document.getElementById('targetAge').value
    };

    try {
        const res = await fetch('/api/daYun', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error((await res.json()).error);

        const data = await res.json();
        currentDaYunData = data;
        renderDaYun(data);

        document.getElementById('daYunSection').style.display = 'block';
        // Auto-scroll to the Da Yun section
        setTimeout(() => {
            document.getElementById('daYunSection').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } catch (err) {
        alert('錯誤: ' + err.message);
    }
}

// Render Da Yun
function renderDaYun(data) {
    // Render period tabs
    const periodsContainer = document.getElementById('daYunPeriods');
    periodsContainer.innerHTML = data.allDaYun.map((period, idx) =>
        `<div class="daYun-tab ${period.isActive ? 'active' : ''}" onclick="selectDaYunPeriod(${period.ageStart})">
            <span class="period-age">${period.ageStart}-${period.ageEnd}歲</span>
            <span class="period-sky">${period.sky}</span>
        </div>`
    ).join('');

    // Render info
    document.getElementById('daYunInfo').innerHTML = `
        <p><span class="label">歲數:</span> <span class="value">${data.age}歲</span></p>
        <p><span class="label">大運:</span> <span class="value">${data.ageRange}歲</span></p>
        <p><span class="label">天干:</span> <span class="value">${data.daYunSky}</span></p>
        <p><span class="label">主星:</span> <span class="value">${data.daYunMajorStars}</span></p>
    `;

    // Render Si Hua
    document.getElementById('daYunSiHua').innerHTML = Object.entries(data.daYunSiHua)
        .map(([k, v]) => `<p><span class="label">化${k}:</span> <span class="value">${v}</span></p>`)
        .join('');

    // Render grid with Da Yun overlay
    if (currentData) {
        renderDaYunGrid('daYunGrid', currentData.cells, data.palaces);
    }
}

// Render Da Yun Grid
function renderDaYunGrid(containerId, cells, daYunPalaces) {
    const container = document.getElementById(containerId);

    const gridPositions = {
        5: [0, 0], 6: [0, 1], 7: [0, 2], 8: [0, 3],
        4: [1, 0], 9: [1, 3],
        3: [2, 0], 10: [2, 3],
        2: [3, 0], 1: [3, 1], 0: [3, 2], 11: [3, 3]
    };

    const gridCells = Array(16).fill(null);

    cells.forEach((cell, idx) => {
        const groundIndex = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].indexOf(cell.ground);
        if (gridPositions[groundIndex]) {
            const [row, col] = gridPositions[groundIndex];
            const gridIdx = row * 4 + col;
            const dyp = daYunPalaces.find(p => p.ground === cell.ground);
            gridCells[gridIdx] = { ...cell, daYunPalace: dyp };
        }
    });

    container.innerHTML = gridCells.map((cell, idx) => {
        if ([5, 6, 9, 10].includes(idx)) {
            return '<div class="cell center"></div>';
        }
        if (!cell) return '<div class="cell center"></div>';

        const dyp = cell.daYunPalace;
        const palaceName = cell.temples[0] || '';
        const groundName = cell.ground;
        const triangleData = cell.triangle ? JSON.stringify(cell.triangle) : '[]';

        return `
            <div class="cell" data-palace="${palaceName}" data-ground="${groundName}" data-triangle='${triangleData}' onclick="highlightTriangle(this)">
                <div class="cell-header">
                    <span class="cell-ground">${cell.sky}${cell.ground}</span>
                    <div>
                        <span class="cell-palace">${cell.temples.join(' ')}</span>
                        ${dyp ? `<span class="cell-daYun">${dyp.daYunPalace}</span>` : ''}
                    </div>
                </div>
                <div class="cell-stars">
                    ${cell.majorStars.length ? `<div class="major-stars">${formatStarsWithBrightness(cell.majorStars)}</div>` : '<div class="major-stars" style="color:#666">空宮</div>'}
                    ${cell.minorStars?.length ? `<div class="minor-stars">${formatStarsWithBrightness(cell.minorStars)}</div>` : ''}
                    ${dyp?.daYunStars?.length ? `<div class="daYun-stars">大運: ${dyp.daYunStars.join(' ')}</div>` : ''}
                    ${dyp?.daYunSiHua?.length ? `<div class="sihua">四化: ${dyp.daYunSiHua.join(' ')}</div>` : ''}
                </div>
                ${cell.ageStart ? `<div class="cell-age">${cell.ageStart}-${cell.ageEnd}歲</div>` : ''}
                ${cell.triangle?.length ? `<div class="cell-triangle">三方: ${cell.triangle.slice(1).join(' ')}</div>` : ''}
            </div>
        `;
    }).join('');

    // Add SVG overlay for triangle lines
    const existingSvg = container.querySelector('.triangle-svg-overlay');
    if (!existingSvg) {
        container.insertAdjacentHTML('beforeend', `
            <svg class="triangle-svg-overlay" id="triangleSvg"></svg>
            <div class="triangle-info-center" id="triangleInfo"></div>
        `);
    }
}

// Select Da Yun period by clicking tab
function selectDaYunPeriod(ageStart) {
    document.getElementById('targetAge').value = ageStart;
    getDaYun();
}

// Export Da Yun data to JSON file
function exportDaYunToJSON() {
    if (!currentData) {
        alert('請先生成命盤');
        return;
    }
    if (!currentDaYunData) {
        alert('請先查看大運運勢');
        return;
    }

    const targetAge = document.getElementById('targetAge').value;

    const exportData = {
        exportDate: new Date().toISOString(),
        targetAge: targetAge,
        birthChart: currentData,
        daYun: currentDaYunData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `紫微斗數_大運${targetAge}歲_${currentData.config.year}年${currentData.config.month}月${currentData.config.day}日.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Format stars with brightness
function formatStarsWithBrightness(stars) {
    if (!stars || stars.length === 0) return '';
    return stars.map(s => {
        if (typeof s === 'object' && s.name) {
            const brightness = s.brightness !== null ? `(${s.brightness})` : '';
            return s.name + brightness;
        }
        return s;
    }).join(' ');
}

// Render grid (4x4 layout)
function renderGrid(containerId, cells, liuNianPalaces) {
    const container = document.getElementById(containerId);

    // Grid position mapping: ground index -> [row, col]
    const gridPositions = {
        5: [0, 0], 6: [0, 1], 7: [0, 2], 8: [0, 3],     // 巳午未申
        4: [1, 0], 9: [1, 3],                            // 辰, 酉
        3: [2, 0], 10: [2, 3],                           // 卯, 戌
        2: [3, 0], 1: [3, 1], 0: [3, 2], 11: [3, 3]     // 寅丑子亥
    };

    // Create 4x4 grid
    const gridCells = Array(16).fill(null);

    cells.forEach((cell, idx) => {
        const groundIndex = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].indexOf(cell.ground);
        if (gridPositions[groundIndex]) {
            const [row, col] = gridPositions[groundIndex];
            const gridIdx = row * 4 + col;

            // Find liu nian palace if available
            let liuNianPalace = null;
            if (liuNianPalaces) {
                const lnp = liuNianPalaces.find(p => p.ground === cell.ground);
                if (lnp) liuNianPalace = lnp;
            }

            gridCells[gridIdx] = { ...cell, liuNianPalace };
        }
    });

    container.innerHTML = gridCells.map((cell, idx) => {
        // Center cells (positions 5, 6, 9, 10)
        if ([5, 6, 9, 10].includes(idx)) {
            return '<div class="cell center"></div>';
        }

        if (!cell) return '<div class="cell center"></div>';

        const lnp = cell.liuNianPalace;
        const palaceName = cell.temples[0] || '';
        const triangleData = cell.triangle ? JSON.stringify(cell.triangle) : '[]';
        const groundName = cell.ground;

        // Format major stars with brightness
        const majorStarsHtml = cell.majorStars.length
            ? `<div class="major-stars">${formatStarsWithBrightness(cell.majorStars)}</div>`
            : '<div class="major-stars" style="color:#666">空宮</div>';

        // Format minor stars with brightness
        const minorStarsHtml = cell.minorStars?.length
            ? `<div class="minor-stars">${formatStarsWithBrightness(cell.minorStars)}</div>`
            : '';

        return `
            <div class="cell" data-palace="${palaceName}" data-ground="${groundName}" data-triangle='${triangleData}' data-flyingstar='${cell.flyingStar ? JSON.stringify(cell.flyingStar) : "null"}' onclick="highlightTriangle(this)">
                <div class="cell-header">
                    <span class="cell-ground">${cell.sky}${cell.ground}</span>
                    <div>
                        <span class="cell-palace">${cell.temples.join(' ')}</span>
                        ${lnp ? `<span class="cell-liuNian">${lnp.liuNianPalace}</span>` : ''}
                    </div>
                </div>
                <div class="cell-stars">
                    ${majorStarsHtml}
                    ${minorStarsHtml}
                    ${cell.miniStars?.length ? `<div class="mini-stars">${cell.miniStars.join(' ')}</div>` : ''}
                    ${cell.scholarStar || cell.yearGodStar || cell.leaderStar ? `<div class="misc-stars">${[cell.scholarStar, cell.yearGodStar, cell.leaderStar].filter(Boolean).join(' ')}</div>` : ''}
                    ${lnp?.liuNianStars?.length ? `<div class="liu-stars">流年: ${lnp.liuNianStars.join(' ')}</div>` : ''}
                    ${lnp?.liuNianSiHua?.length ? `<div class="sihua">四化: ${lnp.liuNianSiHua.join(' ')}</div>` : ''}
                </div>
                ${cell.ageStart ? `<div class="cell-age">${cell.ageStart}-${cell.ageEnd}歲 ${cell.lifeStage || ''}</div>` : ''}
                ${cell.triangle?.length ? `<div class="cell-triangle">三方: ${cell.triangle.slice(1).join(' ')}</div>` : ''}
            </div>
        `;
    }).join('');

    // Add SVG overlay for triangle lines
    const existingSvg = container.querySelector('.triangle-svg-overlay');
    if (!existingSvg) {
        container.insertAdjacentHTML('beforeend', `
            <svg class="triangle-svg-overlay" id="triangleSvg"></svg>
            <div class="triangle-info-center" id="triangleInfo"></div>
        `);
    }
}

// Highlight triangle (三方四正) palaces OR flying stars based on mode
function highlightTriangle(element) {
    // Clear previous highlights
    document.querySelectorAll('.cell.highlight').forEach(el => el.classList.remove('highlight'));
    document.querySelectorAll('.cell.flying-target').forEach(el => el.classList.remove('flying-target'));

    // If flying star mode is enabled, show flying stars instead
    if (flyingStarMode) {
        highlightFlyingStar(element);
        return;
    }

    const triangle = JSON.parse(element.dataset.triangle || '[]');
    if (triangle.length === 0) return;

    const grid = element.closest('.destiny-grid');
    if (!grid) return;

    const gridRect = grid.getBoundingClientRect();

    // Ground (地支) order for spatial sorting (clockwise from 巳)
    // Grid: 巳(0)午(1)未(2)申(3) / 辰(11)..酉(4) / 卯(10)..戌(5) / 寅(9)丑(8)子(7)亥(6)
    const groundOrder = ['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'];

    console.log('Triangle palaces to find:', triangle);

    // Find positions of highlighted palaces
    const highlightedPositions = [];
    grid.querySelectorAll('.cell[data-palace]').forEach(cell => {
        const palace = cell.dataset.palace;
        const ground = cell.dataset.ground;
        const cellPalaces = cell.querySelector('.cell-palace')?.textContent?.split(' ') || [palace];

        // Check if any of the cell's palaces matches any in the triangle
        const matchedPalace = triangle.find(tp => cellPalaces.includes(tp));

        if (matchedPalace) {
            console.log(`Found match: ${matchedPalace} in cell with ground ${ground}`);
            cell.classList.add('highlight');
            const rect = cell.getBoundingClientRect();
            highlightedPositions.push({
                palace: matchedPalace,
                ground,
                groundIndex: groundOrder.indexOf(ground),
                x: rect.left - gridRect.left + rect.width / 2,
                y: rect.top - gridRect.top + rect.height / 2
            });
        }
    });

    console.log('Highlighted positions:', highlightedPositions);

    // Draw lines in SVG - triangle (三方) + cutthrough line (對宮)
    const svg = grid.querySelector('#triangleSvg');
    const triangleInfo = grid.querySelector('#triangleInfo');

    if (svg && highlightedPositions.length >= 3) {
        // Set viewBox to match grid dimensions
        svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);

        // Sort points by ground order (clockwise around the chart)
        const points = [...highlightedPositions].sort((a, b) => a.groundIndex - b.groundIndex);

        // Find the clicked palace and the opposite palace
        // In 三方四正: The triangle connects 3 palaces (三方), 
        // and the line goes from clicked palace to opposite palace (對宮)
        const clickedPalace = triangle[0]; // First in triangle array is the clicked one
        const clickedPoint = points.find(p => p.palace === clickedPalace);

        // Find opposite palace - it's 180 degrees away (6 positions in ground order)
        let oppositePoint = null;
        if (clickedPoint) {
            const oppositeGroundIndex = (clickedPoint.groundIndex + 6) % 12;
            oppositePoint = points.find(p => p.groundIndex === oppositeGroundIndex);
        }

        // Get the triangle points (excluding the opposite, which will be connected via line)
        const trianglePoints = points.filter(p => p !== oppositePoint);

        let linesHtml = '';
        let polygonHtml = '';

        // Draw the triangle (三方)
        if (trianglePoints.length >= 3) {
            // Sort triangle points for proper connection
            const sortedTriangle = [...trianglePoints].sort((a, b) => a.groundIndex - b.groundIndex);

            // Draw triangle edges
            for (let i = 0; i < sortedTriangle.length; i++) {
                const next = (i + 1) % sortedTriangle.length;
                linesHtml += `<line x1="${sortedTriangle[i].x}" y1="${sortedTriangle[i].y}" 
                    x2="${sortedTriangle[next].x}" y2="${sortedTriangle[next].y}" 
                    stroke="#22c55e" stroke-width="2" stroke-opacity="0.9"/>`;
            }

            // Filled triangle
            const trianglePointsStr = sortedTriangle.map(p => `${p.x},${p.y}`).join(' ');
            polygonHtml = `<polygon points="${trianglePointsStr}" fill="rgba(34, 197, 94, 0.1)" stroke="none"/>`;
        }

        // Draw the cutthrough line (from clicked palace to opposite palace)
        if (clickedPoint && oppositePoint) {
            linesHtml += `<line x1="${clickedPoint.x}" y1="${clickedPoint.y}" 
                x2="${oppositePoint.x}" y2="${oppositePoint.y}" 
                stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5" stroke-opacity="0.9"/>`;
        }

        // Add circles at each point (triangle points in green, opposite in orange)
        const circlesHtml = points.map(p => {
            const isOpposite = p === oppositePoint;
            const color = isOpposite ? '#f59e0b' : '#22c55e';
            return `<circle cx="${p.x}" cy="${p.y}" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>`;
        }).join('');

        svg.innerHTML = polygonHtml + linesHtml + circlesHtml;
    }

    // Show triangle info in center
    if (triangleInfo) {
        triangleInfo.classList.add('show');
        triangleInfo.innerHTML = `
            <div class="triangle-title">三方四正</div>
            <div class="triangle-palaces">${triangle.join(' · ')}</div>
        `;
    }
}

// Clear triangle on clicking elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.cell[data-palace]')) {
        document.querySelectorAll('.cell.highlight').forEach(el => el.classList.remove('highlight'));
        document.querySelectorAll('.cell.flying-target').forEach(el => el.classList.remove('flying-target'));
        const svg = document.getElementById('triangleSvg');
        const info = document.getElementById('triangleInfo');
        if (svg) svg.innerHTML = '';
        if (info) {
            info.classList.remove('show');
            info.innerHTML = '';
        }
    }
});

// Flying Star Mode State
let flyingStarMode = false;

// Toggle flying star mode
function toggleFlyingStarMode() {
    flyingStarMode = !flyingStarMode;
    const btn = document.getElementById('flyingStarBtn');
    if (btn) {
        btn.classList.toggle('active', flyingStarMode);
        btn.textContent = flyingStarMode ? '飛星模式 ✓' : '飛星模式';
    }
    // Clear any existing highlights
    document.querySelectorAll('.cell.highlight').forEach(el => el.classList.remove('highlight'));
    document.querySelectorAll('.cell.flying-target').forEach(el => el.classList.remove('flying-target'));
    const svg = document.getElementById('triangleSvg');
    const info = document.getElementById('triangleInfo');
    if (svg) svg.innerHTML = '';
    if (info) {
        info.classList.remove('show');
        info.innerHTML = '';
    }
}

// Show flying stars from a clicked palace
function highlightFlyingStar(cellEl) {
    const flyingData = cellEl.dataset.flyingstar;
    if (!flyingData || flyingData === 'null') return;

    const flying = JSON.parse(flyingData);
    const grid = cellEl.closest('.destiny-grid');
    const gridRect = grid.getBoundingClientRect();
    const groundOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

    // Clear previous flying highlights
    grid.querySelectorAll('.cell.flying-target').forEach(el => el.classList.remove('flying-target'));

    // Highlight the source cell
    cellEl.classList.add('highlight');

    // Find and highlight target cells
    const connections = [];
    const sourceRect = cellEl.getBoundingClientRect();
    const sourceX = sourceRect.left - gridRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top - gridRect.top + sourceRect.height / 2;

    const colors = { '祿': '#22c55e', '權': '#f59e0b', '科': '#3b82f6', '忌': '#ef4444' };

    for (const [type, data] of Object.entries(flying)) {
        if (data.ground) {
            const targetCell = grid.querySelector(`.cell[data-ground="${data.ground}"]`);
            if (targetCell) {
                targetCell.classList.add('flying-target');
                const targetRect = targetCell.getBoundingClientRect();
                connections.push({
                    type,
                    star: data.star,
                    palace: data.palace,
                    color: colors[type],
                    x: targetRect.left - gridRect.left + targetRect.width / 2,
                    y: targetRect.top - gridRect.top + targetRect.height / 2
                });
            }
        }
    }

    // Draw arrows in SVG
    const svg = grid.querySelector('#triangleSvg');
    const triangleInfo = grid.querySelector('#triangleInfo');

    if (svg && connections.length > 0) {
        svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);

        let arrowsHtml = '';
        connections.forEach(conn => {
            // Draw line with arrow
            arrowsHtml += `
                <line x1="${sourceX}" y1="${sourceY}" x2="${conn.x}" y2="${conn.y}" 
                    stroke="${conn.color}" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#arrow-${conn.type})"/>
                <circle cx="${conn.x}" cy="${conn.y}" r="8" fill="${conn.color}" opacity="0.8"/>
                <text x="${conn.x}" y="${conn.y + 4}" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">${conn.type}</text>
            `;
        });

        // Add arrow markers
        const defs = `
            <defs>
                <marker id="arrow-祿" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#22c55e"/>
                </marker>
                <marker id="arrow-權" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b"/>
                </marker>
                <marker id="arrow-科" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6"/>
                </marker>
                <marker id="arrow-忌" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#ef4444"/>
                </marker>
            </defs>
        `;

        svg.innerHTML = defs + arrowsHtml;
    }

    // Show flying star info in center
    if (triangleInfo) {
        triangleInfo.classList.add('show');
        const palaceName = cellEl.querySelector('.cell-palace')?.textContent || '';
        const skyName = cellEl.querySelector('.cell-ground')?.textContent?.charAt(0) || '';
        triangleInfo.innerHTML = `
            <div class="triangle-title">飛星四化 (${skyName})</div>
            <div class="flying-legend">
                ${connections.map(c => `<span style="color:${c.color}">化${c.type}→${c.star}</span>`).join(' ')}
            </div>
        `;
    }
}

// Get Liu Nian (yearly fortune)
async function getLiuNian() {
    const birthDate = document.getElementById('birthDate').value;
    const [year, month, day] = birthDate.split('-');

    const formData = {
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        birthHour: document.getElementById('hour').value,
        gender: document.getElementById('gender').value,
        calendarType: document.getElementById('calendarType').value,
        isLeapMonth: document.getElementById('isLeapMonth').checked,
        targetYear: document.getElementById('targetYear').value
    };

    try {
        const res = await fetch('/api/liuNian', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error((await res.json()).error);

        const data = await res.json();
        currentLiuNianData = data;
        renderLiuNian(data);
    } catch (err) {
        alert('錯誤: ' + err.message);
    }
}

// Render Liu Nian
function renderLiuNian(data) {
    document.getElementById('liuNianInfo').innerHTML = `
        <p><span class="label">年份:</span> <span class="value">${data.year} (${data.yearSky}${data.yearGround}年)</span></p>
        <p><span class="label">虛歲:</span> <span class="value">${data.age + 1}歲</span></p>
        <p><span class="label">主星:</span> <span class="value">${data.liuNianMajorStars}</span></p>
    `;

    document.getElementById('liuNianSiHua').innerHTML = Object.entries(data.liuNianSiHua)
        .map(([k, v]) => `<p><span class="label">化${k}:</span> <span class="value">${v}</span></p>`)
        .join('');

    // Merge with birth chart cells
    if (currentData) {
        renderGrid('liuNianGrid', currentData.cells, data.palaces);
    }

    document.getElementById('liuYueSection').style.display = 'none';
}

// Get Liu Yue (monthly fortune)
async function getLiuYue() {
    const birthDate = document.getElementById('birthDate').value;
    const [year, month, day] = birthDate.split('-');

    const formData = {
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        birthHour: document.getElementById('hour').value,
        gender: document.getElementById('gender').value,
        calendarType: document.getElementById('calendarType').value,
        isLeapMonth: document.getElementById('isLeapMonth').checked,
        targetYear: document.getElementById('targetYear').value
    };

    try {
        const res = await fetch('/api/liuYue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error((await res.json()).error);

        currentLiuYueData = await res.json();
        renderLiuYueTabs(currentLiuYueData);

        document.getElementById('liuYueSection').style.display = 'block';
        // Auto-scroll to the Liu Yue section
        setTimeout(() => {
            document.getElementById('liuYueSection').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } catch (err) {
        alert('錯誤: ' + err.message);
    }
}

// Render Liu Yue tabs
function renderLiuYueTabs(data) {
    const tabsContainer = document.getElementById('monthTabs');
    tabsContainer.innerHTML = data.months.map((m, idx) =>
        `<div class="month-tab ${idx === 0 ? 'active' : ''}" onclick="selectMonth(${idx})">${m.monthName}</div>`
    ).join('');

    selectMonth(0);
}

// Select month
function selectMonth(idx) {
    document.querySelectorAll('.month-tab').forEach((t, i) => {
        t.classList.toggle('active', i === idx);
    });

    const month = currentLiuYueData.months[idx];

    document.getElementById('liuYueContent').innerHTML = `
        <div class="info-cards">
            <div class="info-card">
                <h3>流月資料</h3>
                <p><span class="label">月份:</span> <span class="value">${month.monthName} (${month.monthSky}${month.monthGround})</span></p>
                <p><span class="label">主星:</span> <span class="value">${month.liuYueMajorStars}</span></p>
            </div>
            <div class="info-card">
                <h3>流月四化</h3>
                ${Object.entries(month.liuYueSiHua).map(([k, v]) =>
        `<p><span class="label">化${k}:</span> <span class="value">${v}</span></p>`
    ).join('')}
            </div>
        </div>
        <div id="liuYueGrid" class="destiny-grid"></div>
    `;

    if (currentData) {
        renderGrid('liuYueGrid', currentData.cells, month.palaces.map(p => ({
            ...p,
            liuNianPalace: p.liuYuePalace,
            liuNianStars: p.liuYueStars,
            liuNianSiHua: p.liuYueSiHua
        })));
    }
}
