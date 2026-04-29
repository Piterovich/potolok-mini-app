import { useState, useEffect } from 'react'
import './App.css'

const T = {
  ru: { calc: "Расчет", addRoom: "Добавить помещение", toBot: "В бот 🚀", area: "Площадь (м²)", perim: "Периметр (м)", corners: "Углы (шт)", geom: "📏 Геометрия", materials: "🎨 Полотно и Профиль", lighting: "💡 Освещение", corniceSec: "🏁 Карнизы", dops: "🔧 Доп. работы", spots: "Точечные (шт)", chands: "Люстры (шт)", track: "Магн. трек (м)", corniceType: "Вид карниза", corniceLen: "Метраж (м)", pipe: "Обход труб (шт)", canvas: "ПОЛОТНО", profile: "ПРОФИЛЬ", pre: "ПРЕДВАРИТЕЛЬНО:" },
  uk: { calc: "Розрахунок", addRoom: "Додати приміщення", toBot: "В бот 🚀", area: "Площа (м²)", perim: "Периметр (м)", corners: "Кути (шт)", geom: "📏 Геометрія", materials: "🎨 Полотно та Профіль", lighting: "💡 Освітлення", corniceSec: "🏁 Карнизи", dops: "🔧 Дод. роботи", spots: "Точкові (шт)", chands: "Люстри (шт)", track: "Магн. трек (м)", corniceType: "Вид карнизу", corniceLen: "Метраж (м)", pipe: "Обхід труб (шт)", canvas: "ПОЛОТНО", profile: "ПРОФІЛЬ", pre: "ПОПЕРЕДНЬО:" }
};

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

  // ⭐️ ИСПРАВЛЕНО: Растянули на всю ширину экрана (width: 100%, уменьшили padding)
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
    numInput: { width: '75px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e5ea', textAlign: 'center', fontSize: '16px', fontWeight: '600', boxSizing: 'border-box' }
  };

  const CalculatorScreen = () => {
    const [rooms, setRooms] = useState([
      { id: Date.now(), name: 'Помещение 1', area: '18', perim: '16', corners: '4', canvas: 'полотно_м2', profile: 'профиль_м', spots: '6', chands: '', track: '', corniceType: 'none', cornice: '', pipe: '' }
    ]);
    const [expandedRoomId, setExpandedRoomId] = useState(rooms[0].id);
    const [expandedSubSec, setExpandedSubSec] = useState('geom'); 

    const updateRoom = (id, field, value) => { setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r)); };
    const addRoom = () => {
      const nr = { id: Date.now(), name: `Помещение ${rooms.length+1}`, area: '', perim: '', corners: '4', canvas: 'полотно_м2', profile: 'профиль_м', spots: '', chands: '', track: '', corniceType: 'none', cornice: '', pipe: '' };
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
                
                {/* 1. ГЕОМЕТРИЯ */}
                <div>
                  <div style={styles.subHeader} onClick={() => setExpandedSubSec(expandedSubSec === 'geom' ? null : 'geom')}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t('geom')}</span>
                    <span style={{ color: '#8e8e93' }}>{expandedSubSec === 'geom' ? '🔼' : '🔽'}</span>
                  </div>
                  {expandedSubSec === 'geom' && (
                    <div style={styles.subContent}>
                      <div style={styles.inputRow}><span>{t('area')}</span><input type="number" value={room.area} onChange={e => updateRoom(room.id, 'area', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                      <div style={styles.inputRow}><span>{t('perim')}</span><input type="number" value={room.perim} onChange={e => updateRoom(room.id, 'perim', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                      <div style={styles.inputRow}><span>{t('corners')}</span><input type="number" value={room.corners} onChange={e => updateRoom(room.id, 'corners', e.target.value)} style={styles.numInput} placeholder="4" /></div>
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