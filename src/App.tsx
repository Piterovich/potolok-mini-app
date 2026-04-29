import { useState, useEffect, useRef } from 'react'
import './App.css'

const T = {
  ru: { calc: "Расчет", addRoom: "Добавить помещение", toBot: "В бот 🚀", area: "Площадь (м²)", perim: "Периметр (м)", corners: "Углы (шт)", geom: "📏 Геометрия", materials: "🎨 Полотно и Профиль", lighting: "💡 Освещение", corniceSec: "🏁 Карнизы", dops: "🔧 Доп. работы", spots: "Точечные (шт)", chands: "Люстры (шт)", track: "Магн. трек (м)", corniceType: "Вид карниза", corniceLen: "Метраж (м)", pipe: "Обход труб (шт)", canvas: "ПОЛОТНО", profile: "ПРОФИЛЬ", pre: "ПРЕДВАРИТЕЛЬНО:", dragInfo: "👆 Потяните углы ИЛИ введите цифры ниже" },
  uk: { calc: "Розрахунок", addRoom: "Додати приміщення", toBot: "В бот 🚀", area: "Площа (м²)", perim: "Периметр (м)", corners: "Кути (шт)", geom: "📏 Геометрія", materials: "🎨 Полотно та Профіль", lighting: "💡 Освітлення", corniceSec: "🏁 Карнизи", dops: "🔧 Дод. роботи", spots: "Точкові (шт)", chands: "Люстри (шт)", track: "Магн. трек (м)", corniceType: "Вид карнизу", corniceLen: "Метраж (м)", pipe: "Обхід труб (шт)", canvas: "ПОЛОТНО", profile: "ПРОФІЛЬ", pre: "ПОПЕРЕДНЬО:", dragInfo: "👆 Потягніть кути АБО введіть цифри нижче" }
};

// ==========================================
// 🧠 ФИЗИЧЕСКИЙ ДВИЖОК + АВТО-ЦЕНТРИРОВАНИЕ
// ==========================================
const getDist = (p1, p2) => Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);

const centerShape = (pts) => {
    let minX = Math.min(...pts.map(p => p.x));
    let maxX = Math.max(...pts.map(p => p.x));
    let minY = Math.min(...pts.map(p => p.y));
    let maxY = Math.max(...pts.map(p => p.y));
    let cx = (minX + maxX) / 2;
    let cy = (minY + maxY) / 2;
    return pts.map(p => ({ x: p.x - cx, y: p.y - cy }));
};

const solveGeometry = (pts, manualData) => {
  let newPts = pts.map(p => ({...p}));
  let springs = [];

  for(let i = 0; i < pts.length; i++) {
      let j = (i + 1) % pts.length;
      let name = String.fromCharCode(65 + i) + String.fromCharCode(65 + j);
      let isManual = manualData[name] !== undefined && manualData[name] !== '';
      let target = isManual ? parseFloat(manualData[name]) : getDist(pts[i], pts[j]);
      let weight = isManual ? 0.9 : 0.6; 
      if (!isNaN(target) && target > 0) springs.push({i, j, target, weight});
  }

  if (pts.length === 4) {
      let d1 = "AC", d2 = "BD";
      let isM1 = manualData[d1] !== undefined && manualData[d1] !== '';
      let t1 = isM1 ? parseFloat(manualData[d1]) : getDist(pts[0], pts[2]);
      let w1 = isM1 ? 0.9 : 0.02; 
      
      let isM2 = manualData[d2] !== undefined && manualData[d2] !== '';
      let t2 = isM2 ? parseFloat(manualData[d2]) : getDist(pts[1], pts[3]);
      let w2 = isM2 ? 0.9 : 0.02;
      
      if (!isNaN(t1) && t1 > 0) springs.push({i:0, j:2, target: t1, weight: w1});
      if (!isNaN(t2) && t2 > 0) springs.push({i:1, j:3, target: t2, weight: w2});
  } else if (pts.length > 4) {
       for (let i = 2; i < pts.length - 1; i++) {
           let name = "A" + String.fromCharCode(65 + i);
           let isM = manualData[name] !== undefined && manualData[name] !== '';
           let target = isM ? parseFloat(manualData[name]) : getDist(pts[0], pts[i]);
           let weight = isM ? 0.9 : 0.02;
           if (!isNaN(target) && target > 0) springs.push({i:0, j:i, target, weight});
       }
  }

  for(let iter = 0; iter < 1000; iter++) { 
      for(let s of springs) {
          let p1 = newPts[s.i], p2 = newPts[s.j];
          let dx = p2.x - p1.x, dy = p2.y - p1.y;
          let d = Math.sqrt(dx*dx + dy*dy);
          if (d < 0.001) continue;
          let diff = (d - s.target) / d * s.weight; 
          p1.x += dx * diff; p1.y += dy * diff;
          p2.x -= dx * diff; p2.y -= dy * diff;
      }
  }

  let angle = Math.atan2(newPts[1].y - newPts[0].y, newPts[1].x - newPts[0].x);
  let alignedPts = [];
  let cx = newPts[0].x, cy = newPts[0].y;
  for(let p of newPts) {
      let nx = p.x - cx, ny = p.y - cy;
      alignedPts.push({
          x: nx * Math.cos(-angle) - ny * Math.sin(-angle),
          y: nx * Math.sin(-angle) + ny * Math.cos(-angle)
      });
  }
  return centerShape(alignedPts);
};
// ==========================================


// --- КОМПОНЕНТ УМНОГО ХОЛСТА (CANVAS) ---
const RoomCanvas = ({ room, updateRoom }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(30); 
  const [showDiags, setShowDiags] = useState(true);
  const offset = { x: 150, y: 130 }; 

  const [pts, setPts] = useState(room.logicalPts || centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]));
  const [draggingIdx, setDraggingIdx] = useState(null);

  const toScreen = (p) => ({ x: p.x * scale + offset.x, y: p.y * scale + offset.y });
  const toLogical = (p) => ({ x: (p.x - offset.x) / scale, y: (p.y - offset.y) / scale });

  useEffect(() => {
    if (room.logicalPts) setPts(room.logicalPts);
  }, [room.logicalPts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e5e5ea';
    ctx.lineWidth = 1;
    const step = scale; 
    const startX = offset.x % step;
    const startY = offset.y % step;
    for(let i = startX; i < canvas.width; i += step) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i = startY; i < canvas.height; i += step) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    const screenPts = pts.map(toScreen);
    const manual = room.manualWalls || {}; 

    ctx.beginPath();
    ctx.moveTo(screenPts[0].x, screenPts[0].y);
    for(let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 122, 255, 0.08)'; 
    ctx.fill();
    ctx.strokeStyle = '#007aff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 1. ДИАГОНАЛИ
    if (showDiags) {
        ctx.setLineDash([5, 5]); 
        ctx.strokeStyle = 'rgba(255, 149, 0, 0.6)'; 
        ctx.lineWidth = 1.5;
        ctx.textAlign = 'center';
        
        const diagonals = [];
        if (pts.length === 4) {
            diagonals.push([0, 2], [1, 3]); 
        } else if (pts.length > 4) {
            for (let i = 2; i < pts.length - 1; i++) diagonals.push([0, i]); 
        }

        diagonals.forEach(([i, j]) => {
            let sp1 = screenPts[i], sp2 = screenPts[j];
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(sp2.x, sp2.y);
            ctx.stroke();

            let dist = Math.sqrt((pts[j].x - pts[i].x)**2 + (pts[j].y - pts[i].y)**2);
            let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2;
            let name = String.fromCharCode(65+i) + String.fromCharCode(65+j); 
            
            let displayDist = manual[name] !== undefined && manual[name] !== '' ? manual[name] : dist.toFixed(2);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(mx - 28, my - 10, 56, 18);
            ctx.fillStyle = '#ff9500';
            ctx.font = 'bold 11px system-ui';
            ctx.fillText(`${name}: ${displayDist}м`, mx, my + 3);
        });
        ctx.setLineDash([]); 
    }

    // 2. СТЕНЫ
    ctx.fillStyle = '#1c1c1e';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';

    for(let i = 0; i < pts.length; i++) {
       let p1 = pts[i], p2 = pts[(i+1) % pts.length];
       let dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);

       let sp1 = screenPts[i], sp2 = screenPts[(i+1) % screenPts.length];
       let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2;
       let name = String.fromCharCode(65+i) + String.fromCharCode(65+(i+1)%pts.length); 

       let displayDist = manual[name] !== undefined && manual[name] !== '' ? manual[name] : dist.toFixed(2);

       ctx.fillStyle = 'rgba(255,255,255,0.85)';
       ctx.fillRect(mx - 32, my - 12, 64, 18); 
       ctx.fillStyle = '#007aff';
       ctx.fillText(`${name}: ${displayDist}м`, mx, my + 2);
    }

    // 3. УГЛЫ
    for(let i = 0; i < screenPts.length; i++) {
       let sp = screenPts[i];
       ctx.beginPath();
       ctx.arc(sp.x, sp.y, 10, 0, 2 * Math.PI);
       ctx.fillStyle = draggingIdx === i ? '#ff3b30' : '#ffffff';
       ctx.fill();
       ctx.lineWidth = 3;
       ctx.strokeStyle = '#ff3b30';
       ctx.stroke();

       const label = String.fromCharCode(65 + i); 
       ctx.fillStyle = '#1c1c1e';
       ctx.font = '900 16px system-ui';
       ctx.fillText(label, sp.x + 18, sp.y - 12);
    }
  }, [pts, draggingIdx, scale, showDiags, room.manualWalls]);

  const updateAreaPerimAndSave = (newPts) => {
    let perim = 0, area = 0;
    for(let i = 0; i < newPts.length; i++) {
       let p1 = newPts[i], p2 = newPts[(i+1) % newPts.length];
       perim += Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
       area += (p1.x * p2.y - p2.x * p1.y);
    }
    updateRoom(room.id, 'manualWalls', {}); 
    updateRoom(room.id, 'area', Math.abs(area / 2).toFixed(2));
    updateRoom(room.id, 'perim', perim.toFixed(2));
    updateRoom(room.id, 'corners', newPts.length.toString()); // АВТО-ОБНОВЛЕНИЕ инпута "Углы"
    updateRoom(room.id, 'logicalPts', newPts); 
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    const pos = getMousePos(e);
    const screenPts = pts.map(toScreen);
    const hitIndex = screenPts.findIndex(p => Math.sqrt((p.x - pos.x)**2 + (p.y - pos.y)**2) < 25); 
    if (hitIndex !== -1) {
        setDraggingIdx(hitIndex);
        e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (draggingIdx === null) return;
    const pos = getMousePos(e);
    const newPts = [...pts];
    newPts[draggingIdx] = toLogical(pos);
    setPts(newPts);
  };

  const handlePointerUp = (e) => {
    if (draggingIdx === null) return;
    setDraggingIdx(null);
    e.target.releasePointerCapture(e.pointerId);
    updateAreaPerimAndSave(centerShape(pts));
  };

  // ⭐️ ЛОГИКА ДОБАВЛЕНИЯ ТОЧКИ ⭐️
  const handleAddCorner = () => {
    if (pts.length >= 26) return alert("Достигнут предел углов (Z)");
    let maxD = -1, idx = -1;
    for(let i=0; i<pts.length; i++) {
        let d = getDist(pts[i], pts[(i+1)%pts.length]);
        if(d > maxD) { maxD = d; idx = i; }
    }
    
    let p1 = pts[idx], p2 = pts[(idx+1)%pts.length];
    let dx = p2.x - p1.x, dy = p2.y - p1.y;
    let len = Math.sqrt(dx*dx + dy*dy);
    
    // Создаем новую точку ровно посередине стены, и сдвигаем её наружу на 0.5 метра
    let nx = (p1.x + p2.x)/2 - (dy/len)*0.5;
    let ny = (p1.y + p2.y)/2 + (dx/len)*0.5;
    
    let newPts = [...pts];
    newPts.splice(idx+1, 0, {x: nx, y: ny});
    updateAreaPerimAndSave(centerShape(newPts));
  };

  // ⭐️ ЛОГИКА УДАЛЕНИЯ ТОЧКИ ⭐️
  const handleRemoveCorner = () => {
    if (pts.length <= 3) return alert("У помещения должно быть минимум 3 угла!");
    let newPts = pts.slice(0, pts.length - 1); // Удаляем последний угол
    updateAreaPerimAndSave(centerShape(newPts));
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center', marginBottom: '15px' }}>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={260} 
        style={{ background: '#fafafa', borderRadius: '12px', border: '1px solid #e5e5ea', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <button 
        onClick={() => setShowDiags(!showDiags)} 
        style={{ position: 'absolute', left: '10px', top: '10px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e5ea', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px', color: '#1c1c1e', fontWeight: 'bold' }}>
        {showDiags ? '👁 Скрыть диагонали' : '👁 Показать диагонали'}
      </button>

      <div style={{ position: 'absolute', right: '10px', top: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
         <button onClick={() => setScale(s => Math.min(s + 5, 80))} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e5e5ea', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '20px', color: '#007aff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
         <button onClick={() => setScale(s => Math.max(s - 5, 5))} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e5e5ea', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '20px', color: '#007aff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
      </div>

      {/* НОВЫЕ КНОПКИ УГЛОВ */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '12px' }}>
        <button onClick={handleAddCorner} style={{ flex: 1, padding: '10px', background: '#e5f1ff', color: '#007aff', borderRadius: '8px', border: 'none', fontWeight: '800', fontSize: '14px' }}>➕ Добавить угол</button>
        <button onClick={handleRemoveCorner} style={{ flex: 1, padding: '10px', background: '#ffe5e5', color: '#ff3b30', borderRadius: '8px', border: 'none', fontWeight: '800', fontSize: '14px' }}>➖ Удалить угол</button>
      </div>
    </div>
  );
};
// ----------------------------------------

function App() {
  const [activeTab, setActiveTab] = useState('calc')
  const [lang, setLang] = useState('ru');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready(); tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) { setUserId(user.id); setLang(user.language_code === 'uk' ? 'uk' : 'ru'); }
    }
  }, []);

  const t = (key) => T[lang]?.[key] || T['ru'][key];

  const options = {
    canvases: [
      { id: 'полотно_м2', name: 'Белый Матовый (MSD)' },
      { id: 'msd_premium_320_м2', name: 'MSD Premium (Глянец)' },
      { id: 'черный_матовый_м2', name: 'Черный Матовый' }
    ],
    profiles: [
      { id: 'профиль_м', name: 'Стандартный (ПВХ)' },
      { id: 'профиль_теневой_6мм_мп', name: 'Теневой (6 мм)' },
      { id: 'профиль_парящий_мп', name: 'Парящий' }
    ],
    cornices: [
      { id: 'none', name: 'Нет' },
      { id: 'карниз_м', name: 'Стандартный скрытый' },
      { id: 'карниз_q5_мп', name: 'Карниз Q5' },
      { id: 'карниз_q10_мп', name: 'Карниз Q10' }
    ]
  };

  const [prices] = useState({
    canvas: { 'полотно_м2': 330, 'msd_premium_320_м2': 350, 'черный_матовый_м2': 400 },
    profile: { 'профиль_м': 60, 'профиль_теневой_6мм_мп': 350, 'профиль_парящий_мп': 500 },
    cornices: { 'none': 0, 'карниз_м': 1200, 'карниз_q5_мп': 1500, 'карниз_q10_мп': 2200 },
    light: 250, chand: 300, corner: 50, pipe: 200, track: 2000
  });

  const styles = {
    appContainer: { width: '100%', maxWidth: '100%', margin: '0 auto', height: '100vh', backgroundColor: '#f5f5f7', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
    contentArea: { flex: 1, padding: '12px 8px', overflowY: 'auto', paddingBottom: '140px', boxSizing: 'border-box' },
    card: { background: 'white', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', width: '100%' },
    header: { padding: '16px', background: '#fff', borderBottom: '1px solid #f2f2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    subHeader: { padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fcfcfc', borderBottom: '1px solid #f2f2f7' },
    subContent: { padding: '16px', background: '#fff' },
    label: { fontSize: '11px', fontWeight: '800', color: '#8e8e93', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' },
    select: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e5ea', fontSize: '16px', outline: 'none', background: '#f9f9fb', boxSizing: 'border-box' },
    inputRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    numInput: { width: '85px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e5ea', textAlign: 'center', fontSize: '16px', fontWeight: '600', boxSizing: 'border-box', background: '#fcfcfc' }
  };

  const CalculatorScreen = () => {
    const [rooms, setRooms] = useState([
      { 
        id: Date.now(), name: 'Помещение 1', area: '16.00', perim: '16.00', corners: '4', 
        canvas: 'полотно_м2', profile: 'профиль_м', spots: '6', chands: '', track: '', corniceType: 'none', cornice: '', pipe: '',
        logicalPts: centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]),
        manualWalls: {} 
      }
    ]);
    const [expandedRoomId, setExpandedRoomId] = useState(rooms[0].id);
    const [expandedSubSec, setExpandedSubSec] = useState('geom'); 

    const updateRoom = (id, field, value) => { setRooms(prevRooms => prevRooms.map(r => r.id === id ? { ...r, [field]: value } : r)); };
    
    const handleManualInputChange = (room, name, newVal) => {
        const newManual = {...(room.manualWalls || {}), [name]: newVal};
        updateRoom(room.id, 'manualWalls', newManual);
        
        const newPts = solveGeometry(room.logicalPts, newManual);
        updateRoom(room.id, 'logicalPts', newPts);

        let p_sum = 0, area = 0;
        for(let k=0; k<newPts.length; k++) {
            let p1 = newPts[k], p2 = newPts[(k+1)%newPts.length];
            p_sum += Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
            area += (p1.x*p2.y - p2.x*p1.y);
        }
        updateRoom(room.id, 'perim', p_sum.toFixed(2));
        updateRoom(room.id, 'area', Math.abs(area/2).toFixed(2));
    };

    const addRoom = () => {
      const nr = { 
        id: Date.now(), name: `Помещение ${rooms.length+1}`, area: '16.00', perim: '16.00', corners: '4', 
        canvas: 'полотно_м2', profile: 'профиль_м', spots: '', chands: '', track: '', corniceType: 'none', cornice: '', pipe: '',
        logicalPts: centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]),
        manualWalls: {} 
      };
      setRooms([...rooms, nr]); setExpandedRoomId(nr.id); setExpandedSubSec('geom');
    };

    const removeRoom = (id, e) => {
      e.stopPropagation();
      if (rooms.length > 1) setRooms(rooms.filter(room => room.id !== id));
      else alert("Должно остаться хотя бы одно помещение!");
    };

    const sendToBot = async () => {
      await fetch('https://potolokpro777bot.website/api/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rooms })
      });
      window.Telegram?.WebApp?.close();
    };

    const localTotalSum = rooms.reduce((total, r) => total + ((Number(r.area) || 0) * (prices.canvas[r.canvas] || 330)) + ((Number(r.perim) || 0) * (prices.profile[r.profile] || 60)) + ((Number(r.spots) || 0) * prices.light) + ((Number(r.chands) || 0) * prices.chand) + ((Number(r.track) || 0) * prices.track) + ((Number(r.corners) || 0) * prices.corner) + ((Number(r.cornice) || 0) * (prices.cornices[r.corniceType] || 0)) + ((Number(r.pipe) || 0) * prices.pipe), 0);

    return (
      <div style={{ animation: 'fadeIn 0.3s ease-in', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '15px', alignSelf: 'flex-start', paddingLeft: '8px' }}>{t('calc')}</h2>
        
        {rooms.map(room => (
          <div key={room.id} style={styles.card}>
            <div style={styles.header} onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#007aff', fontSize: '20px' }}>{expandedRoomId === room.id ? '🔽' : '▶️'}</span>
                <input type="text" value={room.name} onChange={e => updateRoom(room.id, 'name', e.target.value)} onClick={e => e.stopPropagation()} style={{ fontWeight: '800', border: 'none', outline: 'none', fontSize: '20px', width: '180px' }} />
              </div>
              <button onClick={(e) => removeRoom(room.id, e)} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '22px' }}>🗑</button>
            </div>

            {expandedRoomId === room.id && (
              <div style={{ animation: 'slideDown 0.2s ease-out' }}>
                
                {/* 1. ГЕОМЕТРИЯ + CANVAS */}
                <div>
                  <div style={styles.subHeader} onClick={() => setExpandedSubSec(expandedSubSec === 'geom' ? null : 'geom')}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t('geom')}</span>
                    <span style={{ color: '#8e8e93' }}>{expandedSubSec === 'geom' ? '🔼' : '🔽'}</span>
                  </div>
                  {expandedSubSec === 'geom' && (
                    <div style={styles.subContent}>
                      
                      <RoomCanvas room={room} updateRoom={updateRoom} />
                      <p style={{ textAlign: 'center', fontSize: '11px', color: '#8e8e93', marginTop: '10px', marginBottom: '15px' }}>{t('dragInfo')}</p>

                      <div style={{ background: '#f9f9fb', padding: '12px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e5e5ea' }}>
                        <span style={{...styles.label, marginBottom: '10px'}}>📐 ТОЧНЫЕ РАЗМЕРЫ (Стены и Диагонали):</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                           
                           {/* СТЕНЫ */}
                           {room.logicalPts?.map((p, i) => {
                              let nextI = (i+1)%room.logicalPts.length;
                              let name = String.fromCharCode(65+i) + String.fromCharCode(65+nextI);
                              let dist = Math.sqrt((room.logicalPts[nextI].x - p.x)**2 + (room.logicalPts[nextI].y - p.y)**2).toFixed(2);
                              let displayVal = room.manualWalls?.[name] !== undefined ? room.manualWalls[name] : dist;

                              return (
                                <div key={name} style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e5ea' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '800', marginRight: '6px', color: '#007aff' }}>{name}:</span>
                                  <input 
                                    type="number" 
                                    value={displayVal} 
                                    onChange={(e) => handleManualInputChange(room, name, e.target.value)}
                                    style={{ width: '55px', border: 'none', background: 'transparent', outline: 'none', fontWeight: 'bold', fontSize: '14px', color: '#1c1c1e' }} 
                                  />
                                </div>
                              )
                           })}

                           {/* ДИАГОНАЛИ */}
                           {(() => {
                               const diags = [];
                               if (room.logicalPts?.length === 4) {
                                   diags.push([0, 2], [1, 3]);
                               } else if (room.logicalPts?.length > 4) {
                                   for (let i = 2; i < room.logicalPts.length - 1; i++) diags.push([0, i]);
                               }
                               return diags.map(([i, j]) => {
                                  let name = String.fromCharCode(65+i) + String.fromCharCode(65+j);
                                  let p1 = room.logicalPts[i], p2 = room.logicalPts[j];
                                  let dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2).toFixed(2);
                                  let displayVal = room.manualWalls?.[name] !== undefined ? room.manualWalls[name] : dist;

                                  return (
                                    <div key={name} style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e5ea' }}>
                                      <span style={{ fontSize: '13px', fontWeight: '800', marginRight: '6px', color: '#ff9500' }}>{name}:</span>
                                      <input 
                                        type="number" 
                                        value={displayVal} 
                                        onChange={(e) => handleManualInputChange(room, name, e.target.value)}
                                        style={{ width: '55px', border: 'none', background: 'transparent', outline: 'none', fontWeight: 'bold', fontSize: '14px', color: '#1c1c1e' }} 
                                      />
                                    </div>
                                  )
                               });
                           })()}
                        </div>
                      </div>

                      <div style={styles.inputRow}><span>{t('area')}</span><input type="number" value={room.area} onChange={e => updateRoom(room.id, 'area', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                      <div style={styles.inputRow}><span>{t('perim')}</span><input type="number" value={room.perim} onChange={e => updateRoom(room.id, 'perim', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                      <div style={styles.inputRow}>
                        <span>{t('corners')}</span>
                        {/* Инпут теперь readOnly, он обновляется сам через кнопки чертежа */}
                        <input type="number" value={room.corners} readOnly style={{...styles.numInput, background: '#f2f2f7', color: '#8e8e93'}} placeholder="4" />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. МАТЕРИАЛЫ */}
                <div>
                  <div style={styles.subHeader} onClick={() => setExpandedSubSec(expandedSubSec === 'mat' ? null : 'mat')}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t('materials')}</span>
                    <span style={{ color: '#8e8e93' }}>{expandedSubSec === 'mat' ? '🔼' : '🔽'}</span>
                  </div>
                  {expandedSubSec === 'mat' && (
                    <div style={styles.subContent}>
                      <span style={styles.label}>{t('canvas')}</span>
                      <select style={styles.select} value={room.canvas} onChange={e => updateRoom(room.id, 'canvas', e.target.value)}>
                        {options.canvases.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                      <div style={{ marginTop: '15px' }}>
                        <span style={styles.label}>{t('profile')}</span>
                        <select style={styles.select} value={room.profile} onChange={e => updateRoom(room.id, 'profile', e.target.value)}>
                          {options.profiles.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ОСВЕЩЕНИЕ */}
                <div>
                  <div style={styles.subHeader} onClick={() => setExpandedSubSec(expandedSubSec === 'light' ? null : 'light')}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t('lighting')}</span>
                    <span style={{ color: '#8e8e93' }}>{expandedSubSec === 'light' ? '🔼' : '🔽'}</span>
                  </div>
                  {expandedSubSec === 'light' && (
                    <div style={styles.subContent}>
                      <div style={styles.inputRow}><span>{t('spots')}</span><input type="number" value={room.spots} onChange={e => updateRoom(room.id, 'spots', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                      <div style={styles.inputRow}><span>{t('chands')}</span><input type="number" value={room.chands} onChange={e => updateRoom(room.id, 'chands', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                      <div style={styles.inputRow}><span>{t('track')}</span><input type="number" value={room.track} onChange={e => updateRoom(room.id, 'track', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                    </div>
                  )}
                </div>

                {/* 4. КАРНИЗЫ */}
                <div>
                  <div style={styles.subHeader} onClick={() => setExpandedSubSec(expandedSubSec === 'corniceSec' ? null : 'corniceSec')}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t('corniceSec')}</span>
                    <span style={{ color: '#8e8e93' }}>{expandedSubSec === 'corniceSec' ? '🔼' : '🔽'}</span>
                  </div>
                  {expandedSubSec === 'corniceSec' && (
                    <div style={styles.subContent}>
                      <span style={styles.label}>{t('corniceType')}</span>
                      <select style={styles.select} value={room.corniceType} onChange={e => updateRoom(room.id, 'corniceType', e.target.value)}>
                        {options.cornices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                      {room.corniceType !== 'none' && (
                        <div style={{...styles.inputRow, marginTop: '15px'}}>
                          <span>{t('corniceLen')}</span>
                          <input type="number" value={room.cornice} onChange={e => updateRoom(room.id, 'cornice', e.target.value)} style={styles.numInput} placeholder="0" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. ДОПЫ */}
                <div>
                  <div style={styles.subHeader} onClick={() => setExpandedSubSec(expandedSubSec === 'dops' ? null : 'dops')}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t('dops')}</span>
                    <span style={{ color: '#8e8e93' }}>{expandedSubSec === 'dops' ? '🔼' : '🔽'}</span>
                  </div>
                  {expandedSubSec === 'dops' && (
                    <div style={styles.subContent}>
                      <div style={styles.inputRow}><span>{t('pipe')}</span><input type="number" value={room.pipe} onChange={e => updateRoom(room.id, 'pipe', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        ))}

        <button onClick={addRoom} style={{ width: '100%', padding: '16px', background: '#f2f2f7', color: '#007aff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>
          ➕ {t('addRoom')}
        </button>

        <div style={{ position: 'fixed', bottom: '20px', left: '10px', right: '10px', background: '#1c1c1e', padding: '16px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', zIndex: 100 }}>
           <div>
             <span style={{ color: '#8e8e93', fontSize: '12px', fontWeight: '800', display: 'block' }}>{t('pre')}</span>
             <span style={{ color: 'white', fontSize: '20px', fontWeight: '900' }}>{localTotalSum.toLocaleString()} ₴</span>
           </div>
           <button onClick={sendToBot} style={{ background: '#007aff', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '14px', fontSize: '16px', fontWeight: '800' }}>{t('toBot')}</button>
        </div>
      </div>
    );
  };

  return <div style={styles.appContainer}><div style={styles.contentArea}><CalculatorScreen /></div></div>;
}
export default App;