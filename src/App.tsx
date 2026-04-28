import { useState, useEffect } from 'react'
import './App.css'

const T = {
  ru: { calc: "Расчет", addRoom: "Добавить помещение", toBot: "В бот 🚀", area: "Площадь (м²)", perim: "Периметр (м)", corners: "Углы (шт)", canvas: "ПОЛОТНО", profile: "ПРОФИЛЬ", dops: "ОСВЕЩЕНИЕ И ДОПЫ", spots: "Точечные (шт)", chands: "Люстры (шт)", track: "Магн. трек (м)", cornice: "Карниз (м)", pipe: "Трубы (шт)" }
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
      { id: 'matte_white', name: 'Белый Матовый (MSD)' },
      { id: 'msd_premium_320_м2', name: 'MSD Premium' },
      { id: 'black', name: 'Черный Матовый' }
    ],
    profiles: [
      { id: 'standard', name: 'Стандарт (ПВХ)' },
      { id: 'shadow', name: 'Теневой 6мм' },
      { id: 'floating', name: 'Парящий' }
    ]
  };

  const styles = {
    appContainer: { maxWidth: '480px', margin: '0 auto', height: '100vh', backgroundColor: '#f5f5f7', display: 'flex', flexDirection: 'column' },
    contentArea: { flex: 1, padding: '15px', overflowY: 'auto', paddingBottom: '140px' },
    card: { background: 'white', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
    header: { padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f2f2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    section: { padding: '12px 16px', borderBottom: '1px solid #f2f2f7' },
    label: { fontSize: '11px', fontWeight: '800', color: '#8e8e93', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' },
    select: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e5ea', fontSize: '15px', outline: 'none', background: '#f9f9fb' },
    inputRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    numInput: { width: '60px', padding: '8px', borderRadius: '8px', border: '1px solid #e5e5ea', textAlign: 'center', fontSize: '16px', fontWeight: '600' }
  };

  const CalculatorScreen = () => {
    const [rooms, setRooms] = useState([
      // Обрати внимание: теперь для каждой позиции свое поле
      { id: Date.now(), name: 'Зал', area: '18', perim: '16', corners: '4', canvas: 'matte_white', profile: 'standard', spots: '6', chands: '', track: '', cornice: '', pipe: '' }
    ]);
    const [expandedId, setExpandedId] = useState(rooms[0].id);

    const updateRoom = (id, field, value) => { setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r)); };
    const addRoom = () => {
      const nr = { id: Date.now(), name: `Помещение ${rooms.length+1}`, area: '', perim: '', corners: '4', canvas: 'matte_white', profile: 'standard', spots: '', chands: '', track: '', cornice: '', pipe: '' };
      setRooms([...rooms, nr]); setExpandedId(nr.id);
    };

    const sendToBot = async () => {
      await fetch('https://potolokpro777bot.website/api/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rooms })
      });
      window.Telegram?.WebApp?.close();
    };

    return (
      <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '15px' }}>{t('calc')}</h2>
        
        {rooms.map(room => (
          <div key={room.id} style={styles.card}>
            <div style={styles.header} onClick={() => setExpandedId(expandedId === room.id ? null : room.id)}>
              <input type="text" value={room.name} onChange={e => updateRoom(room.id, 'name', e.target.value)} onClick={e => e.stopPropagation()} style={{ fontWeight: '700', border: 'none', outline: 'none', fontSize: '16px', width: '60%' }} />
              <span style={{ color: '#007aff' }}>{expandedId === room.id ? '🔼' : '🔽'}</span>
            </div>

            {expandedId === room.id && (
              <div style={{ animation: 'slideDown 0.2s ease-out' }}>
                {/* ГЕОМЕТРИЯ */}
                <div style={styles.section}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}><span style={styles.label}>{t('area')}</span><input type="number" value={room.area} onChange={e => updateRoom(room.id, 'area', e.target.value)} style={{...styles.numInput, width: '100%', boxSizing: 'border-box'}} placeholder="0" /></div>
                    <div style={{ flex: 1 }}><span style={styles.label}>{t('perim')}</span><input type="number" value={room.perim} onChange={e => updateRoom(room.id, 'perim', e.target.value)} style={{...styles.numInput, width: '100%', boxSizing: 'border-box'}} placeholder="0" /></div>
                    <div style={{ flex: 1 }}><span style={styles.label}>{t('corners')}</span><input type="number" value={room.corners} onChange={e => updateRoom(room.id, 'corners', e.target.value)} style={{...styles.numInput, width: '100%', boxSizing: 'border-box'}} placeholder="4" /></div>
                  </div>
                </div>

                {/* МАТЕРИАЛЫ */}
                <div style={styles.section}>
                  <span style={styles.label}>{t('canvas')}</span>
                  <select style={styles.select} value={room.canvas} onChange={e => updateRoom(room.id, 'canvas', e.target.value)}>
                    {options.canvases.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  <div style={{ marginTop: '12px' }}>
                    <span style={styles.label}>{t('profile')}</span>
                    <select style={styles.select} value={room.profile} onChange={e => updateRoom(room.id, 'profile', e.target.value)}>
                      {options.profiles.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* ОСВЕЩЕНИЕ И ДОПЫ (Теперь это независимые поля!) */}
                <div style={styles.section}>
                  <span style={styles.label}>{t('dops')}</span>
                  <div style={styles.inputRow}><span>💡 {t('spots')}</span> <input type="number" value={room.spots} onChange={e => updateRoom(room.id, 'spots', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                  <div style={styles.inputRow}><span>🏮 {t('chands')}</span> <input type="number" value={room.chands} onChange={e => updateRoom(room.id, 'chands', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                  <div style={styles.inputRow}><span>🛤 {t('track')}</span> <input type="number" value={room.track} onChange={e => updateRoom(room.id, 'track', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                  <div style={styles.inputRow}><span>🏁 {t('cornice')}</span> <input type="number" value={room.cornice} onChange={e => updateRoom(room.id, 'cornice', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                  <div style={styles.inputRow}><span>🚰 {t('pipe')}</span> <input type="number" value={room.pipe} onChange={e => updateRoom(room.id, 'pipe', e.target.value)} style={styles.numInput} placeholder="0" /></div>
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={addRoom} style={{ width: '100%', padding: '15px', background: '#f2f2f7', color: '#007aff', border: 'none', borderRadius: '15px', fontWeight: '700', marginBottom: '20px' }}>
          ➕ {t('addRoom')}
        </button>

        <div style={{ position: 'fixed', bottom: '20px', left: '15px', right: '15px', background: '#1c1c1e', padding: '15px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }}>
           <span style={{ color: 'white', fontWeight: '700' }}>Готово?</span>
           <button onClick={sendToBot} style={{ background: '#007aff', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: '800' }}>{t('toBot')}</button>
        </div>
      </div>
    );
  };

  return <div style={styles.appContainer}><div style={styles.contentArea}><CalculatorScreen /></div></div>;
}
export default App;