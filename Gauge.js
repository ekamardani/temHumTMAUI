// File: components/Gauge.js
import React from 'react';
import styles from '../styles/Gauge.module.css';

export const Gauge = ({ value, min, max, label, unit, lowerThreshold, upperThreshold }) => {
  // Hitung persentase untuk posisi jarum
  const percentage = ((value - min) / (max - min)) * 100;
  // Batasi antara 0 dan 100
  const constrainedPercentage = Math.max(0, Math.min(100, percentage));
  // Konversi menjadi sudut untuk rotasi jarum (dari -45 deg ke 225 deg)
  const rotation = -45 + (constrainedPercentage * 270 / 100);
  
  // Tentukan warna berdasarkan nilai dan threshold
  let color = '#4CAF50'; // hijau default
  if (value < lowerThreshold || value > upperThreshold) {
    color = '#F44336'; // merah jika di luar threshold
  } else if (value >= lowerThreshold - (max-min) * 0.1 && value <= lowerThreshold + (max-min) * 0.1) {
    color = '#FFC107'; // kuning jika mendekati threshold bawah
  } else if (value >= upperThreshold - (max-min) * 0.1 && value <= upperThreshold + (max-min) * 0.1) {
    color = '#FFC107'; // kuning jika mendekati threshold atas
  }
  
  return (
    <div className={styles.gaugeContainer}>
      <div className={styles.gaugeLabel}>{label}</div>
      <div className={styles.gauge}>
        <div className={styles.gaugeBody}>
          {/* Lingkaran untuk threshold bawah */}
          <div 
            className={styles.threshold} 
            style={{ 
              transform: `rotate(${-45 + ((lowerThreshold - min) / (max - min)) * 270}deg)`,
              backgroundColor: '#FFC107'
            }}
          />
          {/* Lingkaran untuk threshold atas */}
          <div 
            className={styles.threshold} 
            style={{ 
              transform: `rotate(${-45 + ((upperThreshold - min) / (max - min)) * 270}deg)`,
              backgroundColor: '#FFC107'
            }}
          />
          <div 
            className={styles.gaugeNeedle}
            style={{ transform: `rotate(${rotation}deg)`, backgroundColor: color }}
          />
          <div className={styles.gaugeCap} />
        </div>
        <div className={styles.gaugeValue}>
          {value.toFixed(1)}{unit}
        </div>
        <div className={styles.gaugeMin}>{min}</div>
        <div className={styles.gaugeMax}>{max}</div>
      </div>
    </div>
  );
};