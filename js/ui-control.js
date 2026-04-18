// ui-control.js 맨 위나 적절한 위치에 추가
let eventStartTime = Date.now(); // 유저가 웹맵에 접속한 시간 기록

// ==========================================
// [이벤트 설정] 2시간 이벤트용 고정 시드 및 변수
// ==========================================
const EVENT_SEED = 2026041900; // 이 숫자만 바꾸면 모든 포키 위치와 검증 번호가 바뀝니다.
let foundPokiList = [];        // 유저가 찾은 포키 저장용

// 시드가 있는 랜덤 함수 (누가 접속해도 똑같은 결과를 내기 위함)
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// [R-1] 모든 후보군 수집 및 고정 셔플
const allPokiCandidates = [
    ...herbData.flatMap(h => h.locations.map(loc => ({ x: loc.x, z: loc.z }))),
    ...npcData.map(n => ({ x: n.x, z: n.z })),
    ...potItems.map(p => ({ x: p.x, z: p.z })),
    ...mysteryBoxes.map(b => ({ x: b.x, z: b.z })),
    ...animals.map(a => ({ x: a.mcX, z: a.mcZ })),
    ...mountains.map(m => ({ x: m.x, z: m.z }))
];

// 고정된 시드(EVENT_SEED)로 셔플
let tempSeed = EVENT_SEED;
for (let i = allPokiCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(tempSeed++) * (i + 1));
    [allPokiCandidates[i], allPokiCandidates[j]] = [allPokiCandidates[j], allPokiCandidates[i]];
}

// 지도 마커 당첨자 9개 선정 (고정)
const luckyPokiCoords = allPokiCandidates.slice(0, 9).map(c => `${c.x},${c.z}`);

// 대장장이 당첨자 1개 선정 (고정)
const allEquipmentNames = [];
for (const level in blacksmithData) {
    for (const cat in blacksmithData[level]) {
        const catData = blacksmithData[level][cat];
        if (catData.items) {
            Object.keys(catData.items).forEach(itemName => {
                // 방어구라면 4부위를 각각 추가, 무기라면 이름만 추가
                if (cat === "방어구") {
                    ["투구", "갑옷", "허리띠", "신발"].forEach(part => {
                        allEquipmentNames.push(`${itemName} ${part}`);
                    });
                } else {
                    allEquipmentNames.push(itemName); // 무기나 장신구
                }
            });
        }
    }
}

// 2시간 고정 시드로 딱 1개 부위만 당첨!
const equipmentSeed = EVENT_SEED + 999;
const luckyEquipment = [allEquipmentNames[Math.floor(seededRandom(equipmentSeed) * allEquipmentNames.length)]];

// [검증 암호 생성 함수 수정] - 소요 시간 포함 버전
function generateVerifyCode(foundList) {
    // 1. 유저 식별을 위해 닉네임 입력
    const userName = prompt("검증 코드 발급을 위해 마인크래프트 닉네임을 입력해주세요.    해당 팝업창이 사라지면 다시 찾으셔야 하니 마우스를 다른 곳에 클릭하지 않도록 주의하세요!", "");
    if (!userName) return "닉네임 미입력";

    // 2. 소요 시간 계산 (초 단위)
    const currentTime = Date.now();
    const durationSeconds = Math.floor((currentTime - eventStartTime) / 1000);

    // 3. 해시 생성을 위한 문자열 조합
    // 시드 + 포키목록 + 닉네임 + 소요시간을 다 섞음
    // 이제 1초만 늦게 눌러도 resultNum이 완전히 바뀜
    const sortedPoki = [...foundList].sort().join("");
    const combinedStr = EVENT_SEED + sortedPoki + userName + durationSeconds;

    // 4. 문자열을 숫자로 변환 (해시 함수)
    let hash = 0;
    for (let i = 0; i < combinedStr.length; i++) {
        hash = ((hash << 5) - hash) + combinedStr.charCodeAt(i);
        hash |= 0;
    }

    // 5. 8000 ~ 8900 범위로 변환 (0~900 나머지를 활용)
    const resultNum = 8000 + (Math.abs(hash) % 901);

    // 6. 최종 출력 (예: PK-8412-닉네임(125s))
    // 뒤에 (초)가 붙어서 다겸이가 대리 여부를 판단할 수 있음
    return `PK-${resultNum}-${userName}(${durationSeconds}s)`;
}

// [결과 창 UI] - 소요 시간 경고 문구 살짝 추가
function showVictoryModal(code) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #1a1512; border: 3px solid #c5a368; color: #eee7c5;
        padding: 30px; z-index: 10001; text-align: center; border-radius: 8px;
        box-shadow: 0 0 30px rgba(0,0,0,0.9); font-family: sans-serif;
    `;
    
    // 소요 시간 정보를 추출해서 표시 (운영 참고용)
    const timeMatch = code.match(/\((.*)\)/);
    const displayTime = timeMatch ? timeMatch[1] : "알 수 없음";

    modal.innerHTML = `
        <h2 style="color:#d4af37; margin-top:0;">🎉 포키 10마리 검거 완료! 🎉</h2>
        <p style="font-size:13px; color:#b0a59a;">아래 검증 코드를 캡처해서 포키에게 보내주세요.</p>
        <div style="background:#000; padding:15px; margin:20px 0; border:1px dashed #c5a368;">
            <span style="font-size:26px; font-weight:bold; letter-spacing:3px; color:#fff;">${code}</span>
        </div>
        <p style="font-size:11px; color:#c5a368;">검거 소요 시간: ${displayTime}</p>
        <p style="font-size:10px; color:#555;">SEED: ${EVENT_SEED} | 부정행위 적발 시 무효 처리됩니다.</p>
        <button onclick="this.parentElement.remove()" style="background:#c5a368; color:#1a1512; border:none; padding:10px 25px; cursor:pointer; font-weight:900; border-radius:4px;">확인</button>
    `;
    document.body.appendChild(modal);
}

// [포키 클릭 핸들러]
window.collectPoki = function(id) {
    if (!foundPokiList.includes(id)) {
        foundPokiList.push(id);
        
        // 클릭한 이미지 변경이나 알림 등 피드백 (선택사항)
        const toast = document.getElementById('copy-toast');
        if(toast) {
            document.getElementById('toast-text').innerText = `포키 검거! (${foundPokiList.length}/10)`;
            toast.style.display = 'flex';
            setTimeout(() => toast.style.display = 'none', 1000);
        }

        if (foundPokiList.length === 10) {
            const finalCode = generateVerifyCode(foundPokiList);
            showVictoryModal(finalCode);
        }
    }
};

// [결과 창 UI]
function showVictoryModal(code) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #1a1512; border: 3px solid #c5a368; color: #eee7c5;
        padding: 30px; z-index: 10001; text-align: center; border-radius: 8px;
        box-shadow: 0 0 30px rgba(0,0,0,0.9); font-family: sans-serif;
    `;
    modal.innerHTML = `
        <h2 style="color:#d4af37; margin-top:0;">🎉 포키 10마리 검거 완료! 🎉</h2>
        <p style="font-size:13px; color:#b0a59a;">아래 검증 코드를 캡처해서 포키에게 보내주세요.</p>
        <div style="background:#000; padding:15px; margin:20px 0; border:1px dashed #c5a368;">
            <span style="font-size:26px; font-weight:bold; letter-spacing:3px; color:#fff;">${code}</span>
        </div>
        <p style="font-size:10px; color:#555;">SEED: ${EVENT_SEED}</p>
        <button onclick="this.parentElement.remove()" style="background:#c5a368; color:#1a1512; border:none; padding:10px 25px; cursor:pointer; font-weight:900; border-radius:4px;">확인</button>
    `;
    document.body.appendChild(modal);
}

// [포키 태그 출력 함수 수정] - 클릭 이벤트 연결
const getPokiTag = (x, z) => {
    const id = `${x},${z}`;
    return luckyPokiCoords.includes(id)
        ? `<div style="text-align:center; margin-top:10px; border-top:1px solid #aaa; padding-top:10px;">
             <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px; cursor:pointer;" onclick="collectPoki('${id}')">
             <div style="font-size:10px; color:#d4af37; font-weight:900;">포키 발견! (클릭)</div>
           </div>`
        : '';
};

// [0] 레이어 그룹 정의 (체크박스 제어용)
const layers = {
    spawn: L.layerGroup().addTo(map),      // 스폰: 초기 ON
    animals: L.layerGroup().addTo(map),    // 십이지신: 초기 ON
    stones: L.layerGroup(),                // 나머지는 체크해야 나타남
    npc: L.layerGroup(),
    red: L.layerGroup(),
    pot: L.layerGroup(),
    box: L.layerGroup(),
    mines: {
        "녹": L.layerGroup(), "청": L.layerGroup(), "황": L.layerGroup(), "적": L.layerGroup()
    },
    hunting: {},
    huntingMarkers: L.layerGroup() // 사냥터 투명 마커 전용 그룹 (검색용)
};

// [1] 공용 아이콘 정의 모음
const compassIcon = L.icon({
    iconUrl: 'images/compass.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const transparentIcon = L.icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
});

const redIcon = L.icon({
    iconUrl: 'images/red.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const stoneIcon = L.icon({ 
    iconUrl: 'images/stone.png', 
    iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -12] 
});

const stone2Icon = L.icon({ 
    iconUrl: 'images/stone2.png', 
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15] 
});

const potIcon = L.icon({
    iconUrl: 'images/pot.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const boxIcon = L.icon({
    iconUrl: 'images/box.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const npcIcon = L.icon({
    iconUrl: 'images/npc_default.png', 
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
});

// [2] 십이지신 동선 설정
const animalPathPoints = animals.map(ani => mcToPx(ani.mcX, ani.mcZ));
const polyline = L.polyline(animalPathPoints, {
    color: '#FFD700', weight: 2, opacity: 0, dashArray: '5, 8'
}).addTo(layers.animals); 

// [3] 광산 전용 동선 설정
const minePolylines = {};
const mineColors = { "녹": "#2ecc71", "청": "#3498db", "황": "#f1c40f", "적": "#e74c3c" };

Object.keys(minePaths).forEach(colorKey => {
    const pathCoords = minePaths[colorKey].map(num => {
        const mine = mines.find(m => m.n === num);
        if (mine) return mcToPx(mine.x, mine.z);
    }).filter(coord => coord !== undefined);

    minePolylines[colorKey] = L.polyline(pathCoords, {
        color: mineColors[colorKey], weight: 3, opacity: 0, dashArray: '7, 10'
    }).addTo(layers.mines[colorKey]); 
});

// [4] 좌표 복사 함수
window.copyCoords = (x, y, z) => {
    const text = `${x} ${y} ${z}`; 
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('copy-toast');
        const toastText = document.getElementById('toast-text');
        
        if (toast) {
            if (toastText) {
                toastText.innerText = "복사 완료!";
            } else {
                toast.innerText = "복사 완료!";
            }
            toast.style.display = 'flex';
            setTimeout(() => { 
                toast.style.display = 'none'; 
            }, 1500);
        }
    }).catch(err => {
        console.error('복사 실패:', err);
    });
};

// [5] 십이지신 마커 생성 (랜덤 포키 적용)
animals.forEach((ani) => {
    const pos = mcToPx(ani.mcX, ani.mcZ);
    const marker = L.marker(pos, { icon: transparentIcon }).addTo(layers.animals);
    const pokiTag = getPokiTag(ani.mcX, ani.mcZ);

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 5px 0;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">${ani.order}. ${ani.name}</div>
            <div style="background:#333; border-radius:4px; padding:10px 0; margin-bottom:12px; cursor:pointer;" onclick="copyCoords(${ani.mcX}, ${ani.mcY}, ${ani.mcZ})">
                <div style="color:#FFD700; font-size:15px; font-weight:700; letter-spacing:0.5px;">${ani.mcX}, ${ani.mcY}, ${ani.mcZ}</div>
                <div style="color:#aaa; font-size:11px; margin-top:4px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="color:#7000CA; font-weight:800; font-size:14px; margin-bottom:8px;">*[히든]십이지신</div>
            <div style="font-size:12px; color:#333; line-height:1.6; letter-spacing:-0.3px; font-weight:600;">
                쥐 > 소 > 호랑이 > 도사 > 토끼 > 용 / 뱀 > 도사 > 말 > 양 > 원숭이 > 도사 / 닭 > 개 > 돼지 > 도사
            </div>
            ${pokiTag}
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
    marker.on('mouseover', () => polyline.setStyle({ opacity: 0.7 }));
    marker.on('mouseout', () => polyline.setStyle({ opacity: 0 }));
});

// [6] 스폰 지점 마커
L.marker(mcToPx(spawnData.mcX, spawnData.mcZ), { icon: compassIcon })
    .addTo(layers.spawn)
    .bindPopup(`<div style="color:#000; font-weight:bold; font-size:14px; text-align:center;">스폰 지점</div>`);

// [7] 광산 마커 생성 (랜덤 포키 적용)
mines.forEach((mine) => {
    const pos = mcToPx(mine.x, mine.z);
    const specialNumbers = [14, 15, 24, 20, 27, 19];
    let markerClass = `mine-marker mine-${mine.c}`;
    if (specialNumbers.includes(mine.n)) markerClass += " special-mine";
    const mineIcon = L.divIcon({ className: markerClass, iconSize: [18, 18], iconAnchor: [9, 9] });
    const marker = L.marker(pos, { icon: mineIcon }).addTo(layers.mines[mine.c]);
    const specificOres = mineResources[mine.c];
    const commonOres = mineResources["공통"];
    const pathList = minePaths[mine.c].join(' > ');
    const pokiTag = getPokiTag(mine.x, mine.z);

    const popupContent = `
        <div style="text-align:center; min-width:230px; color:#000; padding: 0; line-height: 1.2;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding: 4px 0; margin-bottom: 8px;">${mine.n}번 광산 <span style="font-size:13px; font-weight:800; color:#d00;">(${specificOres})</span></div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 8px; cursor:pointer;" onclick="copyCoords(${mine.x}, ${mine.y}, ${mine.z})">
                <div style="color:#FFD700; font-size:16px; font-weight:700;">${mine.x}, ${mine.y}, ${mine.z}</div>
                <div style="color:#aaa; font-size:10px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="font-size:12px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 6px;">
                <div style="margin-bottom: 4px; font-weight:600; color:#666;">[공통] ${commonOres}</div>
                <div style="font-weight:700; word-break:break-all; line-height: 1.3;"><span style="color:${mineColors[mine.c]};">동선:</span> ${pathList}</div>
            </div>
            ${pokiTag}
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, 10) });
    marker.on('mouseover', () => minePolylines[mine.c].setStyle({ opacity: 0.8 }));
    marker.on('mouseout', () => minePolylines[mine.c].setStyle({ opacity: 0 }));
});

// [8] 적환단 마커 생성
redItems.forEach((item) => {
    if (typeof item.n === "string") return; 
    const pos = mcToPx(item.x, item.z);
    const marker = L.marker(pos, { icon: redIcon }).addTo(layers.red);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">적환단</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${item.x}, ${item.y}, ${item.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${item.x}, ${item.y}, ${item.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${item.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${item.file}', '_blank')">
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [9] 동상 마커 생성
const hanwolManual = statues.find(st => st.name === "한월동상");
if (hanwolManual) {
    const hanwolPos = [(7300 - 1246), 1278]; 
    const hMarker = L.marker(hanwolPos, { icon: stone2Icon }).addTo(layers.stones);
    const hPopupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${hanwolManual.name}</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${hanwolManual.x}, ${hanwolManual.y}, ${hanwolManual.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${hanwolManual.x}, ${hanwolManual.y}, ${hanwolManual.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${hanwolManual.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${hanwolManual.file}', '_blank')">
            </div>
        </div>
    `;
    hMarker.bindPopup(hPopupContent, { autoPan: false, keepInView: true });
}

statues.filter(st => st.name !== "한월동상").forEach((st) => {
    const pos = mcToPx(st.x, st.z);
    const marker = L.marker(pos, { icon: stone2Icon }).addTo(layers.stones);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${st.name}</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${st.x}, ${st.y}, ${st.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${st.x}, ${st.y}, ${st.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${st.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${st.file}', '_blank')">
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// [10] 비석(산) 마커 생성 (랜덤 포키 적용)
mountains.forEach((mt) => {
    const pos = mcToPx(mt.x, mt.z);
    const marker = L.marker(pos, { icon: stoneIcon }).addTo(layers.stones);
    const pokiTag = getPokiTag(mt.x, mt.z);

    const popupContent = `
        <div style="text-align:center; min-width:180px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${mt.name}</div>
            <div style="background:#333; border-radius:4px; padding: 8px 0; cursor:pointer;" onclick="copyCoords(${mt.x}, ${mt.y}, ${mt.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${mt.x}, ${mt.y}, ${mt.z}</div>
                <div style="color:#aaa; font-size:10px;">(클릭하여 좌표 복사)</div>
            </div>
            ${pokiTag}
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// [11] 항아리 마커 생성 (랜덤 포키 적용)
potItems.forEach((pot) => {
    const pos = mcToPx(pot.x, pot.z);
    const marker = L.marker(pos, { icon: potIcon }).addTo(layers.pot);
    const pokiTag = getPokiTag(pot.x, pot.z);

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0; line-height: 1.3;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${pot.name}</div>
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${pot.x}, ${pot.y}, ${pot.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${pot.x}, ${pot.y}, ${pot.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="font-size:13px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 8px;">
                <div><span style="font-weight:800; color:#d00;">필요도구:</span> ${pot.tool}</div>
                <div><span style="color:#666; font-weight:700;">획득아이템:</span> ${pot.item}</div>
            </div>
            ${pokiTag}
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [12] 의문의 상자 마커 생성 (랜덤 포키 적용)
mysteryBoxes.forEach((box) => {
    const pos = mcToPx(box.x, box.z);
    const isSpecialBox = box.item && box.item.includes("고급주문서뽑기");
    const pokiTag = getPokiTag(box.x, box.z);
    
    let boxIcon;
    if (isSpecialBox) {
        boxIcon = L.divIcon({
            className: 'special-mine',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            html: `<img src="images/box.png" style="width:30px; height:30px; position:absolute; top:3px; left:3px; z-index:10;">`
        });
    } else {
        boxIcon = L.icon({
            iconUrl: 'images/box.png',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -15]
        });
    }

    const marker = L.marker(pos, { icon: boxIcon }).addTo(layers.box);
    
    const itemInfo = box.item ? `<div style="margin-bottom:4px;"><span style="color:#666; font-weight:700;">획득아이템:</span> ${box.item}</div>` : '';
    const entranceInfo = box.entrance ? `<div style="margin-top:4px; padding: 4px; background: #fff1f1; border-radius: 4px; border: 1px dashed #d00;"><span style="color:#d00; font-weight:800;">[상자위치]</span><br><span style="font-size:11px; font-weight:700;">${box.entrance}</span></div>` : '';
    
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0; line-height: 1.3;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${box.name}</div>
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${box.x}, ${box.y}, ${box.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${box.x}, ${box.y}, ${box.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            ${(box.item || box.entrance) ? `<div style="font-size:12px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 8px;">${itemInfo}${entranceInfo}</div>` : ''}
            ${pokiTag}
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [13] 퀘스트 NPC 마커 생성 (랜덤 포키 적용)
npcData.forEach((npc) => {
    const pos = mcToPx(npc.x, npc.z);
    const isSpecial = (npc.name === "탐령구" || npc.name === "정적주");
    const pokiTag = getPokiTag(npc.x, npc.z);
    let currentIcon;

    if (npc.file === "transparent") {
        currentIcon = transparentIcon;
    } else {
        currentIcon = L.icon({
            iconUrl: `images/${npc.file}`,
            iconSize: isSpecial ? [32, 32] : [40, 40],
            iconAnchor: isSpecial ? [16, 16] : [20, 20],
            popupAnchor: [0, -20]
        });
    }

    const marker = L.marker(pos, { icon: currentIcon }).addTo(layers.npc);

    let craftHtml = '';
    if (npc.crafting && npc.crafting.length > 0) {
        // ID에서 특수문자를 완전히 제거해서 안전하게 만듬
        const safeId = npc.name.replace(/[^a-zA-Z0-9가-힣]/g, ''); 
        craftHtml = `
            <div style="margin-top:10px; border-top:2px solid #000; padding-top:10px;">
                <div style="font-weight:900; font-size:13px; color:#000; margin-bottom:8px; text-align:left;">[제작 아이템 목록]</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; background:#333; padding:4px; border:1px solid #000;">
                    ${npc.crafting.map((item, index) => `
                        <div onclick="showRecipe(event, '${npc.name}', ${index})" 
                             style="aspect-ratio: 1/1; background:#1a1a1a; border:1px solid #555; cursor:pointer; display:flex; align-items:center; justify-content:center;"
                             onmouseover="this.style.border='1px solid #ffd700'" 
                             onmouseout="this.style.border='1px solid #555'">
                            <img src="images/${item.img}" style="width:85%; height:85%; object-fit:contain;" title="${item.name}">
                        </div>
                    `).join('')}
                </div>
                <div id="recipe-display-${safeId}" style="margin-top:8px; padding:10px; background:#eee; border:1px solid #000; font-size:12px; font-weight:700; display:none; color:#000; text-align:left; line-height:1.4;">
                </div>
            </div>
        `;
    }
    
    let recordsHtml = '';
    if (npc.records && npc.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[주요 위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${npc.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" 
                                style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let videoHtml = '';
    if (npc.name === "해무사승려") {
        videoHtml = `
            <div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px;">
                <div style="font-weight:800; font-size:13px; color:#007bff; margin-bottom:5px;">[퀘스트 가이드 영상]</div>
                <video width="100%" height="auto" controls playsinline style="border-radius:4px; border:1px solid #ddd; display:block; background:#000;">
                    <source src="images/haemusa.mp4" type="video/mp4">
                </video>
            </div>
        `;
    }

    const popupContent = `
        <div style="text-align:center; min-width:240px; color:#000; padding: 0; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${npc.name}${npc.lv ? `<span style="font-size:12px; color:#666; font-weight:normal;"> (lv.${npc.lv})</span>` : ''}
            </div>
            
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${npc.x}, ${npc.y}, ${npc.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${npc.x}, ${npc.y}, ${npc.z}</div>
                <div style="color:#aaa; font-size:9px;">(위치 복사)</div>
            </div>

            <div style="text-align:left; font-size:12px; color:#333;">
                ${npc.quest ? `<div><span style="color:#d00; font-weight:800;">[퀘스트]</span> ${npc.quest}</div>` : ''}
                ${npc.item ? `<div><span style="color:#007bff; font-weight:800;">[필요재료]</span> ${npc.item}</div>` : ''}
                ${npc.materials ? `<div style="margin-top:8px; padding:8px; background:#f4faff; border:1px solid #cce5ff; border-radius:4px; color:#004085;"><span style="font-weight:800;">[제작재료]</span><br>${npc.materials}</div>` : ''}
                
                ${craftHtml} ${npc.route ? `<div><span style="color:#28a745; font-weight:800;">[동선]</span> ${npc.route}</div>` : ''}
                ${npc.reward ? `<div><span style="color:#f39c12; font-weight:800;">[보상]</span> ${npc.reward}</div>` : ''}
                ${npc.memo ? `<div style="margin-top:6px; border-top:1px dashed #ccc; padding-top:6px; color:#666; font-size:11px;">※ ${npc.memo}</div>` : ''}
                ${recordsHtml}
                ${videoHtml}
            </div>
            ${pokiTag}
        </div>
    `;

    marker.bindPopup(popupContent, { autoPan: true, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [14] 사냥터 영역 및 마커 생성 (랜덤 포키 적용)
const huntingImageBounds = [[0, 0], [7300, 7300]]; 
const huntingListContainer = document.getElementById('hunt-accordion-content');

huntingGrounds.forEach((area) => {
    const overlay = L.imageOverlay(`images/${area.file}`, huntingImageBounds, { opacity: 0.5, interactive: false });
    layers.hunting[area.name] = overlay;

    const targetPos = mcToPx(area.x, area.z);
    const hMarker = L.marker(targetPos, { icon: transparentIcon, zIndexOffset: -500 }).addTo(layers.huntingMarkers); 
    const pokiTag = getPokiTag(area.x, area.z);

    const label = document.createElement('label');
    label.className = 'control-item';
    label.innerHTML = `<input type="checkbox" id="hunt-${area.name}"><span style="flex:1;">${area.name}</span><span style="font-size:10px; color:#888; font-weight:normal;">Lv.${area.lv}</span>`;
    huntingListContainer.appendChild(label);

    const popupContent = `
        <div style="text-align:center; min-width:220px; color:#000; padding: 5px; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #333; padding-bottom:5px; margin-bottom:8px;">${area.name} (Lv.${area.lv})</div>
            <div style="text-align:left; font-size:12px;">
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#007bff;">[몬스터]</span> ${area.monsters}</div>
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#444;">[좌표]</span> ${area.x}, ${area.y}, ${area.z}</div>
                ${area.memo ? `<div style="margin-top:4px; color:#d00; font-weight:700;">${area.memo}</div>` : ''}
            </div>
            ${pokiTag}
        </div>
    `;
    hMarker.bindPopup(popupContent, { autoPan: false, keepInView: true });

    document.getElementById(`hunt-${area.name}`).addEventListener('change', function(e) {
        if(e.target.checked) {
            layers.hunting[area.name].addTo(map);
            hMarker.addTo(map);
            map.flyTo(targetPos, -1, { animate: true, duration: 0.4 }); 
            setTimeout(() => { hMarker.openPopup(); }, 450);
        } else {
            map.removeLayer(layers.hunting[area.name]);
            map.removeLayer(hMarker);
        }
    });
});

// [15] 약초 시스템 (랜덤 포키 적용)
const herbListContainer = document.getElementById('herb-accordion-content');
layers.herbs = {};
layers.herbMarkers = {};
const rareHerbs = ["홍련업화", "철목영지", "금향과", "월계엽", "빙백설화"];

const sortedHerbData = [...herbData].sort((a, b) => {
    const aRare = rareHerbs.includes(a.name);
    const bRare = rareHerbs.includes(b.name);
    if (aRare && !bRare) return -1;
    if (!aRare && bRare) return 1;
    return a.name.localeCompare(b.name, 'ko');
});

sortedHerbData.forEach((herb) => {
    const isRare = rareHerbs.includes(herb.name);
    const overlay = L.imageOverlay(`images/${herb.file}`, huntingImageBounds, { opacity: 0.6, interactive: false });
    layers.herbs[herb.name] = overlay;

    const markerGroup = L.layerGroup();
    herb.locations.forEach(loc => {
        const pos = mcToPx(loc.x, loc.z);
        const hMarker = L.marker(pos, { icon: transparentIcon });
        const yVal = loc.y !== undefined ? loc.y : 0;
        const pokiTag = getPokiTag(loc.x, loc.z);

        const popupContent = `
            <div style="text-align:center; min-width:180px; color:#000;">
                <div style="font-size:16px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:8px;">${herb.name}${isRare ? ' (희귀)' : ''}</div>
                <div style="background:#333; color:#FFD700; border-radius:4px; padding:6px; cursor:pointer; font-size:14px; font-weight:700;" onclick="copyCoords(${loc.x}, ${yVal}, ${loc.z})">
                    ${loc.x}, ${yVal}, ${loc.z}
                    <div style="color:#aaa; font-size:10px; font-weight:normal; margin-top:2px;">(클릭하여 좌표 복사)</div>
                </div>
                ${pokiTag}
            </div>
        `;
        hMarker.bindPopup(popupContent, { closeButton: false, offset: L.point(0, -10) });
        markerGroup.addLayer(hMarker);
    });
    layers.herbMarkers[herb.name] = markerGroup;

    const label = document.createElement('label');
    label.className = 'control-item';
    const listIcon = herb.file ? herb.file.replace('hub', 'hub-') : "";
    label.innerHTML = `<input type="checkbox" id="herb-${herb.name}"><img src="images/${listIcon}" style="width:20px; height:20px; margin-right:8px; object-fit:contain;" onerror="this.style.display='none'"><span style="flex:1;">${herb.name}${isRare ? ' (희귀)' : ''}</span>`;
    herbListContainer.appendChild(label);

    document.getElementById(`herb-${herb.name}`).addEventListener('change', function(e) {
        if(e.target.checked) {
            layers.herbs[herb.name].addTo(map);
            layers.herbMarkers[herb.name].addTo(map);
        } else {
            map.removeLayer(layers.herbs[herb.name]);
            map.removeLayer(layers.herbMarkers[herb.name]);
            map.closePopup();
        }
    });
});

// [16] 체크박스 바인딩 시스템 (동일)
const bindCheckbox = (id, layer) => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', e => {
            if(e.target.checked) layer.addTo(map);
            else map.removeLayer(layer);
        });
    }
};

bindCheckbox('check-spawn', layers.spawn);
bindCheckbox('check-animals', layers.animals);
bindCheckbox('check-stones', layers.stones);
bindCheckbox('check-npc', layers.npc);
bindCheckbox('check-red', layers.red);
bindCheckbox('check-pot', layers.pot);
bindCheckbox('check-box', layers.box);
bindCheckbox('mine-녹', layers.mines["녹"]);
bindCheckbox('mine-청', layers.mines["청"]);
bindCheckbox('mine-황', layers.mines["황"]);
bindCheckbox('mine-적', layers.mines["적"]);

// [17] 검색 시스템 (동일)
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let currentFilteredData = [];

searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    currentFilteredData = []; 

    if (!query) { searchResults.style.display = 'none'; return; }

    sortedHerbData.forEach(h => {
        if (h.name.toLowerCase().includes(query)) currentFilteredData.push({ name: h.name, category: '약초', x: h.locations[0].x, y: (h.locations[0].y || 0), z: h.locations[0].z, type: 'herb', herbName: h.name });
    });
    animals.forEach(ani => {
        if (ani.name.toLowerCase().includes(query)) currentFilteredData.push({ name: ani.name, category: '십이지신', x: ani.mcX, y: ani.mcY, z: ani.mcZ, type: 'animal' });
    });
    mines.forEach(mine => {
        const spec = mineResources[mine.c] || "";
        const common = mineResources["공통"] || "";
        if ((mine.n.toString() + spec + common).toLowerCase().includes(query)) currentFilteredData.push({ name: `${mine.n}번 광산 (${spec})`, category: '광산', x: mine.x, y: mine.y, z: mine.z, type: 'mine' });
    });
    huntingGrounds.forEach(area => {
        if (area.name.toLowerCase().includes(query) || area.monsters.toLowerCase().includes(query)) currentFilteredData.push({ name: area.name, category: '사냥터', x: area.x, y: area.y, z: area.z, type: 'hunting', areaName: area.name });
    });
    const extras = [
        { data: npcData, cat: 'NPC' }, { data: redItems, cat: '적환단' }, { data: statues, cat: '동상/산' }, { data: mountains, cat: '동상/산' }, { data: potItems, cat: '탐색' }, { data: mysteryBoxes, cat: '의문의 상자' }
    ];
    extras.forEach(group => {
        group.data.forEach(item => {
            const name = item.name || (item.n && typeof item.n === "string" ? item.n : "") || (item.file ? "적환단" : group.cat);
            const sName = name.toLowerCase();
            const sQuest = (item.quest || "").toLowerCase();
            const sMat = (item.materials || "").toLowerCase();
            const sItem = (item.item || "").toLowerCase();
            const sTool = (item.tool || "").toLowerCase();
            if (sName.includes(query) || sQuest.includes(query) || sMat.includes(query) || sItem.includes(query) || sTool.includes(query)) {
                let dName = name;
                if (group.cat === '탐색') {
                    if (sItem.includes(query)) dName = `${name} (${item.item})`;
                    else if (sTool.includes(query)) dName = `${name} [${item.tool}]`;
                }
                currentFilteredData.push({ name: dName, category: group.cat, x: item.x, y: (item.y || 0), z: item.z, type: 'extra' });
            }
        });
    });

    if (currentFilteredData.length > 0) {
        searchResults.style.display = 'block';
        currentFilteredData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `<span class="category">[${item.category}]</span> ${item.name}`;
            div.onclick = () => { moveToLocation(item); searchResults.style.display = 'none'; searchInput.value = item.name; };
            searchResults.appendChild(div);
        });
    } else searchResults.style.display = 'none';
});

function moveToLocation(target) {
    const targetPos = mcToPx(target.x, target.z);
    if (target.type !== 'herb') {
        map.flyTo(targetPos, -0.5, { animate: true, duration: 0.5 });
    }

    setTimeout(() => {
        let foundMarker = null;
        const allGroups = [layers.spawn, layers.animals, layers.stones, layers.npc, layers.red, layers.pot, layers.box, layers.huntingMarkers];
        allGroups.forEach(group => {
            if (group.eachLayer) {
                group.eachLayer(layer => {
                    if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) {
                        foundMarker = layer;
                    }
                });
            }
        });

        if (foundMarker) {
            if (!map.hasLayer(foundMarker)) foundMarker.addTo(map);
            foundMarker.openPopup();
        } else {
            L.popup()
                .setLatLng(targetPos)
                .setContent(`
                    <div style="text-align:center; min-width:180px; color:#000;">
                        <div style="font-size:16px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:8px;">[${target.category}] ${target.name}</div>
                        <div style="background:#333; color:#FFD700; border-radius:4px; padding:8px; cursor:pointer; font-size:14px; font-weight:700;" 
                             onclick="copyCoords(${target.x}, ${target.y}, ${target.z})">
                            ${target.x}, ${target.y}, ${target.z}
                            <div style="color:#aaa; font-size:10px; font-weight:normal; margin-top:2px;">(클릭하여 좌표 복사)</div>
                        </div>
                    </div>
                `)
                .openOn(map);
        }
    }, 600);
}

// [18] 비급 정보 제어 기능
window.toggleSkillWindow = function() {
    const win = document.getElementById('skill-window');
    // 만약 blacksmithWin을 안 쓰기로 하셨다면 아래 줄은 주석 처리하거나 지워도 됩니다.
    const blacksmithWin = document.getElementById('blacksmith-window'); 
    
    if (!win) return;

    if (win.style.display === 'none' || win.style.display === '') {
        if (blacksmithWin) blacksmithWin.style.display = 'none';
        win.style.display = 'block';
        renderSkillList();
    } else {
        win.style.display = 'none';
    }
};

window.renderSkillList = function() {
    const container = document.getElementById('skill-list-content');
    if (!container) return;

    container.innerHTML = skillData.map(skill => {
        const imageTag = skill.image 
            ? `<img src="${skill.image}" style="width:100%; border-radius:4px; margin-top:8px; border:1px solid #5e4b3c; display:block;">` 
            : '';

        // 에러 원인이었던 ${pokiTag}를 삭제하고 깔끔하게 정리했습니다.
        return `
            <div style="margin-bottom: 20px; border-bottom: 1px solid #3d3129; padding-bottom: 15px;">
                <div style="font-weight: 900; color: #c5a368; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center;">
                    <span style="background: #a68b5b; color: #1a1512; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 8px; font-weight:900;">SKILL</span>
                    ${skill.name}
                </div>
                <div style="font-size: 12px; color: #b0a59a; font-weight: 700; line-height: 1.6; word-break: keep-all; padding-left: 2px;">
                    ${skill.info}
                </div>
                ${imageTag}
            </div>
        `;
    }).join('');
};

// 버튼 클릭 이벤트 연결
const skillBtn = document.getElementById('skill-btn');
if (skillBtn) {
    skillBtn.addEventListener('click', toggleSkillWindow);
}

// [19] 대장장이 정보창 토글 (동일)
window.toggleBlacksmithWindow = function() {
    const win = document.getElementById('blacksmith-window');
    const skillWin = document.getElementById('skill-window');
    if (!win) return;

    if (win.style.display === 'none' || win.style.display === '') {
        if (skillWin) skillWin.style.display = 'none';
        win.style.display = 'block';
        renderBlacksmithData();
    } else {
        win.style.display = 'none';
    }
};

// [20] 3단계: 부위별 상세 정보 렌더링 (이미지 에러 완벽 방어 버전)
function showPartDetail(itemName, itemData, parts, parentGrid, isAutoOpen) {
    const partArea = parentGrid.nextElementSibling;
    if (!partArea) return;
    
    partArea.innerHTML = '';
    partArea.style.cssText = 'margin-top:10px; padding:10px; position: relative;';

    const fixedSpecBox = document.createElement('div');
    fixedSpecBox.style.cssText = `
        display: none; font-size: 12px; background: #15110e; padding: 12px; 
        border: 2px solid #5e4b3c; margin-top: 10px; line-height: 1.6;
        box-shadow: 4px 4px 10px rgba(0,0,0,0.5); width: calc(100% - 20px); 
        box-sizing: border-box; border-radius: 4px;
    `;
    
    const partGrid = document.createElement('div');
    partGrid.style.cssText = `
        display: ${isAutoOpen ? 'none' : 'grid'}; 
        grid-template-columns: repeat(4, 1fr); gap: 8px;
    `;

    parts.forEach(part => {
        const partSpecificData = (parts[0] === "무기" || parts[0] === "스텟") ? itemData : itemData[part];
        const partContainer = document.createElement('div');
        partContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer;';

        const partIcon = document.createElement('div');
        partIcon.className = 'game-item-box'; 
        
        // --- [수정 포인트: 이미지 경로 최적화] ---
        let imgName = "";
        if (partSpecificData && partSpecificData.file) {
            imgName = partSpecificData.file;
        } else if (parts[0] === "스텟") {
            // 장신구의 경우 "스텟.png"를 찾는 대신 "반지1.png" 처럼 아이템 이름을 쓰게 유도
            imgName = `${itemName}.png`; 
        } else {
            imgName = `${itemName}${part}.png`;
        }

        partIcon.innerHTML = `
            <img src="images/${imgName}" 
                 onerror="this.src='images/${part === '스텟' ? '장신구' : part}.png'; this.onerror=null; if(!this.src.includes('.png')) this.style.display='none';" 
                 style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">
            <div style="position:absolute; color:#444; font-size:9px; z-index:1;">${part}</div>
        `;
        // ----------------------------------------

        const partName = document.createElement('div');
        partName.className = 'game-item-name';
        partName.innerText = part;

        partContainer.appendChild(partIcon);
        partContainer.appendChild(partName);

        const openSpec = () => {
            if (partSpecificData) {
                // 당첨 확인용 이름 (무기/장신구는 이름만, 방어구는 세트+부위)
                const fullPartName = (parts[0] === "무기" || parts[0] === "스텟") ? itemName : `${itemName} ${part}`;

                fixedSpecBox.innerHTML = `
                    <div style="margin-bottom:8px;">
                        <div style="color:#d4af37; font-weight:900; font-size:13px;">[스텟]</div>
                        <div style="color:#eee7c5; font-weight:800; padding-left:4px; margin-top:2px; white-space:pre-wrap;">${partSpecificData.스텟}</div>
                    </div>
                    ${partSpecificData.일반 ? `
                        <div style="border-top:1px solid #3d3129; padding-top:6px;">
                            <div style="color:#8c837a; font-weight:900; font-size:11px;">[일반]</div>
                            <div style="color:#b0a59a; padding-left:4px; margin-top:2px; font-size:11px;">${partSpecificData.일반}</div>
                        </div>
                    ` : ''}
                `;
                
                if (luckyEquipment.includes(fullPartName)) {
                    fixedSpecBox.insertAdjacentHTML('beforeend', `
                        <div style="text-align:center; margin-top:12px; border-top:1px dashed #5e4b3c; padding-top:10px;">
                            <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px; cursor:pointer;" onclick="collectPoki('${fullPartName}')">
                            <div style="font-size:10px; color:#d4af37; margin-top:5px; font-weight:900;">포키 발견! (클릭)</div>
                        </div>
                    `);
                }

                fixedSpecBox.style.display = 'block';
                if(!isAutoOpen) {
                    Array.from(partGrid.children).forEach(child => child.firstChild.style.borderColor = '#000');
                    partIcon.style.borderColor = '#b8860b';
                }
            }
        };
        partContainer.onclick = (e) => { e.stopPropagation(); openSpec(); };
        partGrid.appendChild(partContainer);
        if (isAutoOpen) openSpec();
    });
    partArea.appendChild(partGrid);
    partArea.appendChild(fixedSpecBox);
}

// [21] 1단계: 메인 레벨 선택
function renderBlacksmithData() {
    const container = document.getElementById('blacksmith-list-content');
    if (!container) return;
    container.innerHTML = ''; 

    const gridWrapper = document.createElement('div');
    gridWrapper.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;';

    for (const level in blacksmithData) {
        const levelBtn = document.createElement('div');
        levelBtn.className = 'level-btn-style'; 
        levelBtn.innerText = level;

        levelBtn.onclick = function() {
            Array.from(gridWrapper.children).forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            showLevelDetail(level);
        };
        gridWrapper.appendChild(levelBtn);
    }
    container.appendChild(gridWrapper);

    const detailContainer = document.createElement('div');
    detailContainer.id = 'blacksmith-detail-area';
    container.appendChild(detailContainer);
}

// [22] 2단계: 아이템 선택 (무기 그리드 삐져나감 방지 보정 버전)
function showLevelDetail(level) {
    const detailArea = document.getElementById('blacksmith-detail-area');
    if (!detailArea) return;
    detailArea.innerHTML = '';
    const data = blacksmithData[level];
    
    if (level === "장신구") {
        renderAccessory(level, data, detailArea);
        return;
    }

    for (const category in data) {
        const catData = data[category];
        const catTitle = document.createElement('div');
        catTitle.style.cssText = 'font-weight:900; background:#2a211a; color:#d4af37; padding:8px; margin-top:20px; border-left:4px solid #b8860b; font-size:13px;';
        catTitle.innerText = `[${category}]`;
        detailArea.appendChild(catTitle);

        if (catData.materials) {
            const matInfo = document.createElement('div');
            matInfo.style.cssText = 'font-size:11px; color:#eee7c5; margin:8px 0; font-weight:700; background:#251e19; padding:10px; border:1px solid #4a3d33; border-radius:4px; line-height:1.4;';
            matInfo.innerHTML = `<div style="color:#d4af37; margin-bottom:2px;">필요 재료: ${catData.materials}</div><div style="color:#8c837a;">주문서 횟수: ${catData.scrollCount}회</div>`;
            detailArea.appendChild(matInfo);
        }

        const itemGrid = document.createElement('div');
        itemGrid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-top: 15px; padding: 0 5px;';

        for (const itemName in catData.items) {
            const itemData = catData.items[itemName];
            const itemContainer = document.createElement('div');
            itemContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer; width: 100%;';

            if (category === "무기") {
                const itemBox = document.createElement('div');
                itemBox.className = 'game-item-box'; 
                itemBox.style.cssText = 'width:48px; height:48px; background: radial-gradient(circle, #5e4b3c 0%, #1a1512 100%); border:2px solid #000; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:inset 0 0 8px rgba(0,0,0,0.8);';
                
                let weaponImg = itemData.file ? itemData.file : `${itemName}.png`;
                itemBox.innerHTML = `
                    <img src="images/${weaponImg}" onerror="this.style.display='none'" style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">
                    <div style="position:absolute; color:#444; font-size:8px; z-index:1;">PNG</div>
                `;

                const nameLabel = document.createElement('div');
                nameLabel.className = 'game-item-name';
                nameLabel.style.cssText = 'margin-top:6px; font-size:10px; font-weight:900; color:#ffffff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; text-align:center; word-break:keep-all; width:52px;';
                nameLabel.innerText = itemName;

                itemContainer.appendChild(itemBox);
                itemContainer.appendChild(nameLabel);
                
            } else {
                const itemBtn = document.createElement('div');
                itemBtn.className = 'level-btn-style'; 
                itemBtn.style.cssText = 'padding: 10px 2px; font-size: 11px; width: 100%; min-height: 35px; display: flex; align-items: center; justify-content: center; word-break: keep-all; box-sizing: border-box;';
                itemBtn.innerText = itemName;
                itemContainer.appendChild(itemBtn);
            }

            itemContainer.onclick = function() {
                document.querySelectorAll('.game-item-box, .level-btn-style').forEach(el => {
                    el.classList.remove('selected', 'active');
                });
                const targetEl = itemContainer.firstChild;
                targetEl.classList.add(category === "무기" ? 'selected' : 'active');
                
                const parts = (category === "방어구") ? ["투구", "갑옷", "허리띠", "신발"] : ["무기"];
                showPartDetail(itemName, catData.items[itemName], parts, itemGrid, (parts.length === 1));
            };
            itemGrid.appendChild(itemContainer);
        }
        detailArea.appendChild(itemGrid);
        const infoArea = document.createElement('div');
        infoArea.className = 'part-detail-area-container';
        detailArea.appendChild(infoArea);
    }
}

// [23] 장신구 큰 카테고리
function renderAccessory(level, catData, detailArea) {
    const typeGrid = document.createElement('div');
    typeGrid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px;';

    for (const type in catData) {
        const typeBtn = document.createElement('div');
        typeBtn.className = 'level-btn-style'; 
        typeBtn.innerText = type;
        typeBtn.onclick = function() {
            Array.from(typeGrid.children).forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderAccessoryLevels(type, catData[type], accessoryMainArea);
        };
        typeGrid.appendChild(typeBtn);
    }
    detailArea.appendChild(typeGrid);
    const accessoryMainArea = document.createElement('div');
    detailArea.appendChild(accessoryMainArea);
}

// [24] 장신구 레벨 선택
function renderAccessoryLevels(typeName, levelsData, targetArea) {
    targetArea.innerHTML = ''; 
    const lvGrid = document.createElement('div');
    lvGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 15px;';

    for (const lvKey in levelsData) {
        const lvBtn = document.createElement('div');
        lvBtn.className = 'level-btn-style';
        lvBtn.style.padding = '12px 5px';
        lvBtn.innerText = lvKey;
        lvBtn.onclick = function() {
            Array.from(lvGrid.children).forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderAccessoryItems(lvKey, levelsData[lvKey], itemShowArea);
        };
        lvGrid.appendChild(lvBtn);
    }
    targetArea.appendChild(lvGrid);
    const itemShowArea = document.createElement('div');
    targetArea.appendChild(itemShowArea);
}

// [25] 최종 장신구 아이템 아이콘 표시 (이미지 경로 완벽 연동)
function renderAccessoryItems(lvTitle, items, targetArea) {
    targetArea.innerHTML = '';
    
    const itemGrid = document.createElement('div');
    // 장신구도 5열로 예쁘게 정렬하고 삐져나가지 않게 gap 조정
    itemGrid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 15px; padding: 0 5px;';

    for (const itemName in items) {
        const itemData = items[itemName]; // [중요] 해당 아이템의 전체 데이터(스텟, file 등)를 가져옴
        const itemContainer = document.createElement('div');
        itemContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer; width: 100%;';

        const itemBox = document.createElement('div');
        itemBox.className = 'game-item-box'; 
        // 무기랑 똑같이 48px로 맞췄습니다.
        itemBox.style.cssText = 'width:48px; height:48px; background: radial-gradient(circle, #5e4b3c 0%, #1a1512 100%); border:2px solid #000; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:inset 0 0 8px rgba(0,0,0,0.8);';

        // [핵심] 데이터에 file명이 있으면 이미지를 출력!
        if (itemData.file) {
            itemBox.innerHTML = `
                <img src="images/${itemData.file}" onerror="this.style.display='none'" style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">
                <div style="position:absolute; color:#444; font-size:8px; z-index:1;">PNG</div>
            `;
        } else {
            // 파일명이 없을 때만 예비용 텍스트 출력
            itemBox.innerHTML = `<div style="color:#eee7c5; font-size:10px; font-weight:900;">IMG</div>`;
        }

        const nameLabel = document.createElement('div');
        nameLabel.className = 'game-item-name';
        nameLabel.style.cssText = 'margin-top:6px; font-size:10px; font-weight:900; color:#ffffff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; text-align:center; word-break:keep-all; width:52px;';
        nameLabel.innerText = itemName;

        itemContainer.appendChild(itemBox);
        itemContainer.appendChild(nameLabel);

        itemContainer.onclick = function() {
            document.querySelectorAll('.game-item-box').forEach(el => el.classList.remove('selected'));
            itemBox.classList.add('selected');
            // 장신구는 부위 선택이 없으므로 ["스텟"] 하나만 바로 띄움
            showPartDetail(itemName, itemData, ["스텟"], itemGrid, true);
        };
        itemGrid.appendChild(itemContainer);
    }
    targetArea.appendChild(itemGrid);
    
    // 상세 정보(스텟)가 들어올 공간 추가
    const infoArea = document.createElement('div');
    infoArea.className = 'part-detail-area-container';
    targetArea.appendChild(infoArea);
}

// (팝업 자동 위치 조정 로직)
map.on('popupopen', e => {
    const container = e.popup._container;
    const rect = container.getBoundingClientRect();
    const mapRect = document.getElementById('map').getBoundingClientRect();
    if (rect.top < mapRect.top + 60) container.style.transform += " translateY(" + (rect.height + 40) + "px)";
});

window.showRecipe = function(npcName, index) {
    // NPC 데이터에서 해당 NPC 찾기
    const npc = npcData.find(n => n.name === npcName);
    // 공백을 제거한 ID 생성
    const displayId = `recipe-display-${npcName.replace(/\s+/g, '')}`;
    const displayDiv = document.getElementById(displayId);

    if (npc && npc.crafting && npc.crafting[index] && displayDiv) {
        const item = npc.crafting[index];
        
        // 재료 정보를 화면에 표시
        displayDiv.style.display = 'block';
        displayDiv.innerHTML = `
            <div style="border:1px solid #d4af37; background:#fff; padding:10px; border-radius:4px; margin-top:10px;">
                <div style="color:#d00; font-weight:900; font-size:14px; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:3px;">
                    ★ ${item.name}
                </div>
                <div style="color:#333; font-size:12px; line-height:1.5; font-weight:700; word-break:keep-all;">
                    ${item.materials}
                </div>
            </div>
        `;
        
        // [수정 완료] 팝업 위치만 새로고침 하여 창이 닫히지 않게 함
        const openPopup = map._popup; 
        if (openPopup) {
            openPopup.update(); 
        }
    }
};

// 초기화 버튼 로직들 (동일)
const resetHuntBtn = document.getElementById('reset-hunt');
if (resetHuntBtn) {
    resetHuntBtn.addEventListener('click', () => {
        huntingGrounds.forEach(area => {
            const cb = document.getElementById(`hunt-${area.name}`);
            if (cb && cb.checked) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
        });
    });
}
const resetHerbBtn = document.getElementById('reset-herb');
if (resetHerbBtn) {
    resetHerbBtn.addEventListener('click', () => {
        sortedHerbData.forEach(herb => {
            const cb = document.getElementById(`herb-${herb.name}`);
            if (cb && cb.checked) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
        });
    });
}
