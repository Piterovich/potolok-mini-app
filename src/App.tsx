import { useState, useEffect, useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const T = {
  ru: { calc: "Умный Расчет", dash: "Главная", archive: "Архив", settings: "Настройки", addRoom: "Добавить комнату", toBot: "Оформить смету 🚀", area: "Площадь", perim: "Периметр", corners: "Углы", geom: "📏 Геометрия и замеры", materials: "🎨 Выбор материалов", lighting: "💡 Освещение", corniceSec: "🏁 Карнизы", dops: "🔧 Доп. работы", pre: "ИТОГО ПРЕДВАРИТЕЛЬНО:", contacts: "👤 Данные клиента", clientName: "Имя", clientPhone: "Телефон", clientAddress: "Адрес объекта", savePrice: "💾 Сохранить прайс", priceSaved: "✅ Прайс сохранен!", addPosition: "➕ Добавить позицию", addCategory: "➕ Добавить категорию", deleteConfirm: "Удалить эту категорию полностью?", newCategory: "Новая категория", newItem: "Новая позиция" },
  uk: { calc: "Розумний Розрахунок", dash: "Головна", archive: "Архів", settings: "Налаштування", addRoom: "Додати кімнату", toBot: "Оформити кошторис 🚀", area: "Площа", perim: "Периметр", corners: "Кути", geom: "📏 Геометрія та заміри", materials: "🎨 Вибір матеріалів", lighting: "💡 Освітлення", corniceSec: "🏁 Карнизи", dops: "🔧 Дод. роботи", pre: "РАЗОМ ПОПЕРЕДНЬО:", contacts: "👤 Дані клієнта", clientName: "Ім'я", clientPhone: "Телефон", clientAddress: "Адреса об'єкта", savePrice: "💾 Зберегти прайс", priceSaved: "✅ Прайс збережено!", addPosition: "➕ Додати позицію", addCategory: "➕ Додати категорію", deleteConfirm: "Видалити цю категорію повністю?", newCategory: "Нова категорія", newItem: "Нова позиція" },
  en: { calc: "Smart Calc", dash: "Home", archive: "Archive", settings: "Settings", addRoom: "Add Room", toBot: "Send to Bot 🚀", area: "Area", perim: "Perimeter", corners: "Corners", geom: "📏 Geometry", materials: "🎨 Materials", lighting: "💡 Lighting", corniceSec: "🏁 Cornices", dops: "🔧 Extras", pre: "ESTIMATED TOTAL:", contacts: "👤 Client Data", clientName: "Name", clientPhone: "Phone", clientAddress: "Address", savePrice: "💾 Save Pricing", priceSaved: "✅ Saved!", addPosition: "➕ Add item", addCategory: "➕ Add category", deleteConfirm: "Delete this category entirely?", newCategory: "New category", newItem: "New item" },
  es: { calc: "Cálculo Inteligente", dash: "Inicio", archive: "Archivo", settings: "Ajustes", addRoom: "Añadir sala", toBot: "Enviar al Bot 🚀", area: "Área", perim: "Perímetro", corners: "Esquinas", geom: "📏 Geometría", materials: "🎨 Materiales", lighting: "💡 Iluminación", corniceSec: "🏁 Cornisas", dops: "🔧 Extras", pre: "TOTAL ESTIMADO:", contacts: "👤 Datos del cliente", clientName: "Nombre", clientPhone: "Teléfono", clientAddress: "Dirección", savePrice: "💾 Guardar Precios", priceSaved: "✅ ¡Guardado!", addPosition: "➕ Añadir elemento", addCategory: "➕ Añadir categoría", deleteConfirm: "¿Eliminar esta categoría por completo?", newCategory: "Nueva categoría", newItem: "Nuevo elemento" },
  pl: { calc: "Inteligentny Kalkulator", dash: "Główna", archive: "Archiwum", settings: "Ustawienia", addRoom: "Dodaj pokój", toBot: "Wyślij do Bota 🚀", area: "Powierzchnia", perim: "Obwód", corners: "Kąty", geom: "📏 Geometria", materials: "🎨 Materiały", lighting: "💡 Oświetlenie", corniceSec: "🏁 Karnisze", dops: "🔧 Dodatki", pre: "WSTĘPNA SUMA:", contacts: "👤 Dane klienta", clientName: "Imię", clientPhone: "Telefon", clientAddress: "Adres", savePrice: "💾 Zapisz Cennik", priceSaved: "✅ Zapisano!", addPosition: "➕ Dodaj pozycję", addCategory: "➕ Dodaj kategorię", deleteConfirm: "Usunąć tę kategorię całkowicie?", newCategory: "Nowa kategoria", newItem: "Nowa pozycja" },
  kk: { calc: "Ақылды есептеу", dash: "Басты", archive: "Мұрағат", settings: "Параметрлер", addRoom: "Бөлме қосу", toBot: "Ботқа жіберу 🚀", area: "Аудан", perim: "Периметр", corners: "Бұрыштар", geom: "📏 Геометрия", materials: "🎨 Материалдар", lighting: "💡 Жарықтандыру", corniceSec: "🏁 Карниздер", dops: "🔧 Қосымша жұмыстар", pre: "АЛДЫН АЛА БАҒАСЫ:", contacts: "👤 Клиент деректері", clientName: "Аты", clientPhone: "Телефон", clientAddress: "Мекенжайы", savePrice: "💾 Бағаны сақтау", priceSaved: "✅ Сақталды!", addPosition: "➕ Позиция қосу", addCategory: "➕ Санат қосу", deleteConfirm: "Бұл санатты толығымен жою керек пе?", newCategory: "Жаңа санат", newItem: "Жаңа позиция" }
};

const cleanNum = (val) => {
    let str = String(val);
    if (str.length > 1 && str.startsWith('0') && str[1] !== '.') return str.replace(/^0+/, '');
    return str;
};

// --- Геометрия ---
const getDist = (p1, p2) => Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
const getDistToSegment = (p, p1, p2) => {
    let A = p.x - p1.x, B = p.y - p1.y, C = p2.x - p1.x, D = p2.y - p1.y;
    let dot = A * C + B * D, lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) { xx = p1.x; yy = p1.y; } else if (param > 1) { xx = p2.x; yy = p2.y; } else { xx = p1.x + param * C; yy = p1.y + param * D; }
    return Math.sqrt((p.x - xx)**2 + (p.y - yy)**2);
};
const centerShape = (pts) => {
    let minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
    let minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
    return pts.map(p => ({ x: p.x - (minX + maxX)/2, y: p.y - (minY + maxY)/2 }));
};
const getDefaultDiags = (count) => { if (count < 4) return []; if (count === 4) return ['AC', 'BD']; let diags = []; for (let i = 2; i < count - 1; i++) diags.push('A' + String.fromCharCode(65 + i)); return diags; };
const getAllPossibleDiags = (count) => { let diags = []; for (let i = 0; i < count; i++) { for (let j = i + 2; j < count; j++) { if (i === 0 && j === count - 1) continue; diags.push(String.fromCharCode(65 + i) + String.fromCharCode(65 + j)); } } return diags; };
const solveGeometry = (pts, manualData, activeDiags) => {
  let newPts = pts.map(p => ({...p})); let springs = [];
  for(let i = 0; i < pts.length; i++) { let j = (i + 1) % pts.length; let name = String.fromCharCode(65 + i) + String.fromCharCode(65 + j); let isManual = manualData[name] !== undefined && manualData[name] !== ''; let target = isManual ? parseFloat(manualData[name]) : getDist(pts[i], pts[j]); let weight = isManual ? 0.9 : 0.6; if (!isNaN(target) && target > 0) springs.push({i, j, target, weight}); }
  for(let diag of activeDiags) { let i = diag.charCodeAt(0) - 65; let j = diag.charCodeAt(1) - 65; if (i >= pts.length || j >= pts.length || i < 0 || j < 0) continue; let isManual = manualData[diag] !== undefined && manualData[diag] !== ''; let target = isManual ? parseFloat(manualData[diag]) : getDist(pts[i], pts[j]); let weight = isManual ? 0.9 : 0.02; if (!isNaN(target) && target > 0) springs.push({i, j, target, weight}); }
  for(let iter = 0; iter < 1000; iter++) { for(let s of springs) { let p1 = newPts[s.i], p2 = newPts[s.j]; let dx = p2.x - p1.x, dy = p2.y - p1.y; let d = Math.sqrt(dx*dx + dy*dy); if (d < 0.001) continue; let diff = (d - s.target) / d * s.weight; p1.x += dx * diff; p1.y += dy * diff; p2.x -= dx * diff; p2.y -= dy * diff; } }
  let angle = Math.atan2(newPts[1].y - newPts[0].y, newPts[1].x - newPts[0].x); let alignedPts = []; let cx = newPts[0].x, cy = newPts[0].y;
  for(let p of newPts) { let nx = p.x - cx, ny = p.y - cy; alignedPts.push({ x: nx * Math.cos(-angle) - ny * Math.sin(-angle), y: nx * Math.sin(-angle) + ny * Math.cos(-angle) }); }
  return centerShape(alignedPts);
};

// --- 3D Preview ---
const createThreeShape = (pts) => { const shape = new THREE.Shape(); if (!pts || pts.length < 3) return shape; shape.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y); shape.closePath(); return shape; };
const CeilingGeometry3D = ({ roomPts, elements }) => {
  const wallExtrudeSettings = useMemo(() => ({ depth: 2.7, bevelEnabled: false }), []); const shape = useMemo(() => createThreeShape(roomPts), [roomPts]);
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.7, 0]}> 
      <mesh receiveShadow><shapeGeometry args={[shape]} /><meshPhysicalMaterial color="#ffffff" metalness={0.1} roughness={0.3} clearcoat={0.5} emissive="#ffffff" emissiveIntensity={0.05} /></mesh>
      <mesh position={[0, 0, -2.7]} castShadow><extrudeGeometry args={[shape, wallExtrudeSettings]} /><meshStandardMaterial color="#f0f0f0" side={THREE.BackSide} roughness={1} /></mesh>
      <mesh rotation={[0, 0, 0]} position={[0,0,-2.69]}><shapeGeometry args={[shape]} /><meshBasicMaterial color="#1c1c1e" side={THREE.DoubleSide} /></mesh>
      {elements?.map((el, idx) => {
          if (el.type === 'spot') return ( <mesh key={el.id} position={[el.x, el.y, -0.05]}> <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} rotation={[Math.PI/2, 0, 0]} /><meshBasicMaterial color="#ffffff" /><pointLight distance={3} intensity={0.6} color="#fff8e7" /></mesh> );
          if (el.type === 'chand') return ( <mesh key={el.id} position={[el.x, el.y, -0.2]}> <sphereGeometry args={[0.15, 16, 16]} /><meshBasicMaterial color="#ffcc00" /><pointLight distance={5} intensity={1} color="#ffffff" /></mesh> );
          if (el.type === 'track') {
              return el.points.map((pt, i) => {
                  if (i === 0) return null; let prev = el.points[i-1]; let len = Math.sqrt((pt.x - prev.x)**2 + (pt.y - prev.y)**2); let angle = Math.atan2(pt.y - prev.y, pt.x - prev.x); let mx = (prev.x + pt.x)/2; let my = (prev.y + pt.y)/2;
                  return ( <group key={`${el.id}-${i}`} position={[mx, my, -0.02]} rotation={[0, 0, angle]}><mesh><boxGeometry args={[len + 0.035, 0.035, 0.02]} /><meshBasicMaterial color="#1c1c1e" /></mesh><mesh position={[0, 0, -0.015]}><boxGeometry args={[len, 0.02, 0.01]} /><meshBasicMaterial color="#ffffff" /><pointLight distance={1.5} intensity={0.2} color="#ffffff" /></mesh></group> )
              });
          }
          return null;
      })}
    </group>
  );
};
const ThreeDPreview = ({ roomPts, elements }) => (
    <div style={{ width: '100%', height: '320px', borderRadius: '16px', overflow: 'hidden', background: '#000', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 1.5, 5], fov: 60 }}><ambientLight intensity={0.4} /><directionalLight position={[5, 10, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} /><CeilingGeometry3D roomPts={roomPts} elements={elements} /><OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={1} maxDistance={10} target={[0, 1.35, 0]} /><Environment preset="city" blur={0.5} /><Grid position={[0, 0.01, 0]} args={[10, 10]} cellColor="#38383A" sectionColor="#8E8E93" fadeDistance={20} /></Canvas>
    </div>
);

// --- Темы и UI ---
const getTheme = (mode) => ({
    isDark: mode === 'dark', bg: mode === 'dark' ? '#000000' : '#F5F5F7', card: mode === 'dark' ? '#1C1C1E' : '#FFFFFF', text: mode === 'dark' ? '#FFFFFF' : '#1C1C1E', subText: '#8E8E93', accent: '#0A84FF', danger: '#FF453A', warning: '#FF9F0A', success: '#32D74B', glass: mode === 'dark' ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)', border: mode === 'dark' ? '#38383A' : '#E5E5EA', inputBg: mode === 'dark' ? '#2C2C2E' : '#F9F9FB',
});
const triggerHaptic = (type = 'light') => { try { if (type === 'selection') window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); else window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type); } catch(e){} };

const SearchableSelect = ({ options, value, onChange, theme, placeholder, openUp = false }) => {
  const [isOpen, setIsOpen] = useState(false); const [search, setSearch] = useState(""); const t = getTheme(theme);
  const selected = options.find(o => o.id === value); const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '8px' }}>
      <div onClick={() => { triggerHaptic('selection'); setIsOpen(!isOpen); setSearch(""); }} style={{ background: t.inputBg, border: `1px solid ${t.border}`, padding: '14px 16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        {isOpen ? ( <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} onBlur={() => setTimeout(() => setIsOpen(false), 200)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '16px', color: t.text }} placeholder="Поиск..." /> ) : ( <span translate="no" className="notranslate" style={{ color: selected ? t.text : t.subText, fontSize: '16px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected ? selected.name : placeholder}</span> )}
        <span style={{ color: t.subText, fontSize: '12px' }}>{isOpen ? (openUp ? '▼' : '▲') : (openUp ? '▲' : '▼')}</span>
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', ...(openUp ? { bottom: '100%', marginBottom: '6px' } : { top: '100%', marginTop: '6px' }), left: 0, right: 0, zIndex: 1000, background: t.card, borderRadius: '14px', border: `1px solid ${t.border}`, boxShadow: '0 12px 24px rgba(0,0,0,0.2)', maxHeight: '250px', overflowY: 'auto' }}>
          {filtered.length > 0 ? filtered.map(o => ( <div key={o.id} onMouseDown={(e) => { e.preventDefault(); triggerHaptic('selection'); onChange(o.id); setIsOpen(false); }} style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, color: value === o.id ? t.accent : t.text, fontWeight: value === o.id ? 'bold' : '500', cursor: 'pointer', background: value === o.id ? (t.isDark ? '#2C2C2E' : '#F0F8FF') : 'transparent' }}> <span translate="no" className="notranslate">{o.name}</span> </div> )) : <div style={{ padding: '15px', color: t.subText, textAlign: 'center', fontSize: '14px' }}>Ничего не найдено</div>}
        </div>
      )}
    </div>
  );
};

// --- Холст ---
const RoomCanvas = ({ room, updateRoom, options, theme }) => {
  const canvasRef = useRef(null); const [scale, setScale] = useState(30); const [showDiags, setShowDiags] = useState(false); const [viewMode, setViewMode] = useState('2d'); const [mode, setMode] = useState('drag'); const [selectedDiagPt, setSelectedDiagPt] = useState(null); const [activeTrackPts, setActiveTrackPts] = useState([]); const [els, setEls] = useState(room.elements || []); const [draggingElement, setDraggingElement] = useState(null);
  const t = getTheme(theme); const CANVAS_WIDTH = 340, CANVAS_HEIGHT = 320; const offset = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }; 
  const [pts, setPts] = useState(room.logicalPts || centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }])); const [draggingIdx, setDraggingIdx] = useState(null);
  const toScreen = (p) => ({ x: p.x * scale + offset.x, y: p.y * scale + offset.y }); const toLogical = (p) => ({ x: (p.x - offset.x) / scale, y: (p.y - offset.y) / scale }); const allPossibleDiags = getAllPossibleDiags(pts.length);

  useEffect(() => { if (room.logicalPts) setPts(room.logicalPts); }, [room.logicalPts]); useEffect(() => { setEls(room.elements || []) }, [room.elements]); 

  const syncElementsToInputs = (newEls) => {
      setEls(newEls); updateRoom(room.id, 'elements', newEls);
      const spots = newEls.filter(e => e.type === 'spot').length; const chands = newEls.filter(e => e.type === 'chand').length; const pipes = newEls.filter(e => e.type === 'pipe').length; let trackLen = 0;
      newEls.filter(e => e.type === 'track').forEach(tr => { for(let i=1; i<tr.points.length; i++) { trackLen += Math.sqrt((tr.points[i].x - tr.points[i-1].x)**2 + (tr.points[i].y - tr.points[i-1].y)**2); } });
      updateRoom(room.id, 'spots', spots > 0 ? spots.toString() : ''); updateRoom(room.id, 'chands', chands > 0 ? chands.toString() : ''); updateRoom(room.id, 'pipe', pipes > 0 ? pipes.toString() : ''); updateRoom(room.id, 'track', trackLen > 0 ? trackLen.toFixed(1) : '');
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvasName = options.canvases.find(c => c.id === room.canvas)?.name || 'Полотно'; const screenPts = pts.map(toScreen); const manual = room.manualWalls || {}; const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = t.border; ctx.lineWidth = 1; const step = scale / 2; const startX = offset.x % step; const startY = offset.y % step;
    for(let i = startX; i < canvas.width; i += step) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i = startY; i < canvas.height; i += step) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(screenPts[0].x, screenPts[0].y); for(let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y); ctx.closePath();
    ctx.fillStyle = mode === 'add' ? (t.isDark ? 'rgba(50, 215, 75, 0.15)' : 'rgba(50, 215, 75, 0.1)') : (mode === 'remove' ? (t.isDark ? 'rgba(255, 69, 58, 0.15)' : 'rgba(255, 69, 58, 0.05)') : (t.isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(10, 132, 255, 0.08)')); 
    ctx.fill(); ctx.strokeStyle = mode === 'add' ? t.success : t.accent; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();

    if (showDiags && room.activeDiags) {
        ctx.setLineDash([5, 5]); ctx.strokeStyle = t.isDark ? 'rgba(255, 159, 10, 0.6)' : 'rgba(255, 149, 0, 0.6)'; ctx.lineWidth = 1.5; ctx.textAlign = 'center';
        room.activeDiags.forEach((diag) => {
            let i = diag.charCodeAt(0) - 65; let j = diag.charCodeAt(1) - 65; if (i >= pts.length || j >= pts.length || i < 0 || j < 0) return; let sp1 = screenPts[i], sp2 = screenPts[j]; ctx.beginPath(); ctx.moveTo(sp1.x, sp1.y); ctx.lineTo(sp2.x, sp2.y); ctx.stroke();
            let dist = Math.sqrt((pts[j].x - pts[i].x)**2 + (pts[j].y - pts[i].y)**2); let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2; let displayDist = manual[diag] !== undefined && manual[diag] !== '' ? manual[diag] : dist.toFixed(2);
            ctx.fillStyle = t.isDark ? '#2C2C2E' : 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(mx - 28, my - 10, 56, 18); ctx.fillStyle = t.warning; ctx.font = 'bold 11px system-ui'; ctx.fillText(`${diag}: ${displayDist}м`, mx, my + 3);
        }); ctx.setLineDash([]); 
    }

    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
    for(let i = 0; i < pts.length; i++) {
       let p1 = pts[i], p2 = pts[(i+1) % pts.length]; let dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2); let sp1 = screenPts[i], sp2 = screenPts[(i+1) % screenPts.length]; let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2; let name = String.fromCharCode(65+i) + String.fromCharCode(65+(i+1)%pts.length); let displayDist = manual[name] !== undefined && manual[name] !== '' ? manual[name] : dist.toFixed(2);
       ctx.fillStyle = t.isDark ? '#2C2C2E' : 'rgba(255,255,255,0.85)'; ctx.fillRect(mx - 32, my - 12, 64, 18); ctx.fillStyle = t.accent; ctx.fillText(`${name}: ${displayDist}м`, mx, my + 2);
    }

    els.forEach(el => {
        if (el.type === 'track') {
            ctx.beginPath(); ctx.moveTo(toScreen(el.points[0]).x, toScreen(el.points[0]).y); for(let i=1; i<el.points.length; i++) ctx.lineTo(toScreen(el.points[i]).x, toScreen(el.points[i]).y); ctx.strokeStyle = t.text; ctx.lineWidth = 4; ctx.stroke();
            for(let i=1; i<el.points.length; i++) { let dist = Math.sqrt((el.points[i].x - el.points[i-1].x)**2 + (el.points[i].y - el.points[i-1].y)**2).toFixed(2); let sp1 = toScreen(el.points[i-1]); let sp2 = toScreen(el.points[i]); let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2; ctx.fillStyle = t.isDark ? '#2C2C2E' : 'rgba(255,255,255,0.9)'; ctx.fillRect(mx - 15, my - 8, 30, 16); ctx.fillStyle = t.text; ctx.font = 'bold 10px system-ui'; ctx.fillText(`${dist}м`, mx, my + 3); }
            el.points.forEach((p, idx) => { let sp = toScreen(p); ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, 2*Math.PI); ctx.fillStyle = (draggingElement && draggingElement.elId === el.id && draggingElement.ptIdx === idx) ? t.danger : t.card; ctx.fill(); ctx.strokeStyle = t.text; ctx.lineWidth = 2; ctx.stroke(); });
        } else {
            let sp = toScreen({x: el.x, y: el.y}); ctx.beginPath(); ctx.arc(sp.x, sp.y, el.type === 'chand' ? 8 : 5, 0, 2*Math.PI); ctx.fillStyle = (draggingElement && draggingElement.elId === el.id) ? t.danger : (el.type === 'spot' ? '#FFD60A' : (el.type === 'chand' ? t.warning : t.subText)); ctx.fill(); ctx.strokeStyle = t.card; ctx.lineWidth = 2; ctx.stroke();
            if (el.type === 'pipe') { ctx.fillStyle=t.card; ctx.font='bold 8px system-ui'; ctx.fillText('T', sp.x, sp.y+3); }
        }
    });

    if (mode === 'track' && activeTrackPts.length > 0) {
        ctx.beginPath(); ctx.moveTo(toScreen(activeTrackPts[0]).x, toScreen(activeTrackPts[0]).y); for(let i=1; i<activeTrackPts.length; i++) ctx.lineTo(toScreen(activeTrackPts[i]).x, toScreen(activeTrackPts[i]).y); ctx.strokeStyle = t.warning; ctx.lineWidth = 4; ctx.stroke();
        for(let i=1; i<activeTrackPts.length; i++) { let dist = Math.sqrt((activeTrackPts[i].x - activeTrackPts[i-1].x)**2 + (activeTrackPts[i].y - activeTrackPts[i-1].y)**2).toFixed(2); let sp1 = toScreen(activeTrackPts[i-1]); let sp2 = toScreen(activeTrackPts[i]); let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2; ctx.fillStyle = t.isDark ? '#2C2C2E' : 'rgba(255,255,255,0.9)'; ctx.fillRect(mx - 15, my - 8, 30, 16); ctx.fillStyle = t.warning; ctx.font = 'bold 10px system-ui'; ctx.fillText(`${dist}м`, mx, my + 3); }
        activeTrackPts.forEach(p => { let sp = toScreen(p); ctx.beginPath(); ctx.arc(sp.x, sp.y, 5, 0, 2*Math.PI); ctx.fillStyle = t.warning; ctx.fill(); });
    }

    for(let i = 0; i < screenPts.length; i++) {
       let sp = screenPts[i]; ctx.beginPath(); ctx.arc(sp.x, sp.y, 10, 0, 2 * Math.PI);
       if (mode === 'remove') ctx.fillStyle = t.danger; else if (mode === 'add_diag' && selectedDiagPt === i) ctx.fillStyle = t.warning; else ctx.fillStyle = draggingIdx === i ? t.danger : t.card;
       ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = (mode === 'add_diag' && selectedDiagPt === i) ? t.warning : t.danger; ctx.stroke();
       const label = String.fromCharCode(65 + i); ctx.fillStyle = t.text; ctx.font = '900 16px system-ui'; ctx.fillText(label, sp.x + 18, sp.y - 12);
    }

    ctx.fillStyle = t.text; ctx.font = '900 16px system-ui'; ctx.textAlign = 'left'; ctx.fillText(`Монтаж: ${room.name}`, 10, 24); ctx.fillStyle = t.accent; ctx.font = 'bold 12px system-ui'; ctx.fillText(canvasName, 10, 42);

    const factCanvas = document.getElementById(`canvas-factory-${room.id}`);
    if (factCanvas) {
        const fCtx = factCanvas.getContext('2d'); fCtx.fillStyle = '#ffffff'; fCtx.fillRect(0, 0, factCanvas.width, factCanvas.height); fCtx.strokeStyle = '#e5e5ea'; fCtx.lineWidth = 1;
        for(let i = startX; i < factCanvas.width; i += step) { fCtx.beginPath(); fCtx.moveTo(i, 0); fCtx.lineTo(i, factCanvas.height); fCtx.stroke(); }
        for(let i = startY; i < factCanvas.height; i += step) { fCtx.beginPath(); fCtx.moveTo(0, i); fCtx.lineTo(factCanvas.width, i); fCtx.stroke(); }
        fCtx.beginPath(); fCtx.moveTo(screenPts[0].x, screenPts[0].y); for(let i = 1; i < screenPts.length; i++) fCtx.lineTo(screenPts[i].x, screenPts[i].y); fCtx.closePath();
        fCtx.fillStyle = 'rgba(0, 122, 255, 0.08)'; fCtx.fill(); fCtx.strokeStyle = '#007aff'; fCtx.lineWidth = 3; fCtx.lineJoin = 'round'; fCtx.stroke();
        if (showDiags && room.activeDiags) {
            fCtx.setLineDash([5, 5]); fCtx.strokeStyle = 'rgba(255, 149, 0, 0.6)'; fCtx.lineWidth = 1.5; fCtx.textAlign = 'center';
            room.activeDiags.forEach((diag) => { let i = diag.charCodeAt(0) - 65; let j = diag.charCodeAt(1) - 65; if (i >= pts.length || j >= pts.length || i < 0 || j < 0) return; let sp1 = screenPts[i], sp2 = screenPts[j]; fCtx.beginPath(); fCtx.moveTo(sp1.x, sp1.y); fCtx.lineTo(sp2.x, sp2.y); fCtx.stroke(); let dist = Math.sqrt((pts[j].x - pts[i].x)**2 + (pts[j].y - pts[i].y)**2); let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2; let displayDist = manual[diag] !== undefined && manual[diag] !== '' ? manual[diag] : dist.toFixed(2); fCtx.fillStyle = 'rgba(255, 255, 255, 0.9)'; fCtx.fillRect(mx - 28, my - 10, 56, 18); fCtx.fillStyle = '#ff9500'; fCtx.font = 'bold 11px system-ui'; fCtx.fillText(`${diag}: ${displayDist}м`, mx, my + 3); }); fCtx.setLineDash([]); 
        }
        fCtx.fillStyle = '#1c1c1e'; fCtx.font = 'bold 12px system-ui'; fCtx.textAlign = 'center';
        for(let i = 0; i < pts.length; i++) { let p1 = pts[i], p2 = pts[(i+1) % pts.length]; let dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2); let sp1 = screenPts[i], sp2 = screenPts[(i+1) % screenPts.length]; let mx = (sp1.x + sp2.x)/2, my = (sp1.y + sp2.y)/2; let name = String.fromCharCode(65+i) + String.fromCharCode(65+(i+1)%pts.length); let displayDist = manual[name] !== undefined && manual[name] !== '' ? manual[name] : dist.toFixed(2); fCtx.fillStyle = 'rgba(255,255,255,0.85)'; fCtx.fillRect(mx - 32, my - 12, 64, 18); fCtx.fillStyle = '#007aff'; fCtx.fillText(`${name}: ${displayDist}м`, mx, my + 2); }
        for(let i = 0; i < screenPts.length; i++) { let sp = screenPts[i]; fCtx.beginPath(); fCtx.arc(sp.x, sp.y, 10, 0, 2 * Math.PI); fCtx.fillStyle = '#ffffff'; fCtx.fill(); fCtx.lineWidth = 3; fCtx.strokeStyle = '#007aff'; fCtx.stroke(); const label = String.fromCharCode(65 + i); fCtx.fillStyle = '#1c1c1e'; fCtx.font = '900 16px system-ui'; fCtx.fillText(label, sp.x + 18, sp.y - 12); }
        fCtx.fillStyle = '#1c1c1e'; fCtx.font = '900 16px system-ui'; fCtx.textAlign = 'left'; fCtx.fillText(`Производство: ${room.name}`, 10, 24); fCtx.fillStyle = '#ff9500'; fCtx.font = 'bold 12px system-ui'; fCtx.fillText(canvasName, 10, 42);
    }
  }, [pts, draggingIdx, scale, showDiags, room.manualWalls, mode, room.activeDiags, selectedDiagPt, viewMode, els, activeTrackPts, draggingElement, room.canvas, room.name, options, theme]);

  const updateAreaPerimAndSave = (newPts, newDiags = null) => {
    let perim = 0, area = 0;
    for(let i = 0; i < newPts.length; i++) { let p1 = newPts[i], p2 = newPts[(i+1) % newPts.length]; perim += Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2); area += (p1.x * p2.y - p2.x * p1.y); }
    updateRoom(room.id, 'manualWalls', {}); updateRoom(room.id, 'area', Math.abs(area / 2).toFixed(2)); updateRoom(room.id, 'perim', perim.toFixed(2)); updateRoom(room.id, 'corners', newPts.length.toString()); updateRoom(room.id, 'logicalPts', newPts); 
    if (newDiags) updateRoom(room.id, 'activeDiags', newDiags);
  };

  const getMousePos = (e) => { const canvas = canvasRef.current; if(!canvas) return {x:0,y:0}; const rect = canvas.getBoundingClientRect(); const clientX = e.clientX || (e.touches && e.touches[0].clientX); const clientY = e.clientY || (e.touches && e.touches[0].clientY); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }; };

  const handlePointerDown = (e) => {
    if (viewMode !== '2d') return; 
    const pos = getMousePos(e); const screenPts = pts.map(toScreen); const logicalPos = toLogical(pos);
    if (mode === 'remove') {
        let hitFound = false; let newEls = [];
        for (let el of els) {
            if (hitFound) { newEls.push(el); continue; }
            if (el.type === 'track') {
                let segmentHitIdx = -1; for(let i=1; i<el.points.length; i++) { if(getDistToSegment(pos, toScreen(el.points[i-1]), toScreen(el.points[i])) < 15) { segmentHitIdx = i; break; } }
                if (segmentHitIdx !== -1) { hitFound = true; let part1 = el.points.slice(0, segmentHitIdx); let part2 = el.points.slice(segmentHitIdx); if (part1.length >= 2) newEls.push({ id: Date.now() + Math.random(), type: 'track', points: part1 }); if (part2.length >= 2) newEls.push({ id: Date.now() + Math.random(), type: 'track', points: part2 }); } else { newEls.push(el); }
            } else { if (Math.sqrt((toScreen(el).x - pos.x)**2 + (toScreen(el).y - pos.y)**2) < 15) hitFound = true; else newEls.push(el); }
        }
        if (hitFound) { triggerHaptic('medium'); syncElementsToInputs(newEls); return; }
        const hitIndex = screenPts.findIndex(p => Math.sqrt((p.x - pos.x)**2 + (p.y - pos.y)**2) < 30);
        if (hitIndex !== -1) { if (pts.length <= 3) return alert("Минимум 3 угла!"); triggerHaptic('heavy'); const newPts = pts.filter((_, idx) => idx !== hitIndex); updateAreaPerimAndSave(centerShape(newPts), getDefaultDiags(newPts.length)); setMode('drag'); }
        return;
    }
    if (['spot', 'chand', 'pipe'].includes(mode)) { triggerHaptic('light'); syncElementsToInputs([...els, { id: Date.now(), type: mode, x: logicalPos.x, y: logicalPos.y }]); return; }
    if (mode === 'track') { triggerHaptic('light'); setActiveTrackPts([...activeTrackPts, logicalPos]); return; }
    if (mode === 'add_diag') {
        const hitIndex = screenPts.findIndex(p => Math.sqrt((p.x - pos.x)**2 + (p.y - pos.y)**2) < 30);
        if (hitIndex !== -1) {
            triggerHaptic('medium');
            if (selectedDiagPt === null) setSelectedDiagPt(hitIndex);
            else {
                if (hitIndex === selectedDiagPt) { setSelectedDiagPt(null); return; }
                const diff = Math.abs(hitIndex - selectedDiagPt); if (diff === 1 || diff === pts.length - 1) { alert("Это стена! Выберите противоположный угол."); return; }
                let i = Math.min(selectedDiagPt, hitIndex); let j = Math.max(selectedDiagPt, hitIndex); let diagName = String.fromCharCode(65+i) + String.fromCharCode(65+j); const newDiags = [...room.activeDiags];
                if (!newDiags.includes(diagName)) { newDiags.push(diagName); updateRoom(room.id, 'activeDiags', newDiags); }
                setSelectedDiagPt(null); setMode('drag'); 
            }
        }
        return;
    }
    if (mode === 'add') {
        if (pts.length >= 26) return alert("Достигнут предел углов (Z)");
        let minDist = Infinity; let insertIdx = -1;
        for(let i=0; i<pts.length; i++) { let dist = getDistToSegment(logicalPos, pts[i], pts[(i+1)%pts.length]); if (dist < minDist) { minDist = dist; insertIdx = i; } }
        triggerHaptic('medium'); const newPts = [...pts]; newPts.splice(insertIdx + 1, 0, logicalPos); updateAreaPerimAndSave(centerShape(newPts), getDefaultDiags(newPts.length)); setMode('drag'); return;
    }
    if (mode === 'drag') {
        const hitCornerIdx = screenPts.findIndex(p => Math.sqrt((p.x - pos.x)**2 + (p.y - pos.y)**2) < 25); 
        if (hitCornerIdx !== -1) { triggerHaptic('selection'); setDraggingIdx(hitCornerIdx); e.target.setPointerCapture(e.pointerId); return; }
        for (let el of els) {
            if (el.type === 'track') { for(let i=0; i<el.points.length; i++) { let sp = toScreen(el.points[i]); if (Math.sqrt((sp.x - pos.x)**2 + (sp.y - pos.y)**2) < 25) { triggerHaptic('selection'); setDraggingElement({ elId: el.id, ptIdx: i }); e.target.setPointerCapture(e.pointerId); return; } } } 
            else { let sp = toScreen(el); if (Math.sqrt((sp.x - pos.x)**2 + (sp.y - pos.y)**2) < 25) { triggerHaptic('selection'); setDraggingElement({ elId: el.id, ptIdx: null }); e.target.setPointerCapture(e.pointerId); return; } }
        }
    }
  };

  const handlePointerMove = (e) => {
    if (mode !== 'drag') return;
    const pos = getMousePos(e); const logicalPos = toLogical(pos);
    if (draggingElement) {
        const newEls = els.map(el => {
            if (el.id === draggingElement.elId) { if (el.type === 'track') { let newPts = [...el.points]; newPts[draggingElement.ptIdx] = logicalPos; return { ...el, points: newPts }; } else return { ...el, x: logicalPos.x, y: logicalPos.y }; }
            return el;
        });
        setEls(newEls); return;
    }
    if (draggingIdx !== null) { const newPts = [...pts]; newPts[draggingIdx] = logicalPos; setPts(newPts); }
  };

  const handlePointerUp = (e) => { e.target.releasePointerCapture(e.pointerId); if (draggingElement) { setDraggingElement(null); syncElementsToInputs(els); return; } if (draggingIdx !== null) { setDraggingIdx(null); updateAreaPerimAndSave(centerShape(pts)); } };

  const handleModeSwitch = (newMode) => { triggerHaptic('light'); setMode(mode === newMode ? 'drag' : newMode); setSelectedDiagPt(null); setActiveTrackPts([]); setDraggingElement(null); };

  const getHelperText = () => {
      if (viewMode === '3d') return '👀 3D Режим. Стены: 2.7м. Можно крутить пальцем.';
      if (mode === 'add') return '👆 Кликните на линию стены для создания угла'; if (mode === 'remove') return '👆 Кликните на объект (угол, точку, трек), чтобы удалить';
      if (mode === 'add_diag') return selectedDiagPt === null ? '👆 Выберите первый угол для диагонали' : '👆 Кликните на противоположный угол';
      if (mode === 'spot') return '👆 Кликайте по чертежу, чтобы расставить Точечные'; if (mode === 'chand') return '👆 Кликните, чтобы повесить Люстру';
      if (mode === 'pipe') return '👆 Кликните у стены, чтобы отметить Обход трубы'; if (mode === 'track') return activeTrackPts.length === 0 ? '👆 Кликните на чертеж, чтобы начать рисовать трек' : '👆 Кликайте дальше. Чтобы завершить, нажмите ✅';
      return '👆 Выберите инструмент';
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center', marginBottom: '15px' }}>
      <div style={{ height: '24px', marginBottom: '4px', fontWeight: '800', fontSize: '13px', color: viewMode === '3d' ? t.danger : (['add', 'spot', 'chand', 'track', 'pipe'].includes(mode) ? t.success : (mode === 'remove' ? t.danger : t.subText)) }}>{getHelperText()}</div>
      
      {viewMode === '2d' && (
          <div style={{ background: t.card, borderRadius: '16px', padding: '12px', marginBottom: '12px', border: `1px solid ${t.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <button onClick={() => { triggerHaptic('light'); setShowDiags(!showDiags) }} style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, fontSize: '13px', color: t.text, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>{showDiags ? '👁' : '👓'}</span>{showDiags ? 'Скрыть диагонали' : 'Показать диагонали'}
                  </button>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button onClick={() => { triggerHaptic('light'); setScale(s => Math.max(s - 5, 5)) }} style={{ width: '34px', height: '34px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, fontSize: '20px', color: t.accent, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                      <button onClick={() => { triggerHaptic('light'); setScale(s => Math.min(s + 5, 80)) }} style={{ width: '34px', height: '34px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.inputBg, fontSize: '20px', color: t.accent, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={() => handleModeSwitch('add')} style={{ flex: 1, padding: '10px 4px', background: mode === 'add' ? t.success : t.inputBg, color: mode === 'add' ? '#fff' : t.accent, borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '12px', transition: '0.2s' }}>{mode === 'add' ? 'Отмена' : '➕ Угол'}</button>
                    <button onClick={() => handleModeSwitch('remove')} style={{ flex: 1, padding: '10px 4px', background: mode === 'remove' ? t.danger : t.inputBg, color: mode === 'remove' ? '#fff' : t.danger, borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '12px', transition: '0.2s' }}>{mode === 'remove' ? 'Отмена' : '➖ Ластик'}</button>
                    <button onClick={() => handleModeSwitch('add_diag')} style={{ flex: 1, padding: '10px 4px', background: mode === 'add_diag' ? t.warning : t.inputBg, color: mode === 'add_diag' ? '#fff' : t.warning, borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '12px', transition: '0.2s' }}>{mode === 'add_diag' ? 'Отмена' : '📏 Диагональ'}</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={() => handleModeSwitch('spot')} style={{ flex: 1, padding: '10px 2px', background: mode === 'spot' ? '#FFD60A' : t.inputBg, color: mode === 'spot' ? '#1C1C1E' : t.text, borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '12px', transition: '0.2s' }}>💡 Точка</button>
                    <button onClick={() => handleModeSwitch('chand')} style={{ flex: 1, padding: '10px 2px', background: mode === 'chand' ? t.warning : t.inputBg, color: mode === 'chand' ? '#fff' : t.text, borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '12px', transition: '0.2s' }}>🏮 Люстра</button>
                    <button onClick={() => handleModeSwitch('track')} style={{ flex: 1, padding: '10px 2px', background: mode === 'track' ? t.text : t.inputBg, color: mode === 'track' ? t.bg : t.text, borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '12px', transition: '0.2s' }}>➖ Трек</button>
                    <button onClick={() => handleModeSwitch('pipe')} style={{ flex: 1, padding: '10px 2px', background: mode === 'pipe' ? t.subText : t.inputBg, color: mode === 'pipe' ? '#fff' : t.text, borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '12px', transition: '0.2s' }}>🔲 Труба</button>
                  </div>
              </div>
          </div>
      )}

      <div style={{position: 'relative'}}>
        <canvas id={`canvas-${room.id}`} ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: viewMode === '2d' ? 'block' : 'none', width: '100%', maxWidth: '400px', height: 'auto', background: t.isDark ? '#1C1C1E' : '#FAFAFA', borderRadius: '16px', border: ['add', 'spot', 'chand', 'track', 'pipe'].includes(mode) ? `2px solid ${t.success}` : (mode === 'remove' ? `2px solid ${t.danger}` : `1px solid ${t.border}`), touchAction: 'none', cursor: 'default' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
        <canvas id={`canvas-factory-${room.id}`} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'none' }} />
        {viewMode === '3d' && <ThreeDPreview roomPts={pts} elements={room.elements} />}
        {mode === 'track' && activeTrackPts.length > 0 && viewMode === '2d' && (
            <button onClick={() => { triggerHaptic('heavy'); if(activeTrackPts.length > 1) { const newEls = [...els, { id: Date.now(), type: 'track', points: activeTrackPts }]; syncElementsToInputs(newEls); } setActiveTrackPts([]); setMode('drag'); }} style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 20px', background: t.success, color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '15px', boxShadow: `0 4px 12px ${t.isDark ? 'rgba(50,215,75,0.2)' : 'rgba(52, 199, 89, 0.4)'}`, zIndex: 10 }}>✅ Завершить фигуру</button>
        )}
        <button onClick={() => { triggerHaptic('light'); setViewMode(viewMode === '2d' ? '3d' : '2d') }} style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '8px 12px', borderRadius: '20px', background: viewMode === '2d' ? t.danger : t.subText, color: 'white', border: 'none', fontWeight: '900', fontSize: '13px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 10, transition: '0.3s' }}>{viewMode === '2d' ? '👀 3D' : '🔙 2D Чертеж'}</button>
      </div>
      
      <div style={{ background: t.inputBg, padding: '16px', borderRadius: '16px', marginTop: '16px', border: `1px solid ${t.border}`, textAlign: 'left' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: t.subText, display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>📐 СТЕНЫ (м):</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {room.logicalPts?.map((p, i) => {
                let nextI = (i+1)%room.logicalPts.length; let name = String.fromCharCode(65+i) + String.fromCharCode(65+nextI); let dist = Math.sqrt((room.logicalPts[nextI].x - p.x)**2 + (room.logicalPts[nextI].y - p.y)**2).toFixed(2); let displayVal = room.manualWalls?.[name] !== undefined ? room.manualWalls[name] : dist;
                return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', background: t.card, padding: '8px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span translate="no" className="notranslate" style={{ fontSize: '13px', fontWeight: '800', marginRight: '8px', color: t.accent }}>{name}:</span>
                    <input type="number" value={displayVal} onChange={(e) => updateRoom(room.id, 'manualWalls', {...(room.manualWalls || {}), [name]: cleanNum(e.target.value)})} style={{ width: '55px', border: 'none', background: 'transparent', outline: 'none', fontWeight: 'bold', fontSize: '15px', color: t.text }}/>
                </div>
                )
            })}
        </div>
        <span style={{ fontSize: '11px', fontWeight: '800', color: t.subText, display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>📏 АКТИВНЫЕ ДИАГОНАЛИ (м):</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {room.activeDiags?.map((diagName, index) => {
                let i = diagName.charCodeAt(0) - 65; let j = diagName.charCodeAt(1) - 65; if(i >= room.logicalPts.length || j >= room.logicalPts.length) return null; let p1 = room.logicalPts[i], p2 = room.logicalPts[j]; let dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2).toFixed(2); let displayVal = room.manualWalls?.[diagName] !== undefined ? room.manualWalls[diagName] : dist;
                return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', background: t.card, padding: '6px 8px', borderRadius: '10px', border: `1px solid ${t.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <select translate="no" className="notranslate" value={diagName} onChange={(e) => { const newD = [...room.activeDiags]; newD[index] = e.target.value; updateRoom(room.id, 'activeDiags', newD); }} style={{ border: 'none', outline: 'none', fontWeight: '800', color: t.warning, background: 'transparent', fontSize: '14px', marginRight: '4px' }}>{allPossibleDiags.map(d => <option translate="no" className="notranslate" key={d} value={d}>{d}</option>)}</select>
                    <span style={{fontWeight: '800', color: t.warning, marginRight: '4px'}}>:</span>
                    <input type="number" value={displayVal} onChange={(e) => updateRoom(room.id, 'manualWalls', {...(room.manualWalls || {}), [diagName]: cleanNum(e.target.value)})} style={{ width: '50px', border: 'none', background: 'transparent', outline: 'none', fontWeight: 'bold', fontSize: '15px', color: t.text }}/>
                    <button onClick={() => { triggerHaptic('heavy'); const newD = room.activeDiags.filter((_, i) => i !== index); updateRoom(room.id, 'activeDiags', newD); }} style={{ background: 'none', border: 'none', color: t.danger, marginLeft: '5px', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
                </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

// --- ЗАГЛУШКИ ДЛЯ ЭКРАНОВ ---
const DashboardScreen = ({ t, ts }) => (
    <div style={{ padding: '20px', textAlign: 'center', color: ts.text }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>{t('dash')}</h2>
        <div style={{ background: ts.card, border: `1px solid ${ts.border}`, padding: '40px 20px', borderRadius: '20px' }}><span style={{ fontSize: '50px' }}>💸</span><h3 style={{ marginTop: '16px' }}>Здесь будет баланс и горящие клиенты</h3><p style={{ color: ts.subText, marginTop: '8px' }}>Экран в разработке...</p></div>
    </div>
);
const ArchiveScreen = ({ t, ts }) => (
    <div style={{ padding: '20px', textAlign: 'center', color: ts.text }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>{t('archive')}</h2>
        <div style={{ background: ts.card, border: `1px solid ${ts.border}`, padding: '40px 20px', borderRadius: '20px' }}><span style={{ fontSize: '50px' }}>🗂</span><h3 style={{ marginTop: '16px' }}>Здесь будет история замеров</h3><p style={{ color: ts.subText, marginTop: '8px' }}>Экран в разработке...</p></div>
    </div>
);

// ⭐️ ЭКРАН НАСТРОЕК (ПРАЙС-ЛИСТ СО СТРЕЛОЧКАМИ СОРТИРОВКИ) ⭐️
const SettingsScreen = ({ t, ts, priceData, setPriceData, userId }) => {
    const [expandedCat, setExpandedCat] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    const toggleCat = (id) => { triggerHaptic('light'); setExpandedCat(expandedCat === id ? null : id); };
    const updateCatName = (id, newName) => { setPriceData(priceData.map(c => c.id === id ? { ...c, name: newName } : c)); };
    const removeCat = (e, id) => { e.stopPropagation(); triggerHaptic('heavy'); if(window.confirm(t('deleteConfirm'))) setPriceData(priceData.filter(c => c.id !== id)); };
    const addCat = () => { triggerHaptic('medium'); const newCat = { id: 'cat_' + Date.now(), name: t('newCategory'), isBase: false, items: [] }; setPriceData([...priceData, newCat]); setExpandedCat(newCat.id); };
    const updateItem = (catId, itemId, field, value) => { setPriceData(priceData.map(c => c.id === catId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) } : c)); };
    const removeItem = (catId, itemId) => { triggerHaptic('medium'); setPriceData(priceData.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c)); };
    const addItem = (catId) => { triggerHaptic('light'); setPriceData(priceData.map(c => c.id === catId ? { ...c, items: [...c.items, { id: 'item_' + Date.now(), name: t('newItem'), price: 0 }] } : c)); };
    
    // ⭐️ ЛОГИКА ОТПРАВКИ ПРАЙСА В ПИТОН ⭐️
    const handleSave = async () => { 
        triggerHaptic('heavy'); 
        setIsSaved(true); 
        
        try {
            await fetch('https://potolokpro777bot.website/api/prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, priceData })
            });
        } catch(e) {
            console.error("Ошибка сохранения прайса:", e);
        }

        setTimeout(() => setIsSaved(false), 2000); 
    };

    const moveCat = (e, idx, dir) => {
        e.stopPropagation(); triggerHaptic('light');
        const newData = [...priceData];
        if (dir === 'up' && idx > 0) { [newData[idx - 1], newData[idx]] = [newData[idx], newData[idx - 1]]; }
        if (dir === 'down' && idx < newData.length - 1) { [newData[idx + 1], newData[idx]] = [newData[idx], newData[idx + 1]]; }
        setPriceData(newData);
    };

    const moveItem = (catId, idx, dir) => {
        triggerHaptic('light');
        setPriceData(priceData.map(c => {
            if (c.id !== catId) return c;
            const nI = [...c.items];
            if (dir === 'up' && idx > 0) { [nI[idx - 1], nI[idx]] = [nI[idx], nI[idx - 1]]; }
            if (dir === 'down' && idx < nI.length - 1) { [nI[idx + 1], nI[idx]] = [nI[idx], nI[idx + 1]]; }
            return { ...c, items: nI };
        }));
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-in', paddingBottom: '30px' }}>
            <h2 style={{ fontSize: '28px', margin: '0 8px 20px', fontWeight: '900', color: ts.text }}>{t('settings')}</h2>
            {priceData.map((cat, catIndex) => (
                <div key={cat.id} style={{ background: ts.card, borderRadius: '20px', marginBottom: '16px', border: `1px solid ${ts.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <div onClick={() => toggleCat(cat.id)} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandedCat === cat.id ? ts.inputBg : ts.card }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <span style={{ color: ts.accent, fontSize: '18px' }}>{expandedCat === cat.id ? '▼' : '▶'}</span>
                            <input type="text" value={cat.name} onChange={e => updateCatName(cat.id, e.target.value)} onClick={e => e.stopPropagation()} style={{ fontWeight: '800', border: 'none', outline: 'none', fontSize: '16px', width: '100%', background: 'transparent', color: ts.text }} />
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button disabled={catIndex === 0} onClick={(e) => moveCat(e, catIndex, 'up')} style={{ opacity: catIndex === 0 ? 0.2 : 1, background: 'none', border: 'none', color: ts.text, fontSize: '18px', padding: '4px' }}>▲</button>
                            <button disabled={catIndex === priceData.length - 1} onClick={(e) => moveCat(e, catIndex, 'down')} style={{ opacity: catIndex === priceData.length - 1 ? 0.2 : 1, background: 'none', border: 'none', color: ts.text, fontSize: '18px', padding: '4px' }}>▼</button>
                            <button onClick={(e) => removeCat(e, cat.id)} style={{ background: 'none', border: 'none', color: ts.danger, fontSize: '20px', padding: '4px', marginLeft: '4px' }}>🗑</button>
                        </div>
                    </div>
                    {expandedCat === cat.id && (
                        <div style={{ padding: '16px 20px 24px', borderTop: `1px solid ${ts.border}` }}>
                            {cat.items.map((item, itemIndex) => (
                                <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                                    <input type="text" value={item.name} onChange={e => updateItem(cat.id, item.id, 'name', e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${ts.border}`, background: ts.inputBg, color: ts.text, fontSize: '14px', outline: 'none' }} placeholder={t('clientName')} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                      <input type="number" value={item.price} onChange={e => updateItem(cat.id, item.id, 'price', cleanNum(e.target.value))} style={{ width: '55px', padding: '10px', borderRadius: '10px', border: `1px solid ${ts.border}`, background: ts.inputBg, color: ts.text, fontSize: '14px', textAlign: 'center', outline: 'none', fontWeight: 'bold' }} />
                                      <span style={{ color: ts.subText, fontSize: '14px', fontWeight: '600', marginRight: '4px' }}>₴</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        {itemIndex > 0 ? <button onClick={() => moveItem(cat.id, itemIndex, 'up')} style={{ background: ts.card, border: `1px solid ${ts.border}`, borderRadius: '6px', color: ts.text, fontSize: '10px', padding: '4px 6px' }}>▲</button> : <div style={{width:'22px'}}></div>}
                                        {itemIndex < cat.items.length - 1 ? <button onClick={() => moveItem(cat.id, itemIndex, 'down')} style={{ background: ts.card, border: `1px solid ${ts.border}`, borderRadius: '6px', color: ts.text, fontSize: '10px', padding: '4px 6px' }}>▼</button> : <div style={{width:'22px'}}></div>}
                                        <button onClick={() => removeItem(cat.id, item.id)} style={{ background: 'none', border: 'none', color: ts.danger, fontSize: '20px', padding: '0 4px', marginLeft: '4px' }}>🗑</button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => addItem(cat.id)} style={{ width: '100%', padding: '12px', background: 'transparent', color: ts.accent, border: `2px dashed ${ts.accent}80`, borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>{t('addPosition')}</button>
                        </div>
                    )}
                </div>
            ))}
            <button onClick={addCat} style={{ width: '100%', padding: '16px', background: 'transparent', color: ts.text, border: `2px dashed ${ts.border}`, borderRadius: '16px', fontSize: '15px', fontWeight: '800', marginBottom: '20px' }}>{t('addCategory')}</button>
            <button onClick={handleSave} style={{ width: '100%', padding: '18px', background: isSaved ? ts.success : ts.accent, color: '#fff', border: 'none', borderRadius: '16px', fontSize: '17px', fontWeight: '800', transition: '0.3s', boxShadow: `0 8px 20px ${isSaved ? 'rgba(50,215,75,0.3)' : 'rgba(10,132,255,0.3)'}` }}>
                {isSaved ? t('priceSaved') : t('savePrice')}
            </button>
        </div>
    );
};

// ==========================================
// 🚀 ГЛАВНОЕ ПРИЛОЖЕНИЕ СО ВКЛАДКАМИ
// ==========================================
function App() {
  const [activeTab, setActiveTab] = useState('calc'); 
  const [lang, setLang] = useState('ru');
  const [userId, setUserId] = useState(null);
  const [isTelegram, setIsTelegram] = useState(true);
  const [theme, setTheme] = useState('light');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // ⭐️ ДИНАМИЧЕСКИЙ ПРАЙС-ЛИСТ (ИСТОЧНИК ПРАВДЫ) ⭐️
  const [priceData, setPriceData] = useState([
      { id: 'canvas', name: 'Полотна (за м²)', isBase: true, items: [ 
          {id: 'matte_32', name: 'Белый Матовый (до 3.2м)', price: 330}, 
          {id: 'matte_50', name: 'Белый Матовый (до 5.0м)', price: 380}, 
          {id: 'premium_32', name: 'MSD Premium (до 3.2м)', price: 350},
          {id: 'premium_50', name: 'MSD Premium (до 5.0м)', price: 410},
          {id: 'black_matte', name: 'Черный Матовый (3.2м)', price: 400}
      ] },
      { id: 'profile', name: 'Профили (за м.п.)', isBase: true, items: [ {id: 'профиль_м', name: 'Стандартный (ПВХ)', price: 60}, {id: 'профиль_теневой_6мм_мп', name: 'Теневой (6 мм)', price: 350}, {id: 'профиль_парящий_мп', name: 'Парящий', price: 500} ] },
      { id: 'cornices', name: 'Карнизы (за м.п.)', isBase: true, items: [ {id: 'none', name: 'Нет', price: 0}, {id: 'карниз_м', name: 'Стандартный скрытый', price: 1200}, {id: 'карниз_q5_мп', name: 'Карниз Q5', price: 1500}, {id: 'карниз_q10_мп', name: 'Карниз Q10', price: 2200} ] },
      { id: 'dops', name: 'Монтаж и Допы', isBase: true, items: [ {id: 'light', name: 'Точечные светильники (шт)', price: 250}, {id: 'chand', name: 'Люстры (шт)', price: 300}, {id: 'corner', name: 'Доп. углы (шт)', price: 50}, {id: 'pipe', name: 'Обход труб (шт)', price: 200}, {id: 'track', name: 'Треки / Свет. линии (м.п.)', price: 2000} ] }
  ]);

  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [isContactExpanded, setIsContactExpanded] = useState(true);

  const [rooms, setRooms] = useState([
    { id: Date.now(), name: 'Помещение 1', area: '16.00', perim: '16.00', corners: '4', canvas: 'matte_32', profile: 'профиль_м', spots: '', chands: '', track: '', corniceType: 'none', cornice: '', pipe: '', logicalPts: centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]), activeDiags: ['AC', 'BD'], manualWalls: {}, elements: [] }
  ]);
  const [expandedRoomId, setExpandedRoomId] = useState(rooms[0].id);
  const [expandedSubSec, setExpandedSubSec] = useState('geom');

  // ⭐️ ЛОГИКА ЗАГРУЗКИ ПРАЙСА ИЗ ПИТОНА ПРИ СТАРТЕ ⭐️
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready(); tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) { 
          setUserId(user.id); 
          setLang(T[user.language_code] ? user.language_code : 'ru'); 

          // 🚀 СКАЧИВАЕМ ПРАЙС ИЗ БАЗЫ БОТА
          fetch(`https://potolokpro777bot.website/api/prices?userId=${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.priceData) {
                    setPriceData(data.priceData);
                }
            })
            .catch(err => console.error("Ошибка загрузки прайса:", err));
      }
      setTheme(tg.colorScheme === 'dark' ? 'dark' : 'light');
      tg.onEvent('themeChanged', () => setTheme(tg.colorScheme));
    } else { setIsTelegram(false); }

    const handleFocusIn = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') setIsKeyboardOpen(true); };
    const handleFocusOut = () => { setTimeout(() => { if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') setIsKeyboardOpen(false); }, 50); };
    window.addEventListener('focusin', handleFocusIn); window.addEventListener('focusout', handleFocusOut);
    return () => { window.removeEventListener('focusin', handleFocusIn); window.removeEventListener('focusout', handleFocusOut); };
  }, []);

  const updateRoom = (id, field, value) => { setRooms(prevRooms => prevRooms.map(r => r.id === id ? { ...r, [field]: value } : r)); };
  
  useEffect(() => {
      rooms.forEach(room => {
          const newPts = solveGeometry(room.logicalPts, room.manualWalls, room.activeDiags || []);
          let p_sum = 0, area = 0;
          for(let k=0; k<newPts.length; k++) { let p1 = newPts[k], p2 = newPts[(k+1)%newPts.length]; p_sum += Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2); area += (p1.x*p2.y - p2.x*p1.y); }
          if (Math.abs(p_sum - parseFloat(room.perim)) > 0.05) { updateRoom(room.id, 'logicalPts', newPts); updateRoom(room.id, 'perim', p_sum.toFixed(2)); updateRoom(room.id, 'area', Math.abs(area/2).toFixed(2)); }
      });
  }, [rooms.map(r => JSON.stringify(r.manualWalls)).join(','), rooms.map(r => JSON.stringify(r.activeDiags)).join(',')]);

  const triggerHaptic = (type = 'light') => { try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type); } catch(e){} };
  const ts = getTheme(theme);
  const t = (key) => T[lang]?.[key] || T['ru'][key];

  const options = {
    canvases: priceData.find(c => c.id === 'canvas')?.items || [],
    profiles: priceData.find(c => c.id === 'profile')?.items || [],
    cornices: priceData.find(c => c.id === 'cornices')?.items || []
  };

  const getDopPrice = (id) => parseFloat(priceData.find(c => c.id === 'dops')?.items.find(i => i.id === id)?.price) || 0;

  const prices = {
    canvas: Object.fromEntries((options.canvases).map(i => [i.id, parseFloat(i.price) || 0])),
    profile: Object.fromEntries((options.profiles).map(i => [i.id, parseFloat(i.price) || 0])),
    cornices: Object.fromEntries((options.cornices).map(i => [i.id, parseFloat(i.price) || 0])),
    light: getDopPrice('light'),
    chand: getDopPrice('chand'),
    corner: getDopPrice('corner'),
    pipe: getDopPrice('pipe'),
    track: getDopPrice('track'),
  };

  const addRoom = () => { triggerHaptic(); const nr = { id: Date.now(), name: `Помещение ${rooms.length+1}`, area: '16.00', perim: '16.00', corners: '4', canvas: options.canvases[0]?.id || '', profile: options.profiles[0]?.id || '', spots: '', chands: '', track: '', corniceType: 'none', cornice: '', pipe: '', logicalPts: centerShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]), activeDiags: ['AC', 'BD'], manualWalls: {}, elements: [] }; setRooms([...rooms, nr]); setExpandedRoomId(nr.id); setExpandedSubSec('geom'); setIsContactExpanded(false); };
  const removeRoom = (id, e) => { e.stopPropagation(); triggerHaptic('heavy'); if (rooms.length > 1) setRooms(rooms.filter(room => room.id !== id)); else alert("Должно остаться хотя бы одно помещение!"); };
  
  const sendToBot = async () => {
      triggerHaptic('heavy');
      const roomsWithImages = rooms.map(room => {
        const instCanvas = document.getElementById(`canvas-${room.id}`); const factCanvas = document.getElementById(`canvas-factory-${room.id}`); let installerBase64 = '', factoryBase64 = '';
        if (instCanvas) { const tmp1 = document.createElement('canvas'); tmp1.width = instCanvas.width; tmp1.height = instCanvas.height; const c1 = tmp1.getContext('2d'); c1.fillStyle = '#ffffff'; c1.fillRect(0, 0, tmp1.width, tmp1.height); c1.drawImage(instCanvas, 0, 0); installerBase64 = tmp1.toDataURL('image/png'); }
        if (factCanvas) factoryBase64 = factCanvas.toDataURL('image/png');
        return { ...room, image_installer: installerBase64, image_factory: factoryBase64 }; 
      });
      await fetch('https://potolokpro777bot.website/api/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, customer, rooms: roomsWithImages }) });
      window.Telegram?.WebApp?.close();
  };

  const localTotalSum = rooms.reduce((total, r) => total + ((Number(r.area) || 0) * (prices.canvas[r.canvas] || 0)) + ((Number(r.perim) || 0) * (prices.profile[r.profile] || 0)) + ((Number(r.spots) || 0) * prices.light) + ((Number(r.chands) || 0) * prices.chand) + ((Number(r.track) || 0) * prices.track) + ((Number(r.corners) || 0) * prices.corner) + ((Number(r.cornice) || 0) * (prices.cornices[r.corniceType] || 0)) + ((Number(r.pipe) || 0) * prices.pipe), 0);

  const styles = {
    appContainer: { width: '100%', maxWidth: '100%', margin: '0 auto', height: '100vh', backgroundColor: ts.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' },
    contentArea: { flex: 1, padding: '16px 12px', overflowY: 'auto', paddingBottom: isKeyboardOpen ? '20px' : '200px', boxSizing: 'border-box' }, 
    card: { background: ts.card, borderRadius: '20px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', width: '100%', position: 'relative', border: `1px solid ${ts.border}` },
    header: { padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
    subHeader: { padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderTop: `1px solid ${ts.border}` },
    subContent: { padding: '16px 20px 24px', background: ts.card, borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' },
    label: { fontSize: '11px', fontWeight: '800', color: ts.subText, letterSpacing: '0.5px', marginBottom: '8px', display: 'block', textTransform: 'uppercase' },
    inputRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: ts.text, fontWeight: '600' },
    numInput: { width: '90px', padding: '12px', borderRadius: '12px', border: `1px solid ${ts.border}`, textAlign: 'center', fontSize: '16px', fontWeight: '700', boxSizing: 'border-box', background: ts.inputBg, color: ts.text, outline: 'none' }
  };

  const TabBar = () => {
      const tabs = [ { id: 'dash', icon: '🏠', label: t('dash') }, { id: 'calc', icon: '📐', label: t('calc') }, { id: 'archive', icon: '🗂', label: t('archive') }, { id: 'settings', icon: '⚙️', label: t('settings') } ];
      return (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '85px', background: ts.glass, backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderTop: `1px solid ${ts.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: '15px', zIndex: 1000 }}>
              {tabs.map(tab => (
                  <div key={tab.id} onClick={() => { triggerHaptic('medium'); setActiveTab(tab.id); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '60px', opacity: activeTab === tab.id ? 1 : 0.5, transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)', transition: '0.2s ease' }}>
                      <span style={{ fontSize: '24px', marginBottom: '4px' }}>{tab.icon}</span><span style={{ fontSize: '10px', fontWeight: '700', color: ts.text }}>{tab.label}</span>
                  </div>
              ))}
          </div>
      );
  };

  if (!isTelegram) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', textAlign: 'center', background: '#f5f5f7' }}>
        <h2 style={{ color: '#ff3b30' }}>⚠️ Доступ запрещен</h2><p style={{ fontSize: '16px', color: '#8e8e93', marginTop: '10px', fontWeight: 'bold' }}>Это приложение работает только внутри Telegram.</p>
        <a href="https://t.me/PotolokPro777Bot" style={{ marginTop: '20px', padding: '12px 24px', background: '#007aff', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Перейти в Бота</a>
      </div>
    );
  }

  return (
      <div style={styles.appContainer}>
          <div style={styles.contentArea}>
              <div style={{ display: activeTab === 'dash' ? 'block' : 'none' }}><DashboardScreen t={t} ts={ts} /></div>

              <div style={{ display: activeTab === 'calc' ? 'block' : 'none', animation: 'fadeIn 0.3s ease-in', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px', padding: '0 8px', boxSizing: 'border-box' }}>
                      <h2 style={{ fontSize: '28px', margin: 0, fontWeight: '900', color: ts.text }}>{t('calc')}</h2>
                      <button onClick={() => { triggerHaptic(); setTheme(theme === 'light' ? 'dark' : 'light'); }} style={{ background: ts.card, border: `1px solid ${ts.border}`, width: '44px', height: '44px', borderRadius: '14px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>{theme === 'light' ? '🌙' : '☀️'}</button>
                  </div>

                  <div style={{ ...styles.card, border: `2px solid ${ts.accent}40` }}>
                    <div style={styles.header} onClick={() => { triggerHaptic(); setIsContactExpanded(!isContactExpanded); setExpandedRoomId(null); }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: ts.accent, fontSize: '18px' }}>{isContactExpanded ? '▼' : '▶'}</span>
                        <span style={{ fontWeight: '800', fontSize: '20px', color: ts.text }}>{t('contacts')}</span>
                      </div>
                    </div>
                    <div style={{ display: isContactExpanded ? 'block' : 'none', animation: 'slideDown 0.2s ease-out', padding: '0 20px 24px' }}>
                        <div style={{...styles.inputRow, marginBottom: '12px', marginTop: '10px'}}>
                          <span style={{color: ts.subText, fontSize: '14px', fontWeight: '700'}}>{t('clientName')}</span>
                          <input type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} style={{...styles.numInput, width: '65%', textAlign: 'left'}} placeholder="Иван Иванов" />
                        </div>
                        <div style={{...styles.inputRow, marginBottom: '12px'}}>
                          <span style={{color: ts.subText, fontSize: '14px', fontWeight: '700'}}>{t('clientPhone')}</span>
                          <input type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} style={{...styles.numInput, width: '65%', textAlign: 'left'}} placeholder="+380..." />
                        </div>
                        <div style={{...styles.inputRow, marginBottom: '0'}}>
                          <span style={{color: ts.subText, fontSize: '14px', fontWeight: '700'}}>{t('clientAddress')}</span>
                          <input type="text" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} style={{...styles.numInput, width: '65%', textAlign: 'left'}} placeholder="ул. Строителей, 1" />
                        </div>
                    </div>
                  </div>

                  {rooms.map(room => (
                    <div key={room.id} style={styles.card}>
                      <div style={styles.header} onClick={() => { triggerHaptic(); setExpandedRoomId(expandedRoomId === room.id ? null : room.id); setIsContactExpanded(false); }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: ts.accent, fontSize: '18px' }}>{expandedRoomId === room.id ? '▼' : '▶'}</span>
                          <input type="text" value={room.name} onChange={e => updateRoom(room.id, 'name', e.target.value)} onClick={e => e.stopPropagation()} style={{ fontWeight: '800', border: 'none', outline: 'none', fontSize: '20px', width: '180px', background: 'transparent', color: ts.text }} />
                        </div>
                        <button onClick={(e) => removeRoom(room.id, e)} style={{ background: 'none', border: 'none', color: ts.danger, fontSize: '22px', padding: '4px' }}>🗑</button>
                      </div>
                      <div style={{ display: expandedRoomId === room.id ? 'block' : 'none', animation: 'slideDown 0.2s ease-out' }}>
                          <div>
                            <div style={styles.subHeader} onClick={() => { triggerHaptic(); setExpandedSubSec(expandedSubSec === 'geom' ? null : 'geom')}}>
                              <span style={{ fontWeight: '700', fontSize: '16px', color: ts.text }}>{t('geom')}</span><span style={{ color: ts.subText, fontSize: '14px' }}>{expandedSubSec === 'geom' ? '▲' : '▼'}</span>
                            </div>
                            <div style={{ display: expandedSubSec === 'geom' ? 'block' : 'none', ...styles.subContent }}>
                                <RoomCanvas room={room} updateRoom={updateRoom} options={options} theme={theme} />
                                <div style={{...styles.inputRow, marginTop: '24px'}}><span>{t('area')}</span><input type="number" value={room.area} onChange={e => updateRoom(room.id, 'area', cleanNum(e.target.value))} style={styles.numInput} placeholder="0" /></div>
                                <div style={styles.inputRow}><span>{t('perim')}</span><input type="number" value={room.perim} onChange={e => updateRoom(room.id, 'perim', cleanNum(e.target.value))} style={styles.numInput} placeholder="0" /></div>
                                <div style={styles.inputRow}><span>{t('corners')}</span><input type="number" value={room.corners} readOnly style={{...styles.numInput, background: ts.border, color: ts.subText, border: 'none'}} placeholder="4" /></div>
                            </div>
                          </div>
                          <div>
                            <div style={styles.subHeader} onClick={() => { triggerHaptic(); setExpandedSubSec(expandedSubSec === 'mat' ? null : 'mat')}}>
                              <span style={{ fontWeight: '700', fontSize: '16px', color: ts.text }}>{t('materials')}</span><span style={{ color: ts.subText, fontSize: '14px' }}>{expandedSubSec === 'mat' ? '▲' : '▼'}</span>
                            </div>
                            <div style={{ display: expandedSubSec === 'mat' ? 'block' : 'none', ...styles.subContent }}>
                                <span style={styles.label}>{t('canvas')}</span><SearchableSelect options={options.canvases} value={room.canvas} onChange={(val) => updateRoom(room.id, 'canvas', val)} theme={theme} />
                                <div style={{ marginTop: '20px' }}><span style={styles.label}>{t('profile')}</span><SearchableSelect options={options.profiles} value={room.profile} onChange={(val) => updateRoom(room.id, 'profile', val)} theme={theme} /></div>
                            </div>
                          </div>
                          <div>
                            <div style={styles.subHeader} onClick={() => { triggerHaptic(); setExpandedSubSec(expandedSubSec === 'light' ? null : 'light')}}>
                              <span style={{ fontWeight: '700', fontSize: '16px', color: ts.text }}>{t('lighting')}</span><span style={{ color: ts.subText, fontSize: '14px' }}>{expandedSubSec === 'light' ? '▲' : '▼'}</span>
                            </div>
                            <div style={{ display: expandedSubSec === 'light' ? 'block' : 'none', ...styles.subContent }}>
                                <div style={styles.inputRow}><span>{t('spots')}</span><input type="number" value={room.spots} onChange={e => updateRoom(room.id, 'spots', cleanNum(e.target.value))} style={styles.numInput} placeholder="0" /></div>
                                <div style={styles.inputRow}><span>{t('chands')}</span><input type="number" value={room.chands} onChange={e => updateRoom(room.id, 'chands', cleanNum(e.target.value))} style={styles.numInput} placeholder="0" /></div>
                                <div style={styles.inputRow}><span>{t('track')}</span><input type="number" value={room.track} onChange={e => updateRoom(room.id, 'track', cleanNum(e.target.value))} style={styles.numInput} placeholder="0" /></div>
                            </div>
                          </div>
                          <div>
                            <div style={styles.subHeader} onClick={() => { triggerHaptic(); setExpandedSubSec(expandedSubSec === 'corniceSec' ? null : 'corniceSec')}}>
                              <span style={{ fontWeight: '700', fontSize: '16px', color: ts.text }}>{t('corniceSec')}</span><span style={{ color: ts.subText, fontSize: '14px' }}>{expandedSubSec === 'corniceSec' ? '▲' : '▼'}</span>
                            </div>
                            <div style={{ display: expandedSubSec === 'corniceSec' ? 'block' : 'none', ...styles.subContent }}>
                                <span style={styles.label}>{t('corniceType')}</span>
                                <SearchableSelect options={options.cornices} value={room.corniceType} onChange={(val) => updateRoom(room.id, 'corniceType', val)} theme={theme} openUp={true} />
                                {room.corniceType !== 'none' && ( <div style={{...styles.inputRow, marginTop: '20px'}}><span>{t('corniceLen')}</span><input type="number" value={room.cornice} onChange={e => updateRoom(room.id, 'cornice', cleanNum(e.target.value))} style={styles.numInput} placeholder="0" /></div> )}
                            </div>
                          </div>
                          <div>
                            <div style={styles.subHeader} onClick={() => { triggerHaptic(); setExpandedSubSec(expandedSubSec === 'dops' ? null : 'dops')}}>
                              <span style={{ fontWeight: '700', fontSize: '16px', color: ts.text }}>{t('dops')}</span><span style={{ color: ts.subText, fontSize: '14px' }}>{expandedSubSec === 'dops' ? '▲' : '▼'}</span>
                            </div>
                            <div style={{ display: expandedSubSec === 'dops' ? 'block' : 'none', ...styles.subContent }}>
                                <div style={styles.inputRow}><span>{t('pipe')}</span><input type="number" value={room.pipe} onChange={e => updateRoom(room.id, 'pipe', cleanNum(e.target.value))} style={styles.numInput} placeholder="0" /></div>
                            </div>
                          </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addRoom} style={{ width: '100%', padding: '18px', background: 'transparent', color: ts.accent, border: `2px dashed ${ts.accent}`, borderRadius: '16px', fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>➕ {t('addRoom')}</button>
              </div>

              <div style={{ display: activeTab === 'archive' ? 'block' : 'none' }}><ArchiveScreen t={t} ts={ts} /></div>
              
              <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
                  <SettingsScreen t={t} ts={ts} priceData={priceData} setPriceData={setPriceData} userId={userId} />
              </div>
          </div>
          
          {!isKeyboardOpen && activeTab === 'calc' && (
              <div style={{ position: 'fixed', bottom: '100px', left: '12px', right: '12px', background: ts.glass, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 20px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: `1px solid ${theme === 'dark' ? '#48484A' : '#FFFFFF'}`, zIndex: 100 }}>
                 <div>
                   <span style={{ color: ts.subText, fontSize: '12px', fontWeight: '800', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>{t('pre')}</span>
                   <span style={{ color: ts.text, fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>{localTotalSum.toLocaleString()} ₴</span>
                 </div>
                 <button onClick={sendToBot} style={{ background: `linear-gradient(135deg, ${ts.accent} 0%, #0056b3 100%)`, color: 'white', border: 'none', padding: '16px 32px', borderRadius: '16px', fontSize: '17px', fontWeight: '800', boxShadow: '0 8px 20px rgba(0,122,255,0.3)', cursor: 'pointer' }}>{t('toBot')}</button>
              </div>
          )}

          {!isKeyboardOpen && <TabBar />}
      </div>
  );
}
export default App;