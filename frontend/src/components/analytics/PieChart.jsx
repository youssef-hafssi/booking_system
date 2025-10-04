import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const PieChart = ({ data, title, height = 300 }) => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();
  const [hoveredSlice, setHoveredSlice] = React.useState(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

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
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate total and generate colors
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = [
      '#3b82f6', // Blue
      '#ef4444', // Red
      '#10b981', // Green
      '#f59e0b', // Yellow
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#84cc16', // Lime
      '#ec4899', // Pink
      '#6b7280'  // Gray
    ];

    let currentAngle = -Math.PI / 2;

    // Draw pie slices
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const color = colors[index % colors.length];
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw slice border
      ctx.strokeStyle = isDark ? '#374151' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw percentage labels on slices (if slice is large enough)
      const percentage = ((item.value / total) * 100).toFixed(1);
      if (parseFloat(percentage) > 5) { // Only show percentage if slice is > 5%
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }

      currentAngle += sliceAngle;
    });

    // Draw center circle for donut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw total in center
    ctx.fillStyle = isDark ? '#e5e7eb' : '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Total', centerX, centerY - 8);
    ctx.font = 'bold 20px Arial';
    ctx.fillText(total.toString(), centerX, centerY + 12);

  }, [data, isDark, height]);

  // Function to detect which slice is being hovered
  const getSliceFromMousePosition = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return null;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = height / 2;
    const radius = Math.min(rect.width, height) / 3;
    
    // Check if mouse is within the pie chart
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (distance > radius || distance < radius * 0.4) return null;
    
    // Calculate angle
    let angle = Math.atan2(y - centerY, x - centerX);
    angle = (angle + Math.PI / 2) % (2 * Math.PI);
    if (angle < 0) angle += 2 * Math.PI;
    
    // Find which slice the angle belongs to
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    for (let i = 0; i < data.length; i++) {
      const sliceAngle = (data[i].value / total) * 2 * Math.PI;
      if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
        return { index: i, data: data[i] };
      }
      currentAngle += sliceAngle;
    }
    
    return null;
  };

  // Mouse event handlers
  const handleMouseMove = (event) => {
    const slice = getSliceFromMousePosition(event);
    setHoveredSlice(slice);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredSlice(null);
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
  ];

  return (
    <div className="w-full chart-container overflow-hidden" data-chart-type="pie" data-chart-title={title}>
      {title && (
        <h4 className="text-center font-medium text-gray-700 dark:text-gray-300 mb-4 chart-title">
          {title}
        </h4>
      )}
      <div className="flex flex-col lg:flex-row items-center gap-6 overflow-hidden">
        <div className="flex-shrink-0 max-w-full">
          <canvas 
            ref={canvasRef} 
            className="border border-gray-200 dark:border-gray-700 rounded max-w-full cursor-pointer"
            style={{ height: `${height}px` }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredSlice && (
        <div 
          className="fixed z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="font-medium">{hoveredSlice.data.label}</div>
          <div className="text-xs opacity-90">
            {hoveredSlice.data.value} reservations ({((hoveredSlice.data.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChart; 