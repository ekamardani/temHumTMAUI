// File: components/Slider.js
import React from 'react';
import styles from '../styles/Slider.module.css';

export const Slider = ({ min, max, lowerValue, upperValue, onLowerChange, onUpperChange }) => {
  const handleLowerChange = (e) => {
    const value = Math.min(parseFloat(e.target.value), upperValue - 1);
    onLowerChange(value);
  };
  
  const handleUpperChange = (e) => {
    const value = Math.max(parseFloat(e.target.value), lowerValue + 1);
    onUpperChange(value);
  };
  
  // Hitung posisi relatif untuk slider
  const lowerPos = ((lowerValue - min) / (max - min)) * 100;
  const upperPos = ((upperValue - min) / (max - min)) * 100;
  
  return (
    <div className={styles.rangeSlider}>
      <div 
        className={styles.sliderTrack}
        style={{
          background: `linear-gradient(
            to right,
            #ddd ${lowerPos}%,
            #4CAF50 ${lowerPos}%,
            #4CAF50 ${upperPos}%,
            #ddd ${upperPos}%
          )`
        }}
      />
      <input 
        type="range"
        min={min}
        max={max}
        value={lowerValue}
        onChange={handleLowerChange}
        className={`${styles.sliderThumb} ${styles.sliderThumbLeft}`}
      />
      <input 
        type="range"
        min={min}
        max={max}
        value={upperValue}
        onChange={handleUpperChange}
        className={`${styles.sliderThumb} ${styles.sliderThumbRight}`}
      />
    </div>
  );
};