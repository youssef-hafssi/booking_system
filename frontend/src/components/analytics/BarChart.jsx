import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const BarChart = ({ data, title, height = 300 }) => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size for high DPI displays
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = height + 'px';

    const { width } = rect;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart configuration
    const padding = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = Math.max(20, (chartWidth / data.length) - 10);
    const maxValue = Math.max(...data.map(item => item.value));
    
    // Colors based on theme
    const colors = {
      bar: isDark ? '#3b82f6' : '#2563eb',
      text: isDark ? '#e5e7eb' : '#374151',
      grid: isDark ? '#374151' : '#e5e7eb',
      background: isDark ? '#1f2937' : '#ffffff'
    };

    // Draw grid lines
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      
      // Draw y-axis labels
      const value = Math.round((maxValue / gridLines) * (gridLines - i));
      ctx.fillStyle = colors.text;
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value.toString(), padding.left - 10, y + 4);
    }

    // Draw bars and labels
    data.forEach((item, index) => {
      const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
      const x = padding.left + index * (barWidth + 10);
      const y = padding.top + chartHeight - barHeight;

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, colors.bar);
      gradient.addColorStop(1, colors.bar + '80');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw bar border
      ctx.strokeStyle = colors.bar;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);

      // Draw label (truncate long names)
      const label = item.label.length > 12 ? item.label.substring(0, 12) + '...' : item.label;
      ctx.font = '11px Arial';
      ctx.save();
      ctx.translate(x + barWidth / 2, padding.top + chartHeight + 20);
      ctx.rotate(-Math.PI / 6); // Rotate labels for better readability
      ctx.textAlign = 'right';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    // Draw axes
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

  }, [data, isDark, height]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full chart-container" data-chart-type="bar" data-chart-title={title}>
      {title && (
        <h4 className="text-center font-medium text-gray-700 dark:text-gray-300 mb-4 chart-title">
          {title}
        </h4>
      )}
      <canvas 
        ref={canvasRef} 
        className="w-full border border-gray-200 dark:border-gray-700 rounded"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default BarChart; 