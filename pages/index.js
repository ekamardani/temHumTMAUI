// File: pages/index.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Gauge } from '../components/Gauge';
import { Slider } from '../components/Slider';
import styles from '../styles/Home.module.css';

// Konstanta untuk Telegram WebApp
const WebApp = typeof window !== 'undefined' ? window.Telegram.WebApp : null;

export default function Home() {
  // State untuk data sensor
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');
  
  // State untuk pengaturan batas
  const [tempLower, setTempLower] = useState(20);
  const [tempUpper, setTempUpper] = useState(35);
  const [humidLower, setHumidLower] = useState(40);
  const [humidUpper, setHumidUpper] = useState(80);
  const [notifActive, setNotifActive] = useState(true);
  
  // State untuk loading
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Inisialisasi Telegram Mini App
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
      
      // Dapatkan pengaturan dari Bot jika tersedia
      const initData = WebApp.initData || '';
      if (initData) {
        try {
          const params = new URLSearchParams(initData);
          const startParam = params.get('start_param');
          if (startParam) {
            const settings = JSON.parse(atob(startParam));
            setTempLower(settings.temp_lower || 20);
            setTempUpper(settings.temp_upper || 35);
            setHumidLower(settings.humidity_lower || 40);
            setHumidUpper(settings.humidity_upper || 80);
            setNotifActive(settings.notif_active !== undefined ? settings.notif_active : true);
          }
        } catch (error) {
          console.error('Error parsing init data:', error);
        }
      }
    }
    
    // Dapatkan data terbaru
    fetchLatestData();
    
    // Set interval untuk pembaruan otomatis
    const interval = setInterval(fetchLatestData, 60000); // Refresh tiap 1 menit
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchLatestData = async () => {
    try {
      setIsLoading(true);
      // Ganti URL dengan URL Google Apps Script anda
      const response = await fetch('https://script.google.com/macros/s/AKfycbwuZQJJKxjZTrc9eLhQEacTagCJsVELs27KvoA9Nvgcxjf36ytwFFzQGiugl6hRQp0/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=getLatest'
      });
      
      const data = await response.json();
      
      if (!data.error) {
        setTemperature(parseFloat(data.temperature));
        setHumidity(parseFloat(data.humidity));
        setLastUpdate(`${data.date} ${data.time}`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveSettings = () => {
    // Kirim pengaturan ke Bot Telegram
    if (WebApp) {
      const settings = {
        temp_lower: tempLower,
        temp_upper: tempUpper,
        humidity_lower: humidLower,
        humidity_upper: humidUpper,
        notif_active: notifActive
      };
      
      WebApp.sendData(JSON.stringify({
        action: 'saveSettings',
        settings: settings
      }));
      
      // Tampilkan popup konfirmasi
      WebApp.showPopup({
        title: 'Pengaturan Disimpan',
        message: 'Pengaturan batas notifikasi telah disimpan',
        buttons: [{ type: 'ok' }]
      });
    }
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Monitoring Kolam</title>
        <meta name="description" content="Sistem monitoring kolam ikan" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Monitoring Kolam Ikan</h1>
        
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            <div className={styles.gaugeContainer}>
              <div className={styles.gaugeWrapper}>
                <Gauge 
                  value={temperature} 
                  min={0} 
                  max={50} 
                  label="Suhu"
                  unit="°C"
                  lowerThreshold={tempLower}
                  upperThreshold={tempUpper}
                />
              </div>
              <div className={styles.gaugeWrapper}>
                <Gauge 
                  value={humidity} 
                  min={0} 
                  max={100} 
                  label="Kelembapan"
                  unit="%"
                  lowerThreshold={humidLower}
                  upperThreshold={humidUpper}
                />
              </div>
            </div>
            
            <div className={styles.lastUpdate}>
              Pembaruan terakhir: {lastUpdate}
            </div>
            
            <div className={styles.settingsContainer}>
              <h2>Pengaturan Batas Notifikasi</h2>
              
              <div className={styles.sliderContainer}>
                <h3>Batas Suhu (°C)</h3>
                <Slider 
                  min={0} 
                  max={50} 
                  lowerValue={tempLower} 
                  upperValue={tempUpper}
                  onLowerChange={setTempLower}
                  onUpperChange={setTempUpper}
                />
                <div className={styles.sliderValues}>
                  <span>{tempLower}°C</span>
                  <span>{tempUpper}°C</span>
                </div>
              </div>
              
              <div className={styles.sliderContainer}>
                <h3>Batas Kelembapan (%)</h3>
                <Slider 
                  min={0} 
                  max={100} 
                  lowerValue={humidLower} 
                  upperValue={humidUpper}
                  onLowerChange={setHumidLower}
                  onUpperChange={setHumidUpper}
                />
                <div className={styles.sliderValues}>
                  <span>{humidLower}%</span>
                  <span>{humidUpper}%</span>
                </div>
              </div>
              
              <div className={styles.notifToggle}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={notifActive} 
                    onChange={(e) => setNotifActive(e.target.checked)} 
                  />
                  Aktifkan Notifikasi
                </label>
              </div>
              
              <button className={styles.saveButton} onClick={saveSettings}>
                Simpan Pengaturan
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
