import { useState, useEffect } from 'react' // Добавили useEffect
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('calc')
  const [userName, setUserName] = useState('Гость'); // Состояние для имени

  // Подключаем магию Telegram при старте приложения
  useEffect(() => {
    // Проверяем, открыто ли приложение внутри Телеграма
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      tg.ready(); // Сообщаем Телеграму, что приложение готово
      tg.expand(); // Разворачиваем на всю высоту экрана
      
      // Пытаемся получить имя пользователя из Телеграма
      const name = tg.initDataUnsafe?.user?.first_name;
      if (name) {
        setUserName(name);
      } else {
        setUserName('Павел (Демо)'); // Если открыто просто в браузере
      }
    }
  }, []);

  // --- БАЗОВЫЕ ЦЕНЫ ДЛЯ ДЕМОНСТРАЦИИ ---
  // ... (весь остальной твой код с ценами и стилями оставляем без изменений)

  const [prices, setPrices] = useState({
    canvas: { matte_white: 330, gloss_white: 350, black: 400 },
    profile: { standard: 60, shadow: 350, floating: 500 },
    light: 250, chand: 300, cornice: 1200
  });

  const styles = {
    appContainer: { maxWidth: '480px', margin: '0 auto', height: '100vh', backgroundColor: '#f5f5f7', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' },
    contentArea: { flex: 1, padding: '20px', overflowY: 'auto', paddingBottom: '100px' },
    bottomNav: { position: 'fixed', bottom: 0, width: '100%', maxWidth: '480px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', padding: '15px 0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', borderRadius: '20px 20px 0 0', zIndex: 100 },
    navButton: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
    navIcon: { fontSize: '24px', marginBottom: '4px' },
    card: { background: 'white', padding: '16px', borderRadius: '16px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    slider: { width: '100%', accentColor: '#007aff', marginTop: '10px' },
    select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', marginTop: '5px' },
    input: { width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center' }
  }

  const DashboardScreen = () => {
    return (
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
  };

  // --- ЭКРАН 2: КАЛЬКУЛЯТОР (С АВТО-СКАНОМ) ---
  const CalculatorScreen = () => {
    const [step, setStep] = useState('upload'); 
    
    const roomArea = 15; const roomPerimeter = 16;
    const [canvasType, setCanvasType] = useState('matte_white');
    const [profileType, setProfileType] = useState('standard');
    const [lightsCount, setLightsCount] = useState(6);

    const totalSum = (roomArea * prices.canvas[canvasType]) + (roomPerimeter * prices.profile[profileType]) + (lightsCount * prices.light);

    // Реальная отправка данных на Python-сервер
    const handleUpload = async () => {
      setStep('analyzing');
      
      try {
        const response = await fetch('https://spa-molecules-cleared-tumor.trycloudflare.com/api/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: "Привет от Смарт-Сканера!",
            canvasType: canvasType,
            profileType: profileType,
            lightsCount: lightsCount
          })
        });

        const data = await response.json();
        console.log("Ответ от сервера:", data);
        
        // В будущем здесь мы будем подставлять реальные цены из data
        // Но пока просто переключаем экран на результат
        setStep('result'); 
        
      } catch (error) {
        console.error("Ошибка связи с сервером:", error);
        alert("Не удалось связаться с сервером расчета. Попробуйте еще раз.");
        setStep('upload'); // Возвращаем на экран загрузки в случае ошибки
      }
    };

    // ШАГ 1: Загрузка фото (Изменены тексты)
    if (step === 'upload') {
      return (
        <div style={{ animation: 'fadeIn 0.3s ease-in', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Новый замер</h2>
          <p style={{ textAlign: 'center', color: '#8e8e93', marginBottom: '30px' }}>Сфотографируйте чертеж, а система автоматически оцифрует углы и площади</p>
          
          <div onClick={handleUpload} style={{ background: 'white', border: '2px dashed #007aff', borderRadius: '24px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,122,255,0.1)' }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>📸</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#007aff' }}>Смарт-сканер чертежа</h3>
            <p style={{ margin: 0, color: '#8e8e93', fontSize: '14px' }}>Камера или файл из галереи</p>
          </div>
        </div>
      )
    }

    // ШАГ 2: Анимация загрузки (Изменены тексты и иконка)
    if (step === 'analyzing') {
      return (
        <div style={{ animation: 'fadeIn 0.3s ease-in', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '60px', animation: 'spin 2s linear infinite', color: '#007aff' }}>⚙️</div>
          <h2 style={{ marginTop: '20px', color: '#1c1c1e' }}>Оцифровка данных...</h2>
          <p style={{ color: '#8e8e93', textAlign: 'center' }}>Сканирование геометрии помещения<br/>Построение виртуальной модели</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )
    }

    // ШАГ 3: Готовый расчет
    return (
      <div style={{ paddingBottom: '60px', animation: 'fadeIn 0.3s ease-in' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setStep('upload')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0 }}>⬅️</button>
          <h2 style={{ margin: 0, color: '#1c1c1e' }}>Смета: Зал</h2>
        </div>

        <div style={{ height: '180px', background: canvasType === 'black' ? '#1c1c1e' : '#e5e5ea', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease', marginBottom: '20px' }}>
          <span style={{ color: canvasType === 'black' ? 'white' : '#8e8e93', fontWeight: 'bold' }}>{canvasType === 'black' ? '⚫️ Черный потолок' : '⚪️ Светлый потолок'}</span>
        </div>

        <div style={styles.card}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#8e8e93' }}>ПОЛОТНО</label>
          <select style={styles.select} value={canvasType} onChange={(e) => setCanvasType(e.target.value)}>
            <option value="matte_white">Белый Матовый (MSD)</option>
            <option value="black">Черный Матовый</option>
          </select>
        </div>

        <div style={styles.card}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#8e8e93' }}>ПРОФИЛЬ</label>
          <select style={styles.select} value={profileType} onChange={(e) => setProfileType(e.target.value)}>
            <option value="standard">Стандартный (ПВХ)</option>
            <option value="shadow">Теневой (6 мм)</option>
            <option value="floating">Парящий (с подсветкой)</option>
          </select>
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Светильники: {lightsCount} шт</span><span style={{ color: '#007aff' }}>+{lightsCount * prices.light} ₴</span></div>
          <input type="range" min="0" max="20" value={lightsCount} onChange={(e) => setLightsCount(parseInt(e.target.value))} style={styles.slider} />
        </div>

        <div style={{ position: 'fixed', bottom: '75px', width: '100%', maxWidth: '440px', background: 'rgba(255,255,255,0.95)', padding: '15px 20px', borderRadius: '20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
          <div><p style={{ margin: 0, fontSize: '12px', color: '#8e8e93', fontWeight: 'bold' }}>ИТОГО:</p><h2 style={{ margin: 0, color: '#1c1c1e', fontSize: '24px' }}>{totalSum.toLocaleString()} ₴</h2></div>
          <button style={{ background: '#1c1c1e', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px' }}>Оформить</button>
        </div>
      </div>
    );
  };

  const CrmScreen = () => {
    // Демо-данные для CRM (чтобы не было пустого экрана)
    return (
      <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#1c1c1e' }}>Мои проекты</h2>
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Иван, ул. Киевская 10</h3>
            <span style={{ fontSize: '12px', color: '#8e8e93' }}>📅 Сегодня</span>
          </div>
          <p style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#007aff', fontWeight: 'bold' }}>15 000 ₴</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#f2f2f7', color: '#1c1c1e', fontWeight: 'bold' }}>📄 Смета</button>
            <button style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#f2f2f7', color: '#1c1c1e', fontWeight: 'bold' }}>📜 Договор</button>
          </div>
        </div>
      </div>
    );
  };
  
  const SettingsScreen = () => (<div style={styles.card}><h2>Настройки</h2><p>Прайс-лист...</p></div>);

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