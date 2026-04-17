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

// [5] 십이지신 마커 생성
animals.forEach((ani) => {
    const pos = mcToPx(ani.mcX, ani.mcZ);
    const marker = L.marker(pos, { icon: transparentIcon }).addTo(layers.animals);

    // [이벤트 로직] 십이지신 이름이 '개'일 때만 포키 태그 생성
    const pokiTag = (ani.name === "개") 
        ? `<div style="text-align:center; margin-bottom:10px;">
             <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px;">
             <div style="font-size:10px; color:#d4af37; font-weight:900;">포키 발견!</div>
           </div>` 
        : '';

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 5px 0;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">${ani.order}. ${ani.name}</div>
            
            ${pokiTag} <div style="background:#333; border-radius:4px; padding:10px 0; margin-bottom:12px; cursor:pointer;" onclick="copyCoords(${ani.mcX}, ${ani.mcY}, ${ani.mcZ})">
                <div style="color:#FFD700; font-size:15px; font-weight:700; letter-spacing:0.5px;">${ani.mcX}, ${ani.mcY}, ${ani.mcZ}</div>
                <div style="color:#aaa; font-size:11px; margin-top:4px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="color:#7000CA; font-weight:800; font-size:14px; margin-bottom:8px;">*[히든]십이지신</div>
            <div style="font-size:12px; color:#333; line-height:1.6; letter-spacing:-0.3px; font-weight:600;">
                쥐 > 소 > 호랑이 > 도사 > 토끼 > 용 / 뱀 > 도사 > 말 > 양 > 원숭이 > 도사 / 닭 > 개 > 돼지 > 도사
            </div>
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

// [7] 광산 마커 생성
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

    // 팝업 내용 기본 조립
    let popupContent = `
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
    `;

    // [핵심] 61번일 때만 포키 이미지 영역을 추가
    if (mine.n === 61) {
        popupContent += `
            <div style="margin-top:8px; border-top:1px solid #aaa; padding-top:8px; text-align:center;">
                <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px;">
                <p style="font-size:10px; color:#b8860b; margin-top:5px; font-weight:900;">포키 발견!</p>
            </div>
        `;
    }

    popupContent += `</div>`; // 전체 div 닫기

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

// [10] 비석(산) 마커 생성
mountains.forEach((mt) => {
    const pos = mcToPx(mt.x, mt.z);
    const marker = L.marker(pos, { icon: stoneIcon }).addTo(layers.stones);

    // [이벤트 로직] 산 이름이 '치마산'일 때만 포키 태그 생성
    const pokiTag = (mt.name === "치마산") 
        ? `<div style="margin-top:10px; border-top:1px solid #aaa; padding-top:10px; text-align:center;">
             <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px;">
             <div style="font-size:10px; color:#b8860b; margin-top:5px; font-weight:900;">포키 발견!</div>
           </div>` 
        : '';

    const popupContent = `
        <div style="text-align:center; min-width:180px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${mt.name}</div>
            <div style="background:#333; border-radius:4px; padding: 8px 0; cursor:pointer;" onclick="copyCoords(${mt.x}, ${mt.y}, ${mt.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${mt.x}, ${mt.y}, ${mt.z}</div>
                <div style="color:#aaa; font-size:10px;">(클릭하여 좌표 복사)</div>
            </div>
            ${pokiTag} </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// [11] 항아리 마커 생성
potItems.forEach((pot) => {
    const pos = mcToPx(pot.x, pot.z);
    const marker = L.marker(pos, { icon: potIcon }).addTo(layers.pot);

    // [이벤트 로직] 획득 아이템이 '깨진 옥장식'일 때만 포키 태그 생성
    const pokiTag = (pot.item && pot.item.includes("깨진옥장식")) 
        ? `<div style="margin-top:10px; border-top:1px solid #aaa; padding-top:10px; text-align:center;">
             <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px;">
             <div style="font-size:10px; color:#b8860b; margin-top:5px; font-weight:900;">포키 발견!</div>
           </div>` 
        : '';

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
                ${pokiTag} </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [12] 의문의 상자 마커 생성
mysteryBoxes.forEach((box) => {
    const pos = mcToPx(box.x, box.z);
    
    // item 내용에 "고급주문서뽑기"가 포함되어 있는지 확인
    const isSpecialBox = box.item && box.item.includes("고급주문서뽑기");
    
    let boxIcon;

    if (isSpecialBox) {
        // [강조용] box.png 뒤에 special-mine(빛나는 사각형) 효과를 넣은 아이콘
        boxIcon = L.divIcon({
            className: 'special-mine', // 광산과 똑같이 빛나는 하얀 사각형 효과
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            html: `<img src="images/box.png" style="width:30px; height:30px; position:absolute; top:3px; left:3px; z-index:10;">`
        });
    } else {
        // [기본] 원래 쓰던 box.png 아이콘
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
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [13] 퀘스트 NPC 마커 생성
npcData.forEach((npc) => {
    const pos = mcToPx(npc.x, npc.z);
    const isSpecial = (npc.name === "탐령구" || npc.name === "정적주");
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

    // [이벤트 로직] NPC 이름이 '백향초 재배지'일 때만 포키 태그 생성
    const pokiTag = (npc.name === "백향초재배지") 
        ? `<div style="margin-top:5px; margin-bottom:10px; border-top:1px solid #aaa; padding-top:8px; text-align:center;">
             <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px;">
             <div style="font-size:10px; color:#b8860b; margin-top:3px; font-weight:900;">포키 발견!</div>
           </div>` 
        : '';

    let craftHtml = '';
    if (npc.crafting && npc.crafting.length > 0) {
        craftHtml = `
            <div style="margin-top:10px; border-top:2px solid #000; padding-top:10px;">
                <div style="font-weight:900; font-size:13px; color:#000; margin-bottom:8px; text-align:left;">[제작 아이템 목록]</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; background:#333; padding:4px; border:1px solid #000;">
                    ${npc.crafting.map((item, index) => `
                        <div onclick="showRecipe('${npc.name}', ${index})" 
                             style="aspect-ratio: 1/1; background:#1a1a1a; border:1px solid #555; cursor:pointer; display:flex; align-items:center; justify-content:center;"
                             onmouseover="this.style.border='1px solid #ffd700'" 
                             onmouseout="this.style.border='1px solid #555'">
                            <img src="images/${item.img}" style="width:85%; height:85%; object-fit:contain;" title="${item.name}">
                        </div>
                    `).join('')}
                </div>
                <div id="recipe-display-${npc.name.replace(/\s+/g, '')}" style="margin-top:8px; padding:10px; background:#eee; border:1px solid #000; font-size:12px; font-weight:700; display:none; color:#000; text-align:left; line-height:1.4;">
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

            ${pokiTag} <div style="text-align:left; font-size:12px; color:#333;">
                ${npc.quest ? `<div><span style="color:#d00; font-weight:800;">[퀘스트]</span> ${npc.quest}</div>` : ''}
                ${npc.item ? `<div><span style="color:#007bff; font-weight:800;">[필요재료]</span> ${npc.item}</div>` : ''}
                ${npc.materials ? `<div style="margin-top:8px; padding:8px; background:#f4faff; border:1px solid #cce5ff; border-radius:4px; color:#004085;"><span style="font-weight:800;">[제작재료]</span><br>${npc.materials}</div>` : ''}
                
                ${craftHtml} ${npc.route ? `<div><span style="color:#28a745; font-weight:800;">[동선]</span> ${npc.route}</div>` : ''}
                ${npc.reward ? `<div><span style="color:#f39c12; font-weight:800;">[보상]</span> ${npc.reward}</div>` : ''}
                ${npc.memo ? `<div style="margin-top:6px; border-top:1px dashed #ccc; padding-top:6px; color:#666; font-size:11px;">※ ${npc.memo}</div>` : ''}
                ${recordsHtml}
                ${videoHtml}
            </div>
        </div>
    `;

    marker.bindPopup(popupContent, { autoPan: true, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [14] 사냥터 영역 및 마커 생성
const huntingImageBounds = [[0, 0], [7300, 7300]]; 
const huntingListContainer = document.getElementById('hunt-accordion-content');

huntingGrounds.forEach((area) => {
    const overlay = L.imageOverlay(`images/${area.file}`, huntingImageBounds, { opacity: 0.5, interactive: false });
    layers.hunting[area.name] = overlay;

    const targetPos = mcToPx(area.x, area.z);
    const hMarker = L.marker(targetPos, { icon: transparentIcon, zIndexOffset: -500 }).addTo(layers.huntingMarkers); 

    const label = document.createElement('label');
    label.className = 'control-item';
    label.innerHTML = `<input type="checkbox" id="hunt-${area.name}"><span style="flex:1;">${area.name}</span><span style="font-size:10px; color:#888; font-weight:normal;">Lv.${area.lv}</span>`;
    huntingListContainer.appendChild(label);

    // [이벤트 로직] 사냥터 이름이 '협사곡'일 때만 포키 태그 생성
    const pokiTag = (area.name === "협사곡") 
        ? `<div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px; text-align:center;">
             <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px;">
             <div style="font-size:10px; color:#b8860b; margin-top:5px; font-weight:900;">포키 발견!</div>
           </div>` 
        : '';

    const popupContent = `
        <div style="text-align:center; min-width:220px; color:#000; padding: 5px; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #333; padding-bottom:5px; margin-bottom:8px;">${area.name} (Lv.${area.lv})</div>
            <div style="text-align:left; font-size:12px;">
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#007bff;">[몬스터]</span> ${area.monsters}</div>
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#444;">[좌표]</span> ${area.x}, ${area.y}, ${area.z}</div>
                ${area.memo ? `<div style="margin-top:4px; color:#d00; font-weight:700;">${area.memo}</div>` : ''}
                ${pokiTag} </div>
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

// [15] 약초 시스템
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

    // [이벤트 로직] 이름이 '옥취엽'이고, 다겸님이 말한 특정 좌표일 때만 포키 생성
    const targetX = -3702; 
    const targetZ = -2388;
    
    // 좌표까지 정확히 일치할 때만 pokiTag에 내용을 담습니다.
    const pokiTag = (herb.name === "옥취엽" && loc.x === targetX && loc.z === targetZ) 
        ? `<div style="margin-top:10px; border-top:1px solid #aaa; padding-top:10px; text-align:center;">
             <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px;">
             <div style="font-size:10px; color:#b8860b; margin-top:5px; font-weight:900;">포키 발견!</div>
           </div>` 
        : '';

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

// [16] 체크박스 바인딩 시스템
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

// [17] 검색 시스템
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let currentFilteredData = [];

searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    currentFilteredData = []; 

    if (!query) { searchResults.style.display = 'none'; return; }

    // 약초
    sortedHerbData.forEach(h => {
        if (h.name.toLowerCase().includes(query)) currentFilteredData.push({ name: h.name, category: '약초', x: h.locations[0].x, y: (h.locations[0].y || 0), z: h.locations[0].z, type: 'herb', herbName: h.name });
    });
    // 십이지신
    animals.forEach(ani => {
        if (ani.name.toLowerCase().includes(query)) currentFilteredData.push({ name: ani.name, category: '십이지신', x: ani.mcX, y: ani.mcY, z: ani.mcZ, type: 'animal' });
    });
    // 광산
    mines.forEach(mine => {
        const spec = mineResources[mine.c] || "";
        const common = mineResources["공통"] || "";
        if ((mine.n.toString() + spec + common).toLowerCase().includes(query)) currentFilteredData.push({ name: `${mine.n}번 광산 (${spec})`, category: '광산', x: mine.x, y: mine.y, z: mine.z, type: 'mine' });
    });
    // 사냥터
    huntingGrounds.forEach(area => {
        if (area.name.toLowerCase().includes(query) || area.monsters.toLowerCase().includes(query)) currentFilteredData.push({ name: area.name, category: '사냥터', x: area.x, y: area.y, z: area.z, type: 'hunting', areaName: area.name });
    });
    // 기타 (NPC, 적환단, 동상, 탐색, 상자 등)
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
    
    // 약초가 아닐 때만 부드럽게 이동
    if (target.type !== 'herb') {
        map.flyTo(targetPos, -0.5, { animate: true, duration: 0.5 });
    }

    setTimeout(() => {
        let foundMarker = null;

        // 1. 이미 지도에 있는 마커 찾기 (NPC, 탐색, 상자 등)
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

        // 2. 마커가 있으면 그 마커를 열고, 없으면 전용 좌표 복사 팝업을 띄움
        if (foundMarker) {
            if (!map.hasLayer(foundMarker)) foundMarker.addTo(map);
            foundMarker.openPopup();
        } else {
            // 마커를 못 찾았거나 레이어가 꺼져있을 때 뜨는 좌표 복사 팝업
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

        const pokiTag = (skill.name === "빙천검법") 
            ? `<div style="text-align:center; margin-top:10px;"><img src="images/forky.png" style="width:30px; border:2px solid #d4af37; background:#000; padding:2px;"></div>` 
            : '';

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
                ${pokiTag}
            </div>
        `;
    }).join('');
};

const skillBtn = document.getElementById('skill-btn');
if (skillBtn) {
    skillBtn.addEventListener('click', toggleSkillWindow);
}

// [19] 대장장이 정보창 토글
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

// [20] 3단계: 부위별 상세 정보 렌더링 (적령 허리띠 이벤트 추가)
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
        
        let imgName = (partSpecificData && partSpecificData.file) ? partSpecificData.file : `${part}.png`;

        partIcon.innerHTML = `
            <img src="images/${imgName}" onerror="this.style.display='none'" style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">
            <div style="position:absolute; color:#444; font-size:9px; z-index:1;">${part}</div>
        `;

        const partName = document.createElement('div');
        partName.className = 'game-item-name';
        partName.innerText = part;

        partContainer.appendChild(partIcon);
        partContainer.appendChild(partName);

        const openSpec = () => {
            if (partSpecificData) {
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

                // [이벤트 로직] 아이템 세트 이름이 '적령'이고, 선택한 부위가 '허리띠'일 때만 포키 추가
                if (itemName === "적령" && part === "허리띠") {
                    fixedSpecBox.insertAdjacentHTML('beforeend', `
                        <div style="margin-top:12px; border-top:1px dashed #5e4b3c; padding-top:10px; text-align:center;">
                            <img src="images/forky.png" style="width:25px; border:1px solid #d4af37; background:#000; padding:2px;">
                            <div style="font-size:10px; color:#d4af37; margin-top:5px; font-weight:900;">포키 발견!</div>
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

// [22] 2단계: 아이템 선택
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

// [25] 최종 장신구 아이템 아이콘 표시
function renderAccessoryItems(lvTitle, items, targetArea) {
    targetArea.innerHTML = '';
    
    const itemGrid = document.createElement('div');
    itemGrid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 15px; padding: 0 5px;';

    for (const itemName in items) {
        const itemData = items[itemName]; 
        const itemContainer = document.createElement('div');
        itemContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer; width: 100%;';

        const itemBox = document.createElement('div');
        itemBox.className = 'game-item-box'; 
        itemBox.style.cssText = 'width:48px; height:48px; background: radial-gradient(circle, #5e4b3c 0%, #1a1512 100%); border:2px solid #000; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:inset 0 0 8px rgba(0,0,0,0.8);';

        if (itemData.file) {
            itemBox.innerHTML = `
                <img src="images/${itemData.file}" onerror="this.style.display='none'" style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">
                <div style="position:absolute; color:#444; font-size:8px; z-index:1;">PNG</div>
            `;
        } else {
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
            showPartDetail(itemName, itemData, ["스텟"], itemGrid, true);
        };
        itemGrid.appendChild(itemContainer);
    }
    targetArea.appendChild(itemGrid);
    
    const infoArea = document.createElement('div');
    infoArea.className = 'part-detail-area-container';
    targetArea.appendChild(infoArea);
}

// [21] 팝업 관리 및 제작 아이템 표시
map.on('popupopen', e => {
    const container = e.popup._container;
    const rect = container.getBoundingClientRect();
    const mapRect = document.getElementById('map').getBoundingClientRect();
    if (rect.top < mapRect.top + 60) container.style.transform += " translateY(" + (rect.height + 40) + "px)";
});

window.showRecipe = function(npcName, index) {
    const npc = npcData.find(n => n.name === npcName);
    const displayId = `recipe-display-${npcName.replace(/\s+/g, '')}`;
    const displayDiv = document.getElementById(displayId);
    
    if (npc && npc.crafting && npc.crafting[index] && displayDiv) {
        const item = npc.crafting[index];
        displayDiv.style.display = 'block';
        displayDiv.innerHTML = `
            <div style="color:#d00; font-weight:900; margin-bottom:5px; border-bottom:1px solid #ccc; padding-bottom:3px;">★ ${item.name}</div>
            <div style="color:#333; font-size:11px; word-break:keep-all;">${item.materials}</div>
        `;
    }
};

// 사냥터 초기화
const resetHuntBtn = document.getElementById('reset-hunt');
if (resetHuntBtn) {
    resetHuntBtn.addEventListener('click', () => {
        huntingGrounds.forEach(area => {
            const cb = document.getElementById(`hunt-${area.name}`);
            if (cb && cb.checked) {
                cb.checked = false;
                // 기존 change 이벤트를 강제로 발생시켜 레이어를 제거합니다.
                cb.dispatchEvent(new Event('change'));
            }
        });
    });
}

// 약초 초기화
const resetHerbBtn = document.getElementById('reset-herb');
if (resetHerbBtn) {
    resetHerbBtn.addEventListener('click', () => {
        sortedHerbData.forEach(herb => {
            const cb = document.getElementById(`herb-${herb.name}`);
            if (cb && cb.checked) {
                cb.checked = false;
                // 기존 change 이벤트를 강제로 발생시켜 레이어를 제거합니다.
                cb.dispatchEvent(new Event('change'));
            }
        });
    });
}
