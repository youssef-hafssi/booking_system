import React, { useEffect, useRef } from 'react';

const ChartComponent = ({ data, type = 'bar', title, isDark }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current = null;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw chart based on type
    if (type === 'bar') {
      drawBarChart(ctx, data.data, canvas.width, canvas.height, isDark);
    } else if (type === 'pie') {
      drawPieChart(ctx, data.data, canvas.width, canvas.height, isDark);
    }
  }, [data, type, isDark]);

  const drawBarChart = (ctx, chartData, width, height, isDark) => {
    if (!chartData || chartData.length === 0) return;

    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Find max value for scaling
    const maxValue = Math.max(...chartData.map(item => item.value));
    const scale = chartHeight / (maxValue * 1.1); // Add 10% padding

    // Colors
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ];

    // Set styles
    ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
    ctx.font = '12px sans-serif';

    // Draw bars
    const barWidth = chartWidth / chartData.length * 0.8;
    const barSpacing = chartWidth / chartData.length * 0.2;

    chartData.forEach((item, index) => {
      const x = padding + index * (barWidth + barSpacing);
      const barHeight = item.value * scale;
      const y = height - padding - barHeight;

      // Draw bar
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);

      // Draw label below bar
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding + 15);
      if (item.label.length > 10) {
        ctx.rotate(-Math.PI / 6); // Rotate long labels
      }
      ctx.textAlign = 'center';
      ctx.fillText(item.label.substring(0, 15), 0, 0);
      ctx.restore();
    });

    // Draw axes
    ctx.strokeStyle = isDark ? '#4B5563' : '#D1D5DB';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw Y-axis labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = (maxValue / ySteps) * i;
      const y = height - padding - (value * scale);
      
      ctx.fillStyle = isDark ? '#9CA3AF' : '#6B7280';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
      
      // Draw grid line
      ctx.strokeStyle = isDark ? '#374151' : '#F3F4F6';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  };

  const drawPieChart = (ctx, chartData, width, height, isDark) => {
    if (!chartData || chartData.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 80;

    // Calculate total value
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    // Colors
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ];

    let currentAngle = -Math.PI / 2; // Start from top

    chartData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = isDark ? '#1F2937' : '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
      
      ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      
      // Calculate percentage
      const percentage = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${item.label}`, labelX, labelY - 8);
      ctx.fillText(`${percentage}%`, labelX, labelY + 8);

      currentAngle += sliceAngle;
    });
  };

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div>No data available</div>
          <div className="text-sm">Try adjusting your filters</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 chart-container" data-chart-type={type} data-chart-title={title}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center chart-title">
        {title}
      </h3>
      <div className="relative" style={{ height: '400px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ maxHeight: '400px' }}
        />
      </div>
      
      {/* Legend for pie charts */}
      {type === 'pie' && (
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {data.data.map((item, index) => {
            const colors = [
              '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
              '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
            ];
            return (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {item.label}: {item.value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.data.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.data.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.max(...data.data.map(item => item.value))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Highest</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(data.data.reduce((sum, item) => sum + item.value, 0) / data.data.length)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartComponent; 