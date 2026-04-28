import { useState, useEffect, useRef } from 'react'
import './App.css'

// --- СЛОВАРЬ ПЕРЕВОДОВ (Зеркало твоего бота) ---
const T = {
  ru: { calc: "Расчет", rooms: "Помещения", total: "ИТОГО", addRoom: "Добавить помещение", toBot: "В бот 🚀", area: "Площадь (м²)", perim: "Периметр (м)", corners: "Углы (шт)", canvas: "ПОЛОТНО", profile: "ПРОФИЛЬ", lights: "СВЕТ", cornice: "КАРНИЗ", dops: "ДОП. РАБОТЫ", qty: "Кол-во" },
  uk: { calc: "Розрахунок", rooms: "Приміщення", total: "ЗАГАЛОМ", addRoom: "Додати приміщення", toBot: "В бот 🚀", area: "Площа (м²)", perim: "Периметр (м)", corners: "Кути (шт)", canvas: "ПОЛОТНО", profile: "ПРОФІЛЬ", lights: "СВІТЛО", cornice: "КАРНИЗ", dops: "ДОД. РОБОТИ", qty: "Кіл-ть" },
  // Можно добавить остальные (en, es, pl, kk) по аналогии
};

function App() {
  const [activeTab, setActiveTab] = useState('calc')
  const [lang, setLang] = useState('ru'); // Язык по умолчанию
  const [userId, setUserId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id);
        // АВТО-ОПРЕДЕЛЕНИЕ ЯЗЫКА ИЗ ТЕЛЕГРАМА
        const userLang = user.language_code === 'uk' ? 'uk' : 'ru'; 
        setLang(userLang);
      }
    }
  }, []);

  const t = (key) => T[lang]?.[key] || T['ru'][key];

  // --- ДАННЫЕ ДЛЯ ВЫПАДАЮЩИХ СПИСКОВ (Из твоего прайса) ---
  const options = {
    canvases: [
      { id: 'matte_white', name: 'Белый Матовый (MSD)' },
      { id: 'msd_premium_320_м2', name: 'MSD Premium' },
      { id: 'msd_evolution_м2', name: 'MSD Evolution' },
      { id: 'black', name: 'Черный Матовый' }
    ],
    profiles: [
      { id: 'standard', name: 'Стандарт (ПВХ)' },
      { id: 'алюминиевый_стеновой_мп', name: 'Алюминий стеновой' },
      { id: 'shadow', name: 'Теневой 6мм' },
      { id: 'floating', name: 'Парящий' }
    ],
    cornices: [
      { id: 'none', name: 'Нет' },
      { id: 'карниз_q10_мп', name: 'Карниз Q10' },
      { id: 'карниз_q5_мп', name: 'Карниз Q5' },
      { id: 'ниша_пк5_с_гардиной_мп', name: 'Ниша ПК-5' }
    ],
    lights: [
      { id: 'светильник_шт', name: 'Точечный светильник' },
      { id: 'установка_люстры_шт', name: 'Люстра' },
      { id: 'магнитный_трек_мп', name: 'Магнитный трек' }
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
    inputGroup: { display: 'flex', gap: '10px', marginTop: '8px' },
    numInput: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e5e5ea', textAlign: 'center', fontSize: '16px', fontWeight: '600' }
  };

  const CalculatorScreen = () => {
    const [step, setStep] = useState('result');
    const [rooms, setRooms] = useState([
      { id: Date.now(), name: 'Зал', area: '18', perim: '16', corners: '4', canvas: 'matte_white', profile: 'standard', cornice: 'none', corniceQty: '', lightType: 'светильник_шт', lightQty: '6' }
    ]);
    const [expandedId, setExpandedId] = useState(rooms[0].id);

    const updateRoom = (id, field, value) => {
      setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const addRoom = () => {
      const nr = { id: Date.now(), name: `Помещение ${rooms.length+1}`, area: '', perim: '', corners: '4', canvas: 'matte_white', profile: 'standard', cornice: 'none', corniceQty: '', lightType: 'светильник_шт', lightQty: '' };
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
              <span style={{ fontWeight: '700' }}>{room.name}</span>
              <span style={{ color: '#007aff' }}>{expandedId === room.id ? '🔼' : '🔽'}</span>
            </div>

            {expandedId === room.id && (
              <div style={{ animation: 'slideDown 0.2s ease-out' }}>
                {/* ГЕОМЕТРИЯ */}
                <div style={styles.section}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={styles.label}>{t('area')}</span>
                      <input type="number" value={room.area} onChange={e => updateRoom(room.id, 'area', e.target.value)} style={styles.numInput} placeholder="0" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={styles.label}>{t('perim')}</span>
                      <input type="number" value={room.perim} onChange={e => updateRoom(room.id, 'perim', e.target.value)} style={styles.numInput} placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* ВЫБОР ПОЛОТНА И ПРОФИЛЯ */}
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

                {/* КАРНИЗЫ */}
                <div style={styles.section}>
                  <span style={styles.label}>{t('cornice')}</span>
                  <select style={styles.select} value={room.cornice} onChange={e => updateRoom(room.id, 'cornice', e.target.value)}>
                    {options.cornices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  {room.cornice !== 'none' && (
                    <div style={styles.inputGroup}>
                      <input type="number" value={room.corniceQty} onChange={e => updateRoom(room.id, 'corniceQty', e.target.value)} style={styles.numInput} placeholder={t('qty')} />
                    </div>
                  )}
                </div>

                {/* ОСВЕЩЕНИЕ */}
                <div style={styles.section}>
                  <span style={styles.label}>{t('lights')}</span>
                  <select style={styles.select} value={room.lightType} onChange={e => updateRoom(room.id, 'lightType', e.target.value)}>
                    {options.lights.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  <div style={styles.inputGroup}>
                    <input type="number" value={room.lightQty} onChange={e => updateRoom(room.id, 'lightQty', e.target.value)} style={styles.numInput} placeholder={t('qty')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={addRoom} style={{ width: '100%', padding: '15px', background: '#f2f2f7', color: '#007aff', border: 'none', borderRadius: '15px', fontWeight: '700', marginBottom: '20px' }}>
          {t('addRoom')}
        </button>

        <div style={{ position: 'fixed', bottom: '20px', left: '15px', right: '15px', background: '#1c1c1e', padding: '15px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }}>
           <span style={{ color: 'white', fontWeight: '700' }}>{t('total')}...</span>
           <button onClick={sendToBot} style={{ background: '#007aff', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: '800' }}>{t('toBot')}</button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.contentArea}><CalculatorScreen /></div>
    </div>
  );
}
export default App;