import { useState, useEffect, useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Html } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const T = {
  ru: { calc: "Расчет", addRoom: "Добавить помещение", toBot: "В бот 🚀", area: "Площадь (м²)", perim: "Периметр (м)", corners: "Углы (шт)", geom: "📏 Геометрия", materials: "🎨 Полотно и Профиль", lighting: "💡 Освещение", corniceSec: "🏁 Карнизы", dops: "🔧 Доп. работы", spots: "Точечные (шт)", chands: "Люстры (шт)", track: "Свет. линия/Трек (м)", corniceType: "Вид карниза", corniceLen: "Метраж (м)", pipe: "Обход труб (шт)", canvas: "ПОЛОТНО", profile: "ПРОФИЛЬ", pre: "ПРЕДВАРИТЕЛЬНО:" },
  uk: { calc: "Розрахунок", addRoom: "Додати приміщення", toBot: "В бот 🚀", area: "Площа (м²)", perim: "Периметр (м)", corners: "Кути (шт)", geom: "📏 Геометрія", materials: "🎨 Полотно та Профіль", lighting: "💡 Освітлення", corniceSec: "🏁 Карнизи", dops: "🔧 Дод. роботи", spots: "Точкові (шт)", chands: "Люстри (шт)", track: "Світл. лінія/Трек (м)", corniceType: "Вид карницу", corniceLen: "Метраж (м)", pipe: "Обхід труб (шт)", canvas: "ПОЛОТНО", profile: "ПРОФІЛЬ", pre: "ПОПЕРЕДНЬО:" }
};

// --- Вспомогательные функции геометрии (без изменений) ---
const getDist = (p1, p2) => Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
const getDistToSegment = (p, p1, p2) => {
    let A = p.x - p1.x, B = p.y - p1.y, C = p2.x - p1.x, D = p2.y - p1.y;
    let dot = A * C + B * D, lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) { xx = p1.x; yy = p1.y; }
    else if (param > 1) { xx = p2.x; yy = p2.y; }
    else { xx = p1.x + param * C; yy = p1.y + param * D; }
    return Math.sqrt((p.x - xx)**2 + (p.y - yy)**2);
};
const centerShape = (pts) => {
    let minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
    let minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
    return pts.map(p => ({ x: p.x - (minX + maxX)/2, y: p.y - (minY + maxY)/2 }));
};
const getDefaultDiags = (count) => {
    if (count < 4) return [];
    if (count === 4) return ['AC', 'BD'];
    let diags = [];
    for (let i = 2; i < count - 1; i++) diags.push('A' + String.fromCharCode(65 + i));
    return diags;
};
const getAllPossibleDiags = (count) => {
    let diags = [];
    for (let i = 0; i < count; i++) {
        for (let j = i + 2; j < count; j++) {
            if (i === 0 && j === count - 1) continue; 
            diags.push(String.fromCharCode(65 + i) + String.fromCharCode(65 + j));
        }
    }
    return diags;
};

const solveGeometry = (pts, manualData, activeDiags) => {
  let newPts = pts.map(p => ({...p}));
  let springs = [];
  for(let i = 0; i < pts.length; i++) {
      let j = (i + 1) % pts.length;
      let name = String.fromCharCode(65 + i) + String.fromCharCode(65 + j);
      let isManual = manualData[name] !== undefined && manualData[name] !== '';
      let target = isManual ? parseFloat(manualData[name]) : getDist(pts[i], pts[j]);
      if (!isNaN(target) && target > 0) springs.push({i, j, target, weight: isManual ? 0.9 : 0.6});
  }
  for(let diag of activeDiags) {
      let i = diag.charCodeAt(0) - 65, j = diag.charCodeAt(1) - 65;
      if (i >= pts.length || j >= pts.length || i < 0 || j < 0) continue; 
      let isManual = manualData[diag] !== undefined && manualData[diag] !== '';
      let target = isManual ? parseFloat(manualData[diag]) : getDist(pts[i], pts[j]);
      if (!isNaN(target) && target > 0) springs.push({i, j, target, weight: isManual ? 0.9 : 0.02});
  }
  for(let iter = 0; iter < 1000; iter++) { 
      for(let s of springs) {
          let p1 = newPts[s.i], p2 = newPts[s.j];
          let dx = p2.x - p1.x, dy = p2.y - p1.y, d = Math.sqrt(dx*dx + dy*dy);
          if (d < 0.001) continue;
          let diff = (d - s.target) / d * s.weight; 
          p1.x += dx * diff; p1.y += dy * diff;
          p2.x -= dx * diff; p2.y -= dy * diff;
      }
  }
  let angle = Math.atan2(newPts[1].y - newPts[0].y, newPts[1].x - newPts[0].x);
  return centerShape(newPts.map(p => ({
      x: (p.x - newPts[0].x) * Math.cos(-angle) - (p.y - newPts[0].y) * Math.sin(-angle),
      y: (p.x - newPts[0].x) * Math.sin(-angle) + (p.y - newPts[0].y) * Math.cos(-angle)
  })));
};

// --- 🧊 3D Preview (без изменений) ---
const CeilingGeometry3D = ({ roomPts, elements }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (!roomPts || roomPts.length < 3) return s;
    s.moveTo(roomPts[0].x, roomPts[0].y);
    roomPts.forEach((p, i) => i > 0 && s.lineTo(p.x, p.y));
    s.closePath();
    return s;
  }, [roomPts]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.7, 0]}> 
      <mesh receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshPhysicalMaterial color="#ffffff" metalness={0.1} roughness={0.3} emissive="#ffffff" emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[0, 0, -2.7]} castShadow>
        <extrudeGeometry args={[shape, { depth: 2.7, bevelEnabled: false }]} />
        <meshStandardMaterial color="#f0f0f0" side={THREE.BackSide} />
      </mesh>
      {elements?.map((el) => el.type === 'spot' ? (
          <mesh key={el.id} position={[el.x, el.y, -0.05]}>
              <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} rotation={[Math.PI/2, 0, 0]} />
              <meshBasicMaterial color="#ffffff" />
          </mesh>
      ) : null)}
    </group>
  );
};

// --- 🎨 2D RoomCanvas (С поддержкой ТЕМЫ) ---
const RoomCanvas = ({ room, updateRoom, options, theme }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(30); 
  const [showDiags, setShowDiags] = useState(true);
  const [viewMode, setViewMode] = useState('2d'); 
  const [mode, setMode] = useState('drag'); 
  const [selectedDiagPt, setSelectedDiagPt] = useState(null); 
  const [activeTrackPts, setActiveTrackPts] = useState([]);
  const [els, setEls] = useState(room.elements || []);
  const [draggingElement, setDraggingElement] = useState(null);
  
  const CANVAS_WIDTH = 340, CANVAS_HEIGHT = 320;
  const offset = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }; 
  const [pts, setPts] = useState(room.logicalPts || centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]));
  const [draggingIdx, setDraggingIdx] = useState(null);

  const isDark = theme === 'dark';
  const toScreen = (p) => ({ x: p.x * scale + offset.x, y: p.y * scale + offset.y });
  const toLogical = (p) => ({ x: (p.x - offset.x) / scale, y: (p.y - offset.y) / scale });
  const allPossibleDiags = getAllPossibleDiags(pts.length);

  useEffect(() => { if (room.logicalPts) setPts(room.logicalPts); }, [room.logicalPts]);
  useEffect(() => { setEls(room.elements || []) }, [room.elements]); 

  const syncElementsToInputs = (newEls) => {
      setEls(newEls);
      updateRoom(room.id, 'elements', newEls);
      updateRoom(room.id, 'spots', newEls.filter(e => e.type === 'spot').length || '');
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current, ctx = canvas.getContext('2d');
    const canvasName = options.canvases.find(c => c.id === room.canvas)?.name || 'Полотно';
    const screenPts = pts.map(toScreen);
    const manual = room.manualWalls || {}; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Сетка
    ctx.strokeStyle = isDark ? '#2c2c2e' : '#e5e5ea'; ctx.lineWidth = 1;
    for(let i = offset.x % scale; i < canvas.width; i += scale) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i = offset.y % scale; i < canvas.height; i += scale) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    // Контур
    ctx.beginPath(); ctx.moveTo(screenPts[0].x, screenPts[0].y);
    screenPts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath();
    ctx.fillStyle = isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.08)'; ctx.fill();
    ctx.strokeStyle = mode === 'add' ? '#32d74b' : '#0a84ff'; ctx.lineWidth = 3; ctx.stroke();

    // Диагонали
    if (showDiags && room.activeDiags) {
        ctx.setLineDash([5, 5]); ctx.strokeStyle = isDark ? 'rgba(255, 159, 10, 0.8)' : 'rgba(255, 149, 0, 0.6)';
        room.activeDiags.forEach((diag) => {
            let i = diag.charCodeAt(0)-65, j = diag.charCodeAt(1)-65;
            if (i >= pts.length || j >= pts.length) return;
            ctx.beginPath(); ctx.moveTo(screenPts[i].x, screenPts[i].y); ctx.lineTo(screenPts[j].x, screenPts[j].y); ctx.stroke();
            let mx = (screenPts[i].x + screenPts[j].x)/2, my = (screenPts[i].y + screenPts[j].y)/2;
            let val = manual[diag] || getDist(pts[i], pts[j]).toFixed(2);
            ctx.fillStyle = isDark ? '#1c1c1e' : '#fff'; ctx.fillRect(mx - 28, my - 10, 56, 18);
            ctx.fillStyle = isDark ? '#ff9f0a' : '#ff9500'; ctx.font = 'bold 11px system-ui'; ctx.textAlign='center'; ctx.fillText(`${diag}: ${val}м`, mx, my + 3);
        });
        ctx.setLineDash([]); 
    }

    // Стены
    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
    pts.forEach((p, i) => {
       let next = pts[(i+1)%pts.length], sp = screenPts[i], sn = screenPts[(i+1)%pts.length];
       let mx = (sp.x + sn.x)/2, my = (sp.y + sn.y)/2;
       let name = String.fromCharCode(65+i) + String.fromCharCode(65+(i+1)%pts.length);
       let val = manual[name] || getDist(p, next).toFixed(2);
       ctx.fillStyle = isDark ? '#1c1c1e' : 'rgba(255,255,255,0.85)'; ctx.fillRect(mx - 32, my - 12, 64, 18); 
       ctx.fillStyle = '#0a84ff'; ctx.fillText(`${name}: ${val}м`, mx, my + 2);
    });

    // Углы
    screenPts.forEach((sp, i) => {
       ctx.beginPath(); ctx.arc(sp.x, sp.y, 10, 0, 2 * Math.PI);
       ctx.fillStyle = draggingIdx === i ? '#ff453a' : (isDark ? '#2c2c2e' : '#fff'); ctx.fill();
       ctx.lineWidth = 3; ctx.strokeStyle = '#ff453a'; ctx.stroke();
       ctx.fillStyle = isDark ? '#fff' : '#1c1c1e'; ctx.font = '900 16px system-ui'; ctx.fillText(String.fromCharCode(65+i), sp.x + 18, sp.y - 12);
    });

    // Подпись
    ctx.fillStyle = isDark ? '#fff' : '#1c1c1e'; ctx.textAlign='left'; ctx.font='900 16px system-ui'; ctx.fillText(`${room.name}`, 10, 24);
    ctx.fillStyle = '#0a84ff'; ctx.font='bold 12px system-ui'; ctx.fillText(canvasName, 10, 42);

  }, [pts, draggingIdx, scale, showDiags, room.manualWalls, mode, room.activeDiags, theme, options, room.canvas]);

  // Обработчики мыши (Pointer events)...
  const handlePointerDown = (e) => {
    if (viewMode !== '2d') return;
    const pos = getMousePos(e), lp = toLogical(pos), sps = pts.map(toScreen);
    if (mode === 'remove') {
        const hit = sps.findIndex(p => Math.sqrt((p.x-pos.x)**2 + (p.y-pos.y)**2) < 30);
        if (hit !== -1 && pts.length > 3) {
            const np = pts.filter((_, i) => i !== hit);
            updateRoom(room.id, 'logicalPts', centerShape(np));
            updateRoom(room.id, 'corners', np.length.toString());
            setMode('drag');
        }
    } else if (mode === 'add') {
        let minDist = Infinity, idx = -1;
        pts.forEach((p, i) => {
            let d = getDistToSegment(lp, p, pts[(i+1)%pts.length]);
            if (d < minDist) { minDist = d; idx = i; }
        });
        const np = [...pts]; np.splice(idx+1, 0, lp);
        updateRoom(room.id, 'logicalPts', centerShape(np));
        updateRoom(room.id, 'corners', np.length.toString());
        setMode('drag');
    } else if (mode === 'drag') {
        const hit = sps.findIndex(p => Math.sqrt((p.x-pos.x)**2 + (p.y-pos.y)**2) < 25);
        if (hit !== -1) { setDraggingIdx(hit); e.target.setPointerCapture(e.pointerId); }
    }
  };
  const handlePointerMove = (e) => {
      if (draggingIdx !== null) {
          const np = [...pts]; np[draggingIdx] = toLogical(getMousePos(e));
          setPts(np);
      }
  };
  const handlePointerUp = (e) => {
      if (draggingIdx !== null) {
          e.target.releasePointerCapture(e.pointerId);
          setDraggingIdx(null);
          updateRoom(room.id, 'logicalPts', centerShape(pts));
      }
  };
  const getMousePos = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      return { x: (e.clientX - rect.left) * (CANVAS_WIDTH/rect.width), y: (e.clientY - rect.top) * (CANVAS_HEIGHT/rect.height) };
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center', marginBottom: '15px' }}>
      <div style={{ height: '24px', marginBottom: '8px', fontWeight: '800', fontSize: '13px', color: isDark ? '#ff453a' : '#ff3b30' }}>
          {viewMode === '3d' ? '👀 3D Режим' : (mode === 'add' ? '➕ Клик на стену' : '👆 Тяните за углы')}
      </div>

      <div style={{position: 'relative'}}>
        <canvas id={`canvas-${room.id}`} ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} 
            style={{ display: viewMode === '2d' ? 'block' : 'none', width: '100%', maxWidth: '400px', background: isDark ? '#1c1c1e' : '#fafafa', borderRadius: '12px', border: `1px solid ${isDark ? '#2c2c2e' : '#e5e5ea'}`, touchAction: 'none' }} 
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
        />
        {viewMode === '3d' && <ThreeDPreview roomPts={pts} elements={room.elements} />}
        
        <button onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')} style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '8px 12px', borderRadius: '20px', background: '#ff3b30', color: 'white', border: 'none', fontWeight: '900', fontSize: '13px', zIndex: 10 }}>
            {viewMode === '2d' ? '👀 3D' : '🔙 2D'}
        </button>
      </div>
      
      {viewMode === '2d' && (
          <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button onClick={() => setShowDiags(!showDiags)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${isDark ? '#2c2c2e' : '#e5e5ea'}`, background: isDark ? '#2c2c2e' : '#fff', color: isDark ? '#fff' : '#1c1c1e', fontSize: '13px', fontWeight: '800' }}>
                      {showDiags ? '👁 Скрыть диаг.' : '👓 Показать'}
                  </button>
                  <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setScale(s => Math.max(s - 5, 5))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${isDark ? '#2c2c2e' : '#e5e5ea'}`, background: isDark ? '#2c2c2e' : '#fff', color: '#007aff', fontSize: '20px' }}>-</button>
                      <button onClick={() => setScale(s => Math.min(s + 5, 80))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${isDark ? '#2c2c2e' : '#e5e5ea'}`, background: isDark ? '#2c2c2e' : '#fff', color: '#007aff', fontSize: '20px' }}>+</button>
                  </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => setMode(mode==='add'?'drag':'add')} style={{ flex: 1, padding: '10px', background: mode==='add'?'#34c759':(isDark?'#2c2c2e':'#e5f1ff'), color: mode==='add'?'#fff':'#007aff', borderRadius: '8px', border: 'none', fontWeight: '800' }}>➕ Угол</button>
                <button onClick={() => setMode(mode==='remove'?'drag':'remove')} style={{ flex: 1, padding: '10px', background: mode==='remove'?'#ff3b30':(isDark?'#2c2c2e':'#ffe5e5'), color: mode==='remove'?'#fff':'#ff3b30', borderRadius: '8px', border: 'none', fontWeight: '800' }}>➖ Ластик</button>
              </div>
          </>
      )}
    </div>
  );
};

// --- Умный поиск SearchableSelect (С поддержкой ТЕМЫ) ---
const SearchableSelect = ({ options, value, onChange, theme, placeholder = "Выберите..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isDark = theme === 'dark';
  const selected = options.find(o => o.id === value);
  const filtered = options.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div onClick={() => { setIsOpen(true); setSearchTerm(""); }} 
         style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${isDark ? '#3a3a3c' : '#e5e5ea'}`, background: isDark ? '#1c1c1e' : '#f9f9fb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isOpen ? (
            <input autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onBlur={() => setTimeout(() => setIsOpen(false), 200)} 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '16px', color: isDark ? '#fff' : '#1c1c1e' }} placeholder="Поиск..." />
        ) : (
            <span style={{ fontSize: '16px', color: selected ? (isDark ? '#fff' : '#1c1c1e') : '#8e8e93' }}>{selected ? selected.name : placeholder}</span>
        )}
        <span style={{ color: '#8e8e93', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: isDark ? '#2c2c2e' : '#fff', border: `1px solid ${isDark ? '#3a3a3c' : '#e5e5ea'}`, borderRadius: '10px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
          {filtered.map(o => (
            <div key={o.id} onMouseDown={(e) => { e.preventDefault(); onChange(o.id); setIsOpen(false); }}
              style={{ padding: '12px', borderBottom: `1px solid ${isDark ? '#3a3a3c' : '#f2f2f7'}`, color: value === o.id ? '#007aff' : (isDark ? '#fff' : '#1c1c1e'), background: value === o.id ? (isDark ? '#3a3a3c' : '#f0f8ff') : 'transparent' }}>
              {o.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [lang, setLang] = useState('ru');
  const [userId, setUserId] = useState(null);
  const [isTelegram, setIsTelegram] = useState(true);
  const [theme, setTheme] = useState('light'); // ☀️ 'light' / 🌙 'dark'

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready(); tg.expand();
      setUserId(tg.initDataUnsafe?.user?.id);
      setLang(tg.initDataUnsafe?.user?.language_code === 'uk' ? 'uk' : 'ru');
      // Пытаемся взять системную тему Telegram
      setTheme(tg.colorScheme === 'dark' ? 'dark' : 'light');
    } else { setIsTelegram(false); }
  }, []);

  const isDark = theme === 'dark';
  const t = (key) => T[lang]?.[key] || T['ru'][key];

  const options = {
    canvases: [ { id: 'полотно_м2', name: 'Белый Матовый (MSD)' }, { id: 'msd_premium_320_м2', name: 'MSD Premium (Глянец)' }, { id: 'черный_матовый_м2', name: 'Черный Матовый' } ],
    profiles: [ { id: 'профиль_м', name: 'Стандартный (ПВХ)' }, { id: 'профиль_теневой_6мм_мп', name: 'Теневой (6 мм)' }, { id: 'профиль_парящий_мп', name: 'Парящий' } ],
    cornices: [ { id: 'none', name: 'Нет' }, { id: 'карниз_м', name: 'Стандартный скрытый' }, { id: 'карниз_q5_мп', name: 'Карниз Q5' } ]
  };

  const [rooms, setRooms] = useState([{ id: Date.now(), name: 'Помещение 1', area: '16.00', perim: '16.00', corners: '4', canvas: 'полотно_м2', profile: 'профиль_м', spots: '', logicalPts: centerShape([{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}]), activeDiags:['AC','BD'], manualWalls:{}, elements:[] }]);
  const [expandedRoomId, setExpandedRoomId] = useState(rooms[0].id);
  const [expandedSubSec, setExpandedSubSec] = useState('geom'); 

  const updateRoom = (id, field, value) => setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const sendToBot = async () => {
    const roomsImages = rooms.map(room => ({
        ...room, 
        image_installer: document.getElementById(`canvas-${room.id}`)?.toDataURL('image/png'),
        image_factory: document.getElementById(`canvas-factory-${room.id}`)?.toDataURL('image/png')
    }));
    await fetch('https://potolokpro777bot.website/api/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, rooms: roomsImages }) });
    window.Telegram?.WebApp?.close();
  };

  const localTotalSum = rooms.reduce((total, r) => total + (Number(r.area)*330) + (Number(r.perim)*60), 0);

  if (!isTelegram) return <div style={{ textAlign: 'center', marginTop: '100px' }}>⚠️ Доступ только через Telegram</div>;

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: isDark ? '#000' : '#f5f5f7', display: 'flex', flexDirection: 'column', color: isDark ? '#fff' : '#1c1c1e', transition: '0.3s' }}>
      
      {/* HEADER */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? '#1c1c1e' : '#fff', borderBottom: `1px solid ${isDark ? '#2c2c2e' : '#f2f2f7'}` }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{t('calc')}</h2>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={{ background: isDark ? '#2c2c2e' : '#f2f2f7', border: 'none', padding: '8px 12px', borderRadius: '12px', fontSize: '20px' }}>
              {isDark ? '☀️' : '🌙'}
          </button>
      </div>

      <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', paddingBottom: '140px' }}>
        {rooms.map(room => (
          <div key={room.id} style={{ background: isDark ? '#1c1c1e' : '#fff', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}>
              <span style={{ fontWeight: '800', fontSize: '18px' }}>{expandedRoomId === room.id ? '🔽' : '▶️'} {room.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setRooms(rooms.filter(r => r.id !== room.id)); }} style={{ background: 'none', border: 'none', fontSize: '20px' }}>🗑</button>
            </div>
            
            {expandedRoomId === room.id && (
              <div style={{ padding: '16px', borderTop: `1px solid ${isDark ? '#2c2c2e' : '#f2f2f7'}` }}>
                <div onClick={() => setExpandedSubSec(expandedSubSec === 'geom' ? null : 'geom')} style={{ padding: '10px 0', fontWeight: 'bold' }}>{t('geom')}</div>
                {expandedSubSec === 'geom' && <RoomCanvas room={room} updateRoom={updateRoom} options={options} theme={theme} />}
                
                <div onClick={() => setExpandedSubSec('mat')} style={{ padding: '10px 0', fontWeight: 'bold' }}>{t('materials')}</div>
                {expandedSubSec === 'mat' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <SearchableSelect options={options.canvases} value={room.canvas} onChange={(v)=>updateRoom(room.id,'canvas',v)} theme={theme} placeholder="Полотно" />
                        <SearchableSelect options={options.profiles} value={room.profile} onChange={(v)=>updateRoom(room.id,'profile',v)} theme={theme} placeholder="Профиль" />
                    </div>
                )}
              </div>
            )}
          </div>
        ))}
        <button onClick={() => setRooms([...rooms, { id: Date.now(), name: `Пом. ${rooms.length+1}`, area: '16.00', perim: '16.00', corners: '4', canvas: 'полотно_м2', profile: 'профиль_м', spots: '', logicalPts: centerShape([{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}]), activeDiags:['AC','BD'], manualWalls:{}, elements:[] }])} 
          style={{ width: '100%', padding: '16px', background: isDark ? '#1c1c1e' : '#f2f2f7', color: '#007aff', border: 'none', borderRadius: '16px', fontWeight: '800' }}>➕ {t('addRoom')}</button>
      </div>

      {/* FIXED FOOTER (GLASSMORPHISM) */}
      <div style={{ position: 'fixed', bottom: '20px', left: '10px', right: '10px', background: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', padding: '16px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 100 }}>
           <div>
             <span style={{ color: '#8e8e93', fontSize: '11px', fontWeight: '800' }}>{t('pre')}</span>
             <span style={{ color: isDark ? '#fff' : '#000', fontSize: '22px', fontWeight: '900', display: 'block' }}>{localTotalSum.toLocaleString()} ₴</span>
           </div>
           <button onClick={sendToBot} style={{ background: 'linear-gradient(135deg, #007aff 0%, #0056b3 100%)', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '16px', fontSize: '17px', fontWeight: '800', boxShadow: '0 4px 15px rgba(0,122,255,0.3)' }}>{t('toBot')}</button>
      </div>
    </div>
  );
}
export default App;