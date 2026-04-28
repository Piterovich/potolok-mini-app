import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('calc')
  const [userName, setUserName] = useState('Гость');

  // Подключаем магию Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const name = tg.initDataUnsafe?.user?.first_name;
      if (name) setUserName(name);
      else setUserName('Павел (Демо)');
    }
  }, []);

  // Базовые цены для мгновенного локального предпросмотра
  const [prices] = useState({
    canvas: { matte_white: 330, gloss_white: 350, black: 400 },
    profile: { standard: 60, shadow: 350, floating: 500 },
    light: 250, chand: 300, cornice: 1200, corner: 50
  });

  const styles = {
    appContainer: { maxWidth: '480px', margin: '0 auto', height: '100vh', backgroundColor: '#f5f5f7', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' },
    contentArea: { flex: 1, padding: '20px', overflowY: 'auto', paddingBottom: '120px' },
    bottomNav: { position: 'fixed', bottom: 0, width: '100%', maxWidth: '480px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', padding: '15px 0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', borderRadius: '20px 20px 0 0', zIndex: 100 },
    navButton: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
    navIcon: { fontSize: '24px', marginBottom: '4px' },
    card: { background: 'white', borderRadius: '16px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' },
    select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e5ea', fontSize: '15px', marginTop: '5px', background: '#fcfcfc' },
    inputGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    numInput: { width: '70px', padding: '8px', borderRadius: '8px', border: '1px solid #e5e5ea', fontSize: '16px', textAlign: 'center', fontWeight: 'bold' }
  }

  // --- ЭКРАН 1: ГЛАВНАЯ ---
  const DashboardScreen = () => (
    <div style={{ paddingBottom: '20px', animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div><h2 style={{ margin: 0, color: '#1c1c1e', fontSize: '24px' }}>Привет, {userName}! 👋</h2><p style={{ margin: '4px 0 0 0', color: '#8e8e93', fontSize: '14px' }}>👑 Статус: Безлимит</p></div>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #007aff 0%, #34c759 100%)', color: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 20px rgba(52, 199, 89, 0.25)', marginBottom: '25px' }}>
        <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px', fontWeight: '500' }}>Заработано (Август)</p>
        <h1 style={{ margin: 0, fontSize: '38px', fontWeight: '800' }}>185 400 ₴</h1>
      </div>
      <button onClick={() => setActiveTab('calc')} style={{ width: '100%', padding: '18px', background: '#1c1c1e', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '30px' }}>
        ➕ СОЗДАТЬ НОВЫЙ РАСЧЕТ
      </button>
    </div>
  );

  // --- ЭКРАН 2: КАЛЬКУЛЯТОР (МУЛЬТИ-КОМНАТНЫЙ) ---
  const CalculatorScreen = () => {
    // Состояние: Массив комнат (исправил нули на пустые строки по умолчанию для удобства)
    const [rooms, setRooms] = useState([
      { id: Date.now(), name: 'Помещение 1', area: '15', perimeter: '16', corners: '4', canvasType: 'matte_white', profileType: 'standard', lightsCount: '6', cornice: '0' }
    ]);
    
    const [expandedRoomId, setExpandedRoomId] = useState(rooms[0].id);

    const addRoom = () => {
      const newRoom = {
        id: Date.now(),
        name: `Помещение ${rooms.length + 1}`,
        area: '', perimeter: '', corners: '4', canvasType: 'matte_white', profileType: 'standard', lightsCount: '', cornice: ''
      };
      setRooms([...rooms, newRoom]);
      setExpandedRoomId(newRoom.id);
    };

    const updateRoom = (id, field, value) => {
      setRooms(rooms.map(room => room.id === id ? { ...room, [field]: value } : room));
    };

    const removeRoom = (id, e) => {
      e.stopPropagation();
      if (rooms.length > 1) {
        setRooms(rooms.filter(room => room.id !== id));
      } else {
        alert("Должно остаться хотя бы одно помещение!");
      }
    };

    // Считаем общую сумму, корректно обрабатывая пустые строки как нули
    const localTotalSum = rooms.reduce((total, room) => {
      return total + 
        ((Number(room.area) || 0) * prices.canvas[room.canvasType]) + 
        ((Number(room.perimeter) || 0) * prices.profile[room.profileType]) + 
        ((Number(room.lightsCount) || 0) * prices.light) + 
        ((Number(room.corners) || 0) * prices.corner) +
        ((Number(room.cornice) || 0) * prices.cornice);
    }, 0);

    return (
      <div style={{ paddingBottom: '80px', animation: 'fadeIn 0.3s ease-in' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#1c1c1e' }}>📝 Ручной расчет</h2>
        
        {rooms.map((room) => {
          const isExpanded = expandedRoomId === room.id;
          
          return (
            <div key={room.id} style={styles.card}>
              <div 
                onClick={() => setExpandedRoomId(isExpanded ? null : room.id)} 
                style={{ padding: '16px', background: isExpanded ? '#f0f4f8' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.3s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{isExpanded ? '🔽' : '▶️'}</span>
                  <input 
                    type="text" 
                    value={room.name} 
                    onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                    onClick={(e) => e.stopPropagation()} 
                    style={{ fontSize: '16px', fontWeight: 'bold', border: 'none', background: 'transparent', color: '#1c1c1e', outline: 'none', width: '150px' }}
                  />
                </div>
                <button onClick={(e) => removeRoom(room.id, e)} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '18px', cursor: 'pointer' }}>🗑</button>
              </div>

              {isExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid #e5e5ea', animation: 'fadeIn 0.2s ease-in' }}>
                  
                  <div style={styles.inputGroup}>
                    <span style={{ color: '#8e8e93', fontWeight: '500' }}>Площадь (м²)</span>
                    <input type="number" value={room.area} onChange={(e) => updateRoom(room.id, 'area', e.target.value)} style={styles.numInput} />
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <span style={{ color: '#8e8e93', fontWeight: '500' }}>Периметр (м)</span>
                    <input type="number" value={room.perimeter} onChange={(e) => updateRoom(room.id, 'perimeter', e.target.value)} style={styles.numInput} />
                  </div>

                  <div style={styles.inputGroup}>
                    <span style={{ color: '#8e8e93', fontWeight: '500' }}>Углы (шт)</span>
                    <input type="number" value={room.corners} onChange={(e) => updateRoom(room.id, 'corners', e.target.value)} style={styles.numInput} />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#8e8e93', fontSize: '12px', fontWeight: 'bold' }}>ПОЛОТНО</span>
                    <select style={styles.select} value={room.canvasType} onChange={(e) => updateRoom(room.id, 'canvasType', e.target.value)}>
                      <option value="matte_white">Белый Матовый (MSD Classic)</option>
                      <option value="gloss_white">Белый Глянец (MSD Premium)</option>
                      <option value="black">Черный Матовый</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#8e8e93', fontSize: '12px', fontWeight: 'bold' }}>ПРОФИЛЬ</span>
                    <select style={styles.select} value={room.profileType} onChange={(e) => updateRoom(room.id, 'profileType', e.target.value)}>
                      <option value="standard">Стандартный (ПВХ)</option>
                      <option value="shadow">Теневой (6 мм)</option>
                      <option value="floating">Парящий (с подсветкой)</option>
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <span style={{ color: '#8e8e93', fontWeight: '500' }}>Светильники (шт)</span>
                    <input type="number" value={room.lightsCount} onChange={(e) => updateRoom(room.id, 'lightsCount', e.target.value)} style={styles.numInput} />
                  </div>

                  <div style={styles.inputGroup}>
                    <span style={{ color: '#8e8e93', fontWeight: '500' }}>Скрытый карниз (м)</span>
                    <input type="number" value={room.cornice} onChange={(e) => updateRoom(room.id, 'cornice', e.target.value)} style={styles.numInput} />
                  </div>

                </div>
              )}
            </div>
          )
        })}

        <button onClick={addRoom} style={{ width: '100%', padding: '14px', background: '#e5e5ea', color: '#007aff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px' }}>
          ➕ Добавить помещение
        </button>

        <div style={{ position: 'fixed', bottom: '75px', width: '100%', maxWidth: '440px', background: 'rgba(255,255,255,0.95)', padding: '15px 20px', borderRadius: '20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', zIndex: 90 }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#8e8e93', fontWeight: 'bold' }}>ПРЕДВАРИТЕЛЬНО:</p>
            <h2 style={{ margin: 0, color: '#1c1c1e', fontSize: '24px' }}>{localTotalSum.toLocaleString()} ₴</h2>
          </div>
          <button style={{ background: '#007aff', color: 'white', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 10px rgba(0,122,255,0.3)' }}>
            В бот 🚀
          </button>
        </div>
      </div>
    );
  };

  // --- ОСТАЛЬНЫЕ ЭКРАНЫ ---
  const CrmScreen = () => (
    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <h2 style={{ margin: '0 0 15px 0', color: '#1c1c1e' }}>Мои проекты</h2>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Иван, ул. Киевская 10</h3>
          <span style={{ fontSize: '12px', color: '#8e8e93' }}>📅 Сегодня</span>
        </div>
      </div>
    </div>
  );
  
  const SettingsScreen = () => (<div style={styles.card}><h2 style={{padding: '16px'}}>Настройки</h2></div>);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <DashboardScreen />;
      case 'calc': return <CalculatorScreen />;
      case 'crm': return <CrmScreen />;
      case 'settings': return <SettingsScreen />;
      default: return <DashboardScreen />;
    }
  }

  const getNavStyle = (tabId) => ({ ...styles.navButton, color: activeTab === tabId ? '#007aff' : '#8e8e93' });
  
  return (
    <div style={styles.appContainer}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={styles.contentArea}>
        {renderScreen()}
      </div>
      <div style={styles.bottomNav}>
        <button style={getNavStyle('home')} onClick={() => setActiveTab('home')}><span style={styles.navIcon}>🏠</span>Главная</button>
        <button style={getNavStyle('calc')} onClick={() => setActiveTab('calc')}><span style={styles.navIcon}>📐</span>Расчет</button>
        <button style={getNavStyle('crm')} onClick={() => setActiveTab('crm')}><span style={styles.navIcon}>🗂</span>Проекты</button>
        <button style={getNavStyle('settings')} onClick={() => setActiveTab('settings')}><span style={styles.navIcon}>⚙️</span>Настройки</button>
      </div>
    </div>
  )
}

export default App