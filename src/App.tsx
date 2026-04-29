import { useState, useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Html } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const T = {
  ru: { calc: "Расчет", addRoom: "Добавить помещение", toBot: "В бот 🚀", area: "Площадь (м²)", perim: "Периметр (м)", corners: "Углы (шт)", geom: "📏 Геометрия", materials: "🎨 Полотно и Профиль", lighting: "💡 Освещение", corniceSec: "🏁 Карнизы", dops: "🔧 Доп. работы", spots: "Точечные (шт)", chands: "Люстры (шт)", track: "Магн. трек (м)", corniceType: "Вид карниза", corniceLen: "Метраж (м)", pipe: "Обход труб (шт)", canvas: "ПОЛОТНО", profile: "ПРОФИЛЬ", pre: "ПРЕДВАРИТЕЛЬНО:" },
  uk: { calc: "Розрахунок", addRoom: "Додати приміщення", toBot: "В бот 🚀", area: "Площа (м²)", perim: "Периметр (м)", corners: "Кути (шт)", geom: "📏 Геометрія", materials: "🎨 Полотно та Профіль", lighting: "💡 Освітлення", corniceSec: "🏁 Карнизи", dops: "🔧 Дод. роботи", spots: "Точкові (шт)", chands: "Люстри (шт)", track: "Магн. трек (м)", corniceType: "Вид карнизу", corniceLen: "Метраж (м)", pipe: "Обхід труб (шт)", canvas: "ПОЛОТНО", profile: "ПРОФІЛЬ", pre: "ПОПЕРЕДНЬО:" }
};

// ==========================================
// 🧠 МАТЕМАТИКА
// ==========================================
const getDist = (p1, p2) => Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);

const getDistToSegment = (p, p1, p2) => {
    let A = p.x - p1.x, B = p.y - p1.y;
    let C = p2.x - p1.x, D = p2.y - p1.y;
    let dot = A * C + B * D;
    let lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) { xx = p1.x; yy = p1.y; }
    else if (param > 1) { xx = p2.x; yy = p2.y; }
    else { xx = p1.x + param * C; yy = p1.y + param * D; }
    let dx = p.x - xx, dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

const centerShape = (pts) => {
    let minX = Math.min(...pts.map(p => p.x));
    let maxX = Math.max(...pts.map(p => p.x));
    let minY = Math.min(...pts.map(p => p.y));
    let maxY = Math.max(...pts.map(p => p.y));
    let cx = (minX + maxX) / 2;
    let cy = (minY + maxY) / 2;
    return pts.map(p => ({ x: p.x - cx, y: p.y - cy }));
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
      let weight = isManual ? 0.9 : 0.6; 
      if (!isNaN(target) && target > 0) springs.push({i, j, target, weight});
  }
  for(let diag of activeDiags) {
      let i = diag.charCodeAt(0) - 65; let j = diag.charCodeAt(1) - 65;
      if (i >= pts.length || j >= pts.length || i < 0 || j < 0) continue; 
      let isManual = manualData[diag] !== undefined && manualData[diag] !== '';
      let target = isManual ? parseFloat(manualData[diag]) : getDist(pts[i], pts[j]);
      let weight = isManual ? 0.9 : 0.02; 
      if (!isNaN(target) && target > 0) springs.push({i, j, target, weight});
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
      alignedPts.push({ x: nx * Math.cos(-angle) - ny * Math.sin(-angle), y: nx * Math.sin(-angle) + ny * Math.cos(-angle) });
  }
  return centerShape(alignedPts);
};

// ==========================================
// 🧊 3D ДВИЖОК
// ==========================================
const createThreeShape = (pts) => {
  const shape = new THREE.Shape();
  if (!pts || pts.length < 3) return shape;
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
  shape.closePath();
  return shape;
};

const CeilingGeometry3D = ({ roomPts, elements }) => {
  const extrudeSettings = useMemo(() => ({ depth: 0.1, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), []);
  const wallExtrudeSettings = useMemo(() => ({ depth: 2.7, bevelEnabled: false }), []);
  const shape = useMemo(() => createThreeShape(roomPts), [roomPts]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.7, 0]}> 
      <mesh receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshPhysicalMaterial color="#ffffff" metalness={0.1} roughness={0.3} clearcoat={0.5} emissive="#ffffff" emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[0, 0, -2.7]} castShadow>
        <extrudeGeometry args={[shape, wallExtrudeSettings]} />
        <meshStandardMaterial color="#f0f0f0" side={THREE.BackSide} roughness={1} />
      </mesh>
      <mesh rotation={[0, 0, 0]} position={[0,0,-2.69]}>
          <shapeGeometry args={[shape]} />
          <meshBasicMaterial color="#1c1c1e" side={THREE.DoubleSide} />
      </mesh>

      {/* ⭐️ 3D ОТОБРАЖЕНИЕ ОБОРУДОВАНИЯ НА ПОТОЛКЕ */}
      {elements?.map((el, idx) => {
          if (el.type === 'spot') return (
              <mesh key={el.id} position={[el.x, el.y, 0.05]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} rotation={[Math.PI/2, 0, 0]} />
                  <meshBasicMaterial color="#ffcc00" />
                  <pointLight distance={3} intensity={0.8} color="#fff8e7" />
              </mesh>
          );
          if (el.type === 'chand') return (
              <mesh key={el.id} position={[el.x, el.y, 0.1]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#ff9500" />
                  <pointLight distance={5} intensity={1.2} color="#fff" />
              </mesh>
          );
          // 3D Трек (светящаяся линия)
          if (el.type === 'track') {
              let len = Math.sqrt((el.x2 - el.x1)**2 + (el.y2 - el.y1)**2);
              let angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
              let mx = (el.x1 + el.x2)/2; let my = (el.y1 + el.y2)/2;
              return (
                  <mesh key={el.id} position={[mx, my, 0.02]} rotation={[0, 0, angle]}>
                      <boxGeometry args={[len, 0.05, 0.02]} />
                      <meshBasicMaterial color="#000" />
                  </mesh>
              )
          }
          return null;
      })}
    </group>
  );
};

const ThreeDPreview = ({ roomPts, elements }) => {
  return (
    <div style={{ width: '100%', height: '320px', borderRadius: '12px', overflow: 'hidden', background: '#f5f5f7', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 1.5, 5], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <CeilingGeometry3D roomPts={roomPts} elements={elements} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={1} maxDistance={10} target={[0, 1.35, 0]} />
        <Environment preset="city" blur={0.5} />
        <Grid position={[0, 0.01, 0]} args={[10, 10]} cellColor="#e5e5ea" sectionColor="#8e8e93" fadeDistance={20} />
      </Canvas>
    </div>
  );
};

// ==========================================
// 🎨 2D ХОЛСТ С ОБОРУДОВАНИЕМ
// ==========================================
const RoomCanvas = ({ room, updateRoom }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(30); 
  const [showDiags, setShowDiags] = useState(true);
  const [viewMode, setViewMode] = useState('2d'); 
  
  // ⭐️ НОВЫЕ РЕЖИМЫ ИНСТРУМЕНТОВ
  const [mode, setMode] = useState('drag'); 
  const [selectedDiagPt, setSelectedDiagPt] = useState(null); 
  const [trackStartPt, setTrackStartPt] = useState(null); // Точка А для рисования трека
  
  const CANVAS_WIDTH = 340;
  const CANVAS_HEIGHT = 320;
  const offset = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }; 

  const [pts, setPts] = useState(room.logicalPts || centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]));
  const [draggingIdx, setDraggingIdx] = useState(null);

  const toScreen = (p) => ({ x: p.x * scale + offset.x, y: p.y * scale + offset.y });
  const toLogical = (p) => ({ x: (p.x - offset.x) / scale, y: (p.y - offset.y) / scale });
  const allPossibleDiags = getAllPossibleDiags(pts.length);

  useEffect(() => { if (room.logicalPts) setPts(room.logicalPts); }, [room.logicalPts]);

  // ⭐️ АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ЧЕРТЕЖА СО СМЕТОЙ
  const syncElementsToInputs = (newEls) => {
      updateRoom(room.id, 'elements', newEls);
      const spots = newEls.filter(e => e.type === 'spot').length;
      const chands = newEls.filter(e => e.type === 'chand').length;
      const pipes = newEls.filter(e => e.type === 'pipe').length;
      let trackLen = 0;
      newEls.filter(e => e.type === 'track').forEach(t => trackLen += Math.sqrt((t.x2 - t.x1)**2 + (t.y2 - t.y1)**2));
      
      updateRoom(room.id, 'spots', spots > 0 ? spots.toString() : '');
      updateRoom(room.id, 'chands', chands > 0 ? chands.toString() : '');
      updateRoom(room.id, 'pipe', pipes > 0 ? pipes.toString() : '');
      updateRoom(room.id, 'track', trackLen > 0 ? trackLen.toFixed(1) : '');
  };

  useEffect(() => {
    if (viewMode !== '2d' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e5e5ea'; ctx.lineWidth = 1;
    const step = scale; const startX = offset.x % step; const startY = offset.y % step;
    for(let i = startX; i < canvas.width; i += step) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i = startY; i < canvas.height; i += step) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    const screenPts = pts.map(toScreen);
    const manual = room.manualWalls || {}; 

    ctx.beginPath(); ctx.moveTo(screenPts[0].x, screenPts[0].y);
    for(let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
    ctx.closePath();
    ctx.fillStyle = mode === 'add' ? 'rgba(52, 199, 89, 0.1)' : (mode === 'remove' ? 'rgba(255, 59, 48, 0.05)' : 'rgba(0, 122, 255, 0.08)'); 
    ctx.fill();
    ctx.strokeStyle = mode === 'add' ? '#34c759' : '#007aff';
    ctx.lineWidth = 3; ctx.stroke();

    // 1. ДИАГОНАЛИ
    if (showDiags && room.activeDiags) {
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255, 149, 0, 0.6)'; ctx.lineWidth = 1.5; ctx.textAlign = 'center';
        room.activeDiags.forEach((diag) => {
            let i = diag.charCodeAt(0) - 65; let j = diag.charCodeAt(1) - 65;
            if (i >= pts.length || j >= pts.length || i < 0 || j < 0) return;
            let sp1 = screenPts[i], sp2 = screenPts[j];
            ctx.beginPath(); ctx.moveTo(sp1.x, sp1.y); ctx.lineTo(sp2.x, sp2.y); ctx.stroke();
            let dist = Math.sqrt((pts[j].x - pts[i].x)**2 + (pts[j].y - pts[i].y)**2);
            let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2;
            let displayDist = manual[diag] !== undefined && manual[diag] !== '' ? manual[diag] : dist.toFixed(2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(mx - 28, my - 10, 56, 18);
            ctx.fillStyle = '#ff9500'; ctx.font = 'bold 11px system-ui'; ctx.fillText(`${diag}: ${displayDist}м`, mx, my + 3);
        });
        ctx.setLineDash([]); 
    }

    // 2. СТЕНЫ
    ctx.fillStyle = '#1c1c1e'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
    for(let i = 0; i < pts.length; i++) {
       let p1 = pts[i], p2 = pts[(i+1) % pts.length];
       let dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
       let sp1 = screenPts[i], sp2 = screenPts[(i+1) % screenPts.length];
       let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2;
       let name = String.fromCharCode(65+i) + String.fromCharCode(65+(i+1)%pts.length); 
       let displayDist = manual[name] !== undefined && manual[name] !== '' ? manual[name] : dist.toFixed(2);
       ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(mx - 32, my - 12, 64, 18); 
       ctx.fillStyle = '#007aff'; ctx.fillText(`${name}: ${displayDist}м`, mx, my + 2);
    }

    // ⭐️ 3. ОТРИСОВКА ОБОРУДОВАНИЯ (Точки и Треки) ⭐️
    room.elements?.forEach(el => {
        if (el.type === 'track') {
            let sp1 = toScreen({x: el.x1, y: el.y1}); let sp2 = toScreen({x: el.x2, y: el.y2});
            ctx.beginPath(); ctx.moveTo(sp1.x, sp1.y); ctx.lineTo(sp2.x, sp2.y);
            ctx.strokeStyle = '#1c1c1e'; ctx.lineWidth = 4; ctx.stroke();
            // Подпись длины трека
            let dist = Math.sqrt((el.x2 - el.x1)**2 + (el.y2 - el.y1)**2).toFixed(2);
            let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2;
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(mx - 15, my - 8, 30, 16);
            ctx.fillStyle = '#1c1c1e'; ctx.font = 'bold 10px system-ui'; ctx.fillText(`${dist}м`, mx, my + 3);
        } else {
            let sp = toScreen({x: el.x, y: el.y});
            ctx.beginPath(); 
            ctx.arc(sp.x, sp.y, el.type === 'chand' ? 8 : 5, 0, 2*Math.PI);
            ctx.fillStyle = el.type === 'spot' ? '#ffcc00' : (el.type === 'chand' ? '#ff9500' : '#8e8e93');
            ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            if (el.type === 'pipe') { ctx.fillStyle='#fff'; ctx.font='bold 8px system-ui'; ctx.fillText('T', sp.x, sp.y+3); }
        }
    });

    // Рисуем точку старта трека (если сейчас рисуем его)
    if (mode === 'track' && trackStartPt) {
        let sp = toScreen(trackStartPt);
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, 2*Math.PI); ctx.fillStyle = '#1c1c1e'; ctx.fill();
    }

    // 4. УГЛЫ
    for(let i = 0; i < screenPts.length; i++) {
       let sp = screenPts[i];
       ctx.beginPath(); ctx.arc(sp.x, sp.y, 10, 0, 2 * Math.PI);
       if (mode === 'remove') ctx.fillStyle = '#ff3b30';
       else if (mode === 'add_diag' && selectedDiagPt === i) ctx.fillStyle = '#ff9500'; 
       else ctx.fillStyle = draggingIdx === i ? '#ff3b30' : '#ffffff';
       ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = (mode === 'add_diag' && selectedDiagPt === i) ? '#ff9500' : '#ff3b30'; ctx.stroke();
       const label = String.fromCharCode(65 + i); 
       ctx.fillStyle = '#1c1c1e'; ctx.font = '900 16px system-ui'; ctx.fillText(label, sp.x + 18, sp.y - 12);
    }
  }, [pts, draggingIdx, scale, showDiags, room.manualWalls, mode, room.activeDiags, selectedDiagPt, viewMode, room.elements, trackStartPt]);

  const updateAreaPerimAndSave = (newPts, newDiags = null) => {
    let perim = 0, area = 0;
    for(let i = 0; i < newPts.length; i++) {
       let p1 = newPts[i], p2 = newPts[(i+1) % newPts.length];
       perim += Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
       area += (p1.x * p2.y - p2.x * p1.y);
    }
    updateRoom(room.id, 'manualWalls', {}); 
    updateRoom(room.id, 'area', Math.abs(area / 2).toFixed(2));
    updateRoom(room.id, 'perim', perim.toFixed(2));
    updateRoom(room.id, 'corners', newPts.length.toString()); 
    updateRoom(room.id, 'logicalPts', newPts); 
    if (newDiags) updateRoom(room.id, 'activeDiags', newDiags);
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if(!canvas) return {x:0,y:0};
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (e) => {
    if (viewMode !== '2d') return; 
    const pos = getMousePos(e);
    const screenPts = pts.map(toScreen);
    const logicalPos = toLogical(pos);

    // ⭐️ УМНЫЙ ЛАСТИК (Удаляем всё, во что ткнули)
    if (mode === 'remove') {
        // Проверяем, попали ли в оборудование
        if (room.elements) {
            const hitElIndex = room.elements.findIndex(el => {
                if (el.type === 'track') {
                    let sp1 = toScreen({x: el.x1, y: el.y1}); let sp2 = toScreen({x: el.x2, y: el.y2});
                    return getDistToSegment(pos, sp1, sp2) < 15; // Попали в трек
                } else {
                    let sp = toScreen({x: el.x, y: el.y});
                    return Math.sqrt((sp.x - pos.x)**2 + (sp.y - pos.y)**2) < 15; // Попали в точку
                }
            });
            if (hitElIndex !== -1) {
                const newEls = room.elements.filter((_, idx) => idx !== hitElIndex);
                syncElementsToInputs(newEls);
                return; // Удалили оборудование и вышли (чтобы не удалить угол под ним)
            }
        }
        // Если оборудование не задели - ищем углы
        const hitIndex = screenPts.findIndex(p => Math.sqrt((p.x - pos.x)**2 + (p.y - pos.y)**2) < 30);
        if (hitIndex !== -1) {
            if (pts.length <= 3) return alert("Минимум 3 угла!");
            const newPts = pts.filter((_, idx) => idx !== hitIndex);
            updateAreaPerimAndSave(centerShape(newPts), getDefaultDiags(newPts.length));
            setMode('drag'); 
        }
        return;
    }

    // ⭐️ ДОБАВЛЕНИЕ ТОЧЕЧНОГО ОБОРУДОВАНИЯ (Споты, Люстры, Трубы)
    if (['spot', 'chand', 'pipe'].includes(mode)) {
        const newEls = [...(room.elements || []), { id: Date.now(), type: mode, x: logicalPos.x, y: logicalPos.y }];
        syncElementsToInputs(newEls);
        return; // Остаемся в режиме, чтобы ставить много точек!
    }

    // ⭐️ ДОБАВЛЕНИЕ ТРЕКА (Два клика)
    if (mode === 'track') {
        if (!trackStartPt) {
            setTrackStartPt(logicalPos); // Запомнили точку А
        } else {
            const newEls = [...(room.elements || []), { id: Date.now(), type: 'track', x1: trackStartPt.x, y1: trackStartPt.y, x2: logicalPos.x, y2: logicalPos.y }];
            syncElementsToInputs(newEls);
            setTrackStartPt(null); // Сбросили для следующего трека
        }
        return;
    }

    // Обычная геометрия (Углы и Диагонали)
    if (mode === 'add_diag') {
        const hitIndex = screenPts.findIndex(p => Math.sqrt((p.x - pos.x)**2 + (p.y - pos.y)**2) < 30);
        if (hitIndex !== -1) {
            if (selectedDiagPt === null) setSelectedDiagPt(hitIndex);
            else {
                if (hitIndex === selectedDiagPt) { setSelectedDiagPt(null); return; }
                const diff = Math.abs(hitIndex - selectedDiagPt);
                if (diff === 1 || diff === pts.length - 1) { alert("Это стена! Выберите противоположный угол."); return; }
                let i = Math.min(selectedDiagPt, hitIndex); let j = Math.max(selectedDiagPt, hitIndex);
                let diagName = String.fromCharCode(65+i) + String.fromCharCode(65+j);
                const newDiags = [...room.activeDiags];
                if (!newDiags.includes(diagName)) { newDiags.push(diagName); updateRoom(room.id, 'activeDiags', newDiags); }
                setSelectedDiagPt(null); setMode('drag'); 
            }
        }
        return;
    }

    if (mode === 'add') {
        if (pts.length >= 26) return alert("Достигнут предел углов (Z)");
        let minDist = Infinity; let insertIdx = -1;
        for(let i=0; i<pts.length; i++) {
            let dist = getDistToSegment(logicalPos, pts[i], pts[(i+1)%pts.length]);
            if (dist < minDist) { minDist = dist; insertIdx = i; }
        }
        const newPts = [...pts];
        newPts.splice(insertIdx + 1, 0, logicalPos);
        updateAreaPerimAndSave(centerShape(newPts), getDefaultDiags(newPts.length));
        setMode('drag'); return;
    }

    // Перетаскивание углов
    const hitIndex = screenPts.findIndex(p => Math.sqrt((p.x - pos.x)**2 + (p.y - pos.y)**2) < 25); 
    if (hitIndex !== -1) { setDraggingIdx(hitIndex); e.target.setPointerCapture(e.pointerId); }
  };

  const handlePointerMove = (e) => {
    if (draggingIdx === null || mode !== 'drag') return;
    const pos = getMousePos(e);
    const newPts = [...pts];
    newPts[draggingIdx] = toLogical(pos);
    setPts(newPts);
  };

  const handlePointerUp = (e) => {
    if (draggingIdx === null) return;
    setDraggingIdx(null); e.target.releasePointerCapture(e.pointerId);
    updateAreaPerimAndSave(centerShape(pts));
  };

  const handleModeSwitch = (newMode) => {
      setMode(mode === newMode ? 'drag' : newMode);
      setSelectedDiagPt(null);
      setTrackStartPt(null);
  };

  const getHelperText = () => {
      if (viewMode === '3d') return '👀 3D Режим. Стены: 2.7м. Можно крутить пальцем.';
      if (mode === 'add') return '👆 Кликните на линию стены для создания угла';
      if (mode === 'remove') return '👆 Кликните на объект (угол, точку, трек), чтобы удалить';
      if (mode === 'add_diag') return selectedDiagPt === null ? '👆 Выберите первый угол для диагонали' : '👆 Кликните на противоположный угол';
      if (mode === 'spot') return '👆 Кликайте по чертежу, чтобы расставить Точечные';
      if (mode === 'chand') return '👆 Кликните, чтобы повесить Люстру';
      if (mode === 'pipe') return '👆 Кликните у стены, чтобы отметить Обход трубы';
      if (mode === 'track') return trackStartPt === null ? '👆 Кликните начало Трека' : '👆 Кликните конец Трека';
      return '👆 Потяните углы ИЛИ выберите инструмент ниже';
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center', marginBottom: '15px' }}>
      
      <div style={{ height: '24px', marginBottom: '8px', fontWeight: '800', fontSize: '13px', 
        color: viewMode === '3d' ? '#ff3b30' : (['add', 'spot', 'chand', 'track', 'pipe'].includes(mode) ? '#34c759' : (mode === 'remove' ? '#ff3b30' : '#8e8e93')) }}>
          {getHelperText()}
      </div>

      {viewMode === '2d' ? (
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} 
            style={{ width: '100%', maxWidth: '400px', height: 'auto', background: '#fafafa', borderRadius: '12px', 
                border: ['add', 'spot', 'chand', 'track', 'pipe'].includes(mode) ? '2px solid #34c759' : (mode === 'remove' ? '2px solid #ff3b30' : '1px solid #e5e5ea'), 
                touchAction: 'none', cursor: 'default'
            }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
          />
      ) : (
          <ThreeDPreview roomPts={pts} elements={room.elements} />
      )}
      
      {/* 2D УПРАВЛЕНИЕ */}
      {viewMode === '2d' && (
          <>
            <button onClick={() => setShowDiags(!showDiags)} style={{ position: 'absolute', left: '10px', top: '40px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e5ea', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px', color: '#1c1c1e', fontWeight: 'bold', zIndex: 5 }}>
                {showDiags ? '👁 Скрыть диагонали' : '👁 Показать диагонали'}
            </button>
            <div style={{ position: 'absolute', right: '10px', top: '40px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 5 }}>
                <button onClick={() => setScale(s => Math.min(s + 5, 80))} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e5e5ea', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '20px', color: '#007aff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <button onClick={() => setScale(s => Math.max(s - 5, 5))} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e5e5ea', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '20px', color: '#007aff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
            </div>
          </>
      )}
      
      <button onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')} style={{ position: 'absolute', bottom: '130px', right: '10px', padding: '10px 15px', borderRadius: '20px', background: viewMode === '2d' ? '#ff3b30' : '#8e8e93', color: 'white', border: 'none', fontWeight: '900', fontSize: '14px', boxShadow: '0 4px 15px rgba(255,59,48,0.4)', zIndex: 10, transition: '0.3s' }}>
          {viewMode === '2d' ? '👀 3D' : '🔙 2D Чертеж'}
      </button>

      {/* ⭐️ ПАНЕЛИ ИНСТРУМЕНТОВ (ТОЛЬКО В 2D) */}
      {viewMode === '2d' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              
              {/* Строка 1: Геометрия */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button onClick={() => handleModeSwitch('add')} style={{ flex: 1, padding: '10px 4px', background: mode === 'add' ? '#34c759' : '#e5f1ff', color: mode === 'add' ? '#fff' : '#007aff', borderRadius: '8px', border: 'none', fontWeight: '800', fontSize: '13px', transition: '0.2s' }}>
                    {mode === 'add' ? 'Отмена' : '➕ Угол'}
                </button>
                <button onClick={() => handleModeSwitch('remove')} style={{ flex: 1, padding: '10px 4px', background: mode === 'remove' ? '#ff3b30' : '#ffe5e5', color: mode === 'remove' ? '#fff' : '#ff3b30', borderRadius: '8px', border: 'none', fontWeight: '800', fontSize: '13px', transition: '0.2s' }}>
                    {mode === 'remove' ? 'Отмена' : '➖ Ластик'}
                </button>
                <button onClick={() => handleModeSwitch('add_diag')} style={{ flex: 1, padding: '10px 4px', background: mode === 'add_diag' ? '#ff9500' : '#fff4e5', color: mode === 'add_diag' ? '#fff' : '#ff9500', borderRadius: '8px', border: 'none', fontWeight: '800', fontSize: '13px', transition: '0.2s' }}>
                    {mode === 'add_diag' ? 'Отмена' : '📏 Диагональ'}
                </button>
              </div>

              {/* Строка 2: Оборудование */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button onClick={() => handleModeSwitch('spot')} style={{ flex: 1, padding: '10px 4px', background: mode === 'spot' ? '#ffcc00' : '#fff', color: mode === 'spot' ? '#fff' : '#1c1c1e', border: '1px solid #e5e5ea', borderRadius: '8px', fontWeight: '800', fontSize: '13px', transition: '0.2s' }}>
                    💡 Точка
                </button>
                <button onClick={() => handleModeSwitch('chand')} style={{ flex: 1, padding: '10px 4px', background: mode === 'chand' ? '#ff9500' : '#fff', color: mode === 'chand' ? '#fff' : '#1c1c1e', border: '1px solid #e5e5ea', borderRadius: '8px', fontWeight: '800', fontSize: '13px', transition: '0.2s' }}>
                    🏮 Люстра
                </button>
                <button onClick={() => handleModeSwitch('track')} style={{ flex: 1, padding: '10px 4px', background: mode === 'track' ? '#1c1c1e' : '#fff', color: mode === 'track' ? '#fff' : '#1c1c1e', border: '1px solid #e5e5ea', borderRadius: '8px', fontWeight: '800', fontSize: '13px', transition: '0.2s' }}>
                    ➖ Трек
                </button>
                <button onClick={() => handleModeSwitch('pipe')} style={{ flex: 1, padding: '10px 4px', background: mode === 'pipe' ? '#8e8e93' : '#fff', color: mode === 'pipe' ? '#fff' : '#1c1c1e', border: '1px solid #e5e5ea', borderRadius: '8px', fontWeight: '800', fontSize: '13px', transition: '0.2s' }}>
                    🔲 Труба
                </button>
              </div>

          </div>
      )}

      {/* --- БЛОК РУЧНЫХ РАЗМЕРОВ --- */}
      <div style={{ background: '#f9f9fb', padding: '15px', borderRadius: '12px', marginTop: '15px', border: '1px solid #e5e5ea', textAlign: 'left' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#8e8e93', display: 'block', marginBottom: '8px' }}>📐 СТЕНЫ (м):</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
            {room.logicalPts?.map((p, i) => {
                let nextI = (i+1)%room.logicalPts.length;
                let name = String.fromCharCode(65+i) + String.fromCharCode(65+nextI);
                let dist = Math.sqrt((room.logicalPts[nextI].x - p.x)**2 + (room.logicalPts[nextI].y - p.y)**2).toFixed(2);
                let displayVal = room.manualWalls?.[name] !== undefined ? room.manualWalls[name] : dist;
                return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e5ea' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', marginRight: '6px', color: '#007aff' }}>{name}:</span>
                    <input type="number" value={displayVal} onChange={(e) => updateRoom(room.id, 'manualWalls', {...(room.manualWalls || {}), [name]: e.target.value})} style={{ width: '55px', border: 'none', background: 'transparent', outline: 'none', fontWeight: 'bold', fontSize: '14px', color: '#1c1c1e' }}/>
                </div>
                )
            })}
        </div>

        <span style={{ fontSize: '11px', fontWeight: '800', color: '#8e8e93', display: 'block', marginBottom: '8px' }}>📏 АКТИВНЫЕ ДИАГОНАЛИ (м):</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {room.activeDiags?.map((diagName, index) => {
                let i = diagName.charCodeAt(0) - 65; let j = diagName.charCodeAt(1) - 65;
                if(i >= room.logicalPts.length || j >= room.logicalPts.length) return null;
                let p1 = room.logicalPts[i], p2 = room.logicalPts[j];
                let dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2).toFixed(2);
                let displayVal = room.manualWalls?.[diagName] !== undefined ? room.manualWalls[diagName] : dist;
                return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '4px 6px', borderRadius: '8px', border: '1px solid #e5e5ea' }}>
                    <select value={diagName} onChange={(e) => { const newD = [...room.activeDiags]; newD[index] = e.target.value; updateRoom(room.id, 'activeDiags', newD); }} style={{ border: 'none', outline: 'none', fontWeight: '800', color: '#ff9500', background: 'transparent', fontSize: '13px', marginRight: '4px' }}>
                        {allPossibleDiags.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span style={{fontWeight: '800', color: '#ff9500', marginRight: '4px'}}>:</span>
                    <input type="number" value={displayVal} onChange={(e) => updateRoom(room.id, 'manualWalls', {...(room.manualWalls || {}), [diagName]: e.target.value})} style={{ width: '50px', border: 'none', background: 'transparent', outline: 'none', fontWeight: 'bold', fontSize: '14px', color: '#1c1c1e' }}/>
                    <button onClick={() => { const newD = room.activeDiags.filter((_, i) => i !== index); updateRoom(room.id, 'activeDiags', newD); }} style={{ background: 'none', border: 'none', color: '#ff3b30', marginLeft: '5px', fontSize: '14px' }}>✕</button>
                </div>
                )
            })}
        </div>
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
    canvases: [ { id: 'полотно_м2', name: 'Белый Матовый (MSD)' }, { id: 'msd_premium_320_м2', name: 'MSD Premium (Глянец)' }, { id: 'черный_матовый_м2', name: 'Черный Матовый' } ],
    profiles: [ { id: 'профиль_м', name: 'Стандартный (ПВХ)' }, { id: 'профиль_теневой_6мм_мп', name: 'Теневой (6 мм)' }, { id: 'профиль_парящий_мп', name: 'Парящий' } ],
    cornices: [ { id: 'none', name: 'Нет' }, { id: 'карниз_м', name: 'Стандартный скрытый' }, { id: 'карниз_q5_мп', name: 'Карниз Q5' }, { id: 'карниз_q10_мп', name: 'Карниз Q10' } ]
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
    // ⭐️ ИНИЦИАЛИЗАЦИЯ: Добавлен массив elements: []
    const [rooms, setRooms] = useState([
      { 
        id: Date.now(), name: 'Помещение 1', area: '16.00', perim: '16.00', corners: '4', 
        canvas: 'полотно_м2', profile: 'профиль_м', spots: '', chands: '', track: '', corniceType: 'none', cornice: '', pipe: '',
        logicalPts: centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]),
        activeDiags: ['AC', 'BD'],
        manualWalls: {},
        elements: [] 
      }
    ]);
    const [expandedRoomId, setExpandedRoomId] = useState(rooms[0].id);
    const [expandedSubSec, setExpandedSubSec] = useState('geom'); 

    const updateRoom = (id, field, value) => { setRooms(prevRooms => prevRooms.map(r => r.id === id ? { ...r, [field]: value } : r)); };
    
    useEffect(() => {
        rooms.forEach(room => {
            const newPts = solveGeometry(room.logicalPts, room.manualWalls, room.activeDiags || []);
            let p_sum = 0, area = 0;
            for(let k=0; k<newPts.length; k++) {
                let p1 = newPts[k], p2 = newPts[(k+1)%newPts.length];
                p_sum += Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
                area += (p1.x*p2.y - p2.x*p1.y);
            }
            if (Math.abs(p_sum - parseFloat(room.perim)) > 0.05) {
                updateRoom(room.id, 'logicalPts', newPts);
                updateRoom(room.id, 'perim', p_sum.toFixed(2));
                updateRoom(room.id, 'area', Math.abs(area/2).toFixed(2));
            }
        });
    }, [rooms.map(r => JSON.stringify(r.manualWalls)).join(','), rooms.map(r => JSON.stringify(r.activeDiags)).join(',')]);

    const addRoom = () => {
      const nr = { 
        id: Date.now(), name: `Помещение ${rooms.length+1}`, area: '16.00', perim: '16.00', corners: '4', 
        canvas: 'полотно_м2', profile: 'профиль_м', spots: '', chands: '', track: '', corniceType: 'none', cornice: '', pipe: '',
        logicalPts: centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]),
        activeDiags: ['AC', 'BD'], manualWalls: {}, elements: [] 
      };
      setRooms([...rooms, nr]); setExpandedRoomId(nr.id); setExpandedSubSec('geom');
    };

    const removeRoom = (id, e) => {
      e.stopPropagation();
      if (rooms.length > 1) setRooms(rooms.filter(room => room.id !== id));
      else alert("Должно остаться хотя бы одно помещение!");
    };

    const sendToBot = async () => {
      await fetch('https://potolokpro777bot.website/api/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, rooms }) });
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
                <div>
                  <div style={styles.subHeader} onClick={() => setExpandedSubSec(expandedSubSec === 'geom' ? null : 'geom')}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t('geom')}</span>
                    <span style={{ color: '#8e8e93' }}>{expandedSubSec === 'geom' ? '🔼' : '🔽'}</span>
                  </div>
                  {expandedSubSec === 'geom' && (
                    <div style={styles.subContent}>
                      
                      <RoomCanvas room={room} updateRoom={updateRoom} />
                      
                      <div style={{...styles.inputRow, marginTop: '20px'}}><span>{t('area')}</span><input type="number" value={room.area} onChange={e => updateRoom(room.id, 'area', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                      <div style={styles.inputRow}><span>{t('perim')}</span><input type="number" value={room.perim} onChange={e => updateRoom(room.id, 'perim', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                      <div style={styles.inputRow}><span>{t('corners')}</span><input type="number" value={room.corners} readOnly style={{...styles.numInput, background: '#f2f2f7', color: '#8e8e93'}} placeholder="4" /></div>
                    </div>
                  )}
                </div>
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
        <button onClick={addRoom} style={{ width: '100%', padding: '16px', background: '#f2f2f7', color: '#007aff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>➕ {t('addRoom')}</button>
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