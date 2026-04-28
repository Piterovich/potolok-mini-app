import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('calc')
  const [userName, setUserName] = useState('Гость');
  const [userId, setUserId] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserName(user.first_name);
        setUserId(user.id);
      } else {
        setUserName('Павел (Демо)');
      }
    }
  }, []);

  // Добавили цены на трубы и световые линии для предпросмотра
  const [prices] = useState({
    canvas: { matte_white: 330, gloss_white: 350, black: 400 },
    profile: { standard: 60, shadow: 350, floating: 500 },
    light: 250, chand: 300, cornice: 1200, corner: 50,
    pipe: 200, lightLine: 1500
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

  const DashboardScreen = () => (
    <div style={{ paddingBottom: '20px', animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div><h2 style={{ margin: 0, color: '#1c1c1e', fontSize: '24px' }}>Привет, {userName}! 👋</h2><p style={{ margin: '4px 0 0 0', color: '#8e8e93', fontSize: '14px' }}>👑 Статус: Безлимит</p></div>
      </div>
      <button onClick={() => setActiveTab('calc')} style={{ width: '100%', padding: '18px', background: '#1c1c1e', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '30px' }}>
        ➕ СОЗДАТЬ НОВЫЙ РАСЧЕТ
      </button>
    </div>
  );

  const CalculatorScreen = () => {
    const [step, setStep] = useState('upload');
    
    // Добавили pipes и lightLines в модель комнаты
    const [rooms, setRooms] = useState([
      { id: Date.now(), name: 'Помещение 1', area: '', perimeter: '', corners: '4', canvasType: 'matte_white', profileType: 'standard', lightsCount: '', cornice: '', pipes: '', lightLines: '' }
    ]);
    const [expandedRoomId, setExpandedRoomId] = useState(rooms[0].id);

    const handleFileChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setStep('analyzing');

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const response = await fetch('https://potolokpro777bot.website/api/recognize', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (data.status === "success" && data.rooms && data.rooms.length > 0) {
          // Гарантируем, что новые поля не будут undefined
          const updatedRooms = data.rooms.map(r => ({...r, pipes: '', lightLines: ''}));
          setRooms(updatedRooms); 
          setExpandedRoomId(data.rooms[0].id);
        } else {
          alert("Не удалось распознать чертеж. Создана пустая комната.");
        }
        setStep('result');
      } catch (error) {
        alert("Ошибка сети. Проверьте подключение к серверу.");
        setStep('result');
      }
    };

    const addRoom = () => {
      const newRoom = { id: Date.now(), name: `Помещение ${rooms.length + 1}`, area: '', perimeter: '', corners: '4', canvasType: 'matte_white', profileType: 'standard', lightsCount: '', cornice: '', pipes: '', lightLines: '' };
      setRooms([...rooms, newRoom]);
      setExpandedRoomId(newRoom.id);
    };

    const updateRoom = (id, field, value) => { setRooms(rooms.map(room => room.id === id ? { ...room, [field]: value } : room)); };
    const removeRoom = (id, e) => {
      e.stopPropagation();
      if (rooms.length > 1) setRooms(rooms.filter(room => room.id !== id));
      else alert("Должно остаться хотя бы одно помещение!");
    };

    // Добавили новые поля в локальную формулу суммы
    const localTotalSum = rooms.reduce((total, room) => total + 
      ((Number(room.area) || 0) * prices.canvas[room.canvasType]) + 
      ((Number(room.perimeter) || 0) * prices.profile[room.profileType]) + 
      ((Number(room.lightsCount) || 0) * prices.light) + 
      ((Number(room.corners) || 0) * prices.corner) + 
      ((Number(room.cornice) || 0) * prices.cornice) +
      ((Number(room.pipes) || 0) * prices.pipe) + 
      ((Number(room.lightLines) || 0) * prices.lightLine)
    , 0);

    const sendToBot = async () => {
      try {
        await fetch('https://potolokpro777bot.website/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId, rooms: rooms })
        });
        window.Telegram?.WebApp?.close();
      } catch (error) {
        alert("Ошибка отправки! Проверьте интернет.");
      }
    };

    if (step === 'upload') {
      return (
        <div style={{ animation: 'fadeIn 0.3s ease-in', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Новый замер</h2>
          <p style={{ textAlign: 'center', color: '#8e8e93', marginBottom: '30px' }}>Сфотографируйте чертеж, а система автоматически оцифрует углы и площади</p>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          <div onClick={() => fileInputRef.current.click()} style={{ background: 'white', border: '2px dashed #007aff', borderRadius: '24px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,122,255,0.1)' }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>📸</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#007aff' }}>Смарт-сканер чертежа</h3>
            <p style={{ margin: 0, color: '#8e8e93', fontSize: '14px' }}>Камера или файл из галереи</p>
          </div>
          <button onClick={() => setStep('result')} style={{ marginTop: '20px', background: 'transparent', color: '#8e8e93', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>Ввести данные вручную</button>
        </div>
      )
    }

    if (step === 'analyzing') {
      return (
        <div style={{ animation: 'fadeIn 0.3s ease-in', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '60px', animation: 'spin 2s linear infinite', color: '#007aff' }}>⚙️</div>
          <h2 style={{ marginTop: '20px', color: '#1c1c1e' }}>Оцифровка данных...</h2>
          <p style={{ color: '#8e8e93', textAlign: 'center' }}>Нейросеть распознает чертеж<br/>Это займет около 10 секунд</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )
    }

    return (
      <div style={{ paddingBottom: '80px', animation: 'fadeIn 0.3s ease-in' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => setStep('upload')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0 }}>⬅️</button>
          <h2 style={{ margin: 0, color: '#1c1c1e' }}>Смета</h2>
        </div>
        
        {rooms.map((room) => {
          const isExpanded = expandedRoomId === room.id;
          return (
            <div key={room.id} style={styles.card}>
              <div onClick={() => setExpandedRoomId(isExpanded ? null : room.id)} style={{ padding: '16px', background: isExpanded ? '#f0f4f8' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{isExpanded ? '🔽' : '▶️'}</span>
                  <input type="text" value={room.name} onChange={(e) => updateRoom(room.id, 'name', e.target.value)} onClick={(e) => e.stopPropagation()} style={{ fontSize: '16px', fontWeight: 'bold', border: 'none', background: 'transparent', outline: 'none', width: '150px' }} />
                </div>
                <button onClick={(e) => removeRoom(room.id, e)} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '18px' }}>🗑</button>
              </div>
              {isExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid #e5e5ea' }}>
                  
                  {/* Базовые параметры */}
                  <div style={styles.inputGroup}><span style={{ color: '#8e8e93', fontWeight: '500' }}>Площадь (м²)</span><input type="number" value={room.area} onChange={(e) => updateRoom(room.id, 'area', e.target.value)} style={styles.numInput} /></div>
                  <div style={styles.inputGroup}><span style={{ color: '#8e8e93', fontWeight: '500' }}>Периметр (м)</span><input type="number" value={room.perimeter} onChange={(e) => updateRoom(room.id, 'perimeter', e.target.value)} style={styles.numInput} /></div>
                  <div style={styles.inputGroup}><span style={{ color: '#8e8e93', fontWeight: '500' }}>Углы (шт)</span><input type="number" value={room.corners} onChange={(e) => updateRoom(room.id, 'corners', e.target.value)} style={styles.numInput} /></div>
                  
                  {/* Выбор материалов */}
                  <div style={{ marginBottom: '12px' }}><span style={{ color: '#8e8e93', fontSize: '12px', fontWeight: 'bold' }}>ПОЛОТНО</span><select style={styles.select} value={room.canvasType} onChange={(e) => updateRoom(room.id, 'canvasType', e.target.value)}><option value="matte_white">Белый Матовый (MSD)</option><option value="gloss_white">Белый Глянец (Premium)</option><option value="black">Черный Матовый</option></select></div>
                  <div style={{ marginBottom: '12px' }}><span style={{ color: '#8e8e93', fontSize: '12px', fontWeight: 'bold' }}>ПРОФИЛЬ</span><select style={styles.select} value={room.profileType} onChange={(e) => updateRoom(room.id, 'profileType', e.target.value)}><option value="standard">Стандартный (ПВХ)</option><option value="shadow">Теневой (6 мм)</option><option value="floating">Парящий (с подсветкой)</option></select></div>
                  
                  {/* Дополнительные работы */}
                  <div style={styles.inputGroup}><span style={{ color: '#8e8e93', fontWeight: '500' }}>Светильники (шт)</span><input type="number" value={room.lightsCount} onChange={(e) => updateRoom(room.id, 'lightsCount', e.target.value)} style={styles.numInput} /></div>
                  <div style={styles.inputGroup}><span style={{ color: '#8e8e93', fontWeight: '500' }}>Скрытый карниз (м)</span><input type="number" value={room.cornice} onChange={(e) => updateRoom(room.id, 'cornice', e.target.value)} style={styles.numInput} /></div>
                  <div style={styles.inputGroup}><span style={{ color: '#8e8e93', fontWeight: '500' }}>Обход труб (шт)</span><input type="number" value={room.pipes} onChange={(e) => updateRoom(room.id, 'pipes', e.target.value)} style={styles.numInput} /></div>
                  <div style={styles.inputGroup}><span style={{ color: '#8e8e93', fontWeight: '500' }}>Световые линии (м)</span><input type="number" value={room.lightLines} onChange={(e) => updateRoom(room.id, 'lightLines', e.target.value)} style={styles.numInput} /></div>

                </div>
              )}
            </div>
          )
        })}
        <button onClick={addRoom} style={{ width: '100%', padding: '14px', background: '#e5e5ea', color: '#007aff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>➕ Добавить помещение</button>
        <div style={{ position: 'fixed', bottom: '75px', width: '100%', maxWidth: '440px', background: 'rgba(255,255,255,0.95)', padding: '15px 20px', borderRadius: '20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', zIndex: 90 }}>
          <div><p style={{ margin: 0, fontSize: '12px', color: '#8e8e93', fontWeight: 'bold' }}>ПРЕДВАРИТЕЛЬНО:</p><h2 style={{ margin: 0, color: '#1c1c1e', fontSize: '24px' }}>{localTotalSum.toLocaleString()} ₴</h2></div>
          <button onClick={sendToBot} style={{ background: '#007aff', color: 'white', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>В бот 🚀</button>
        </div>
      </div>
    );
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'calc': return <CalculatorScreen />;
      default: return <DashboardScreen />;
    }
  }

  const getNavStyle = (tabId) => ({ ...styles.navButton, color: activeTab === tabId ? '#007aff' : '#8e8e93' });
  return (
    <div style={styles.appContainer}>
      <div style={styles.contentArea}>{renderScreen()}</div>
      <div style={styles.bottomNav}>
        <button style={getNavStyle('home')} onClick={() => setActiveTab('home')}><span style={styles.navIcon}>🏠</span>Главная</button>
        <button style={getNavStyle('calc')} onClick={() => setActiveTab('calc')}><span style={styles.navIcon}>📐</span>Расчет</button>
      </div>
    </div>
  )
}
export default App