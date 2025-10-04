/**
 * Utility functions for exporting charts to PDF
 */

/**
 * Convert canvas element to base64 image data
 * @param {HTMLCanvasElement} canvas - The canvas element to convert
 * @param {string} format - Image format (default: 'image/png')
 * @returns {string} Base64 image data
 */
export const canvasToBase64 = (canvas, format = 'image/png') => {
  if (!canvas) return null;
  try {
    return canvas.toDataURL(format);
  } catch (error) {
    console.error('Error converting canvas to base64:', error);
    return null;
  }
};

/**
 * Capture chart images from the current page
 * @returns {Promise<Object>} Object containing chart images
 */
export const captureChartImages = async () => {
  const chartImages = {};
  
  try {
    // Find all canvas elements that represent charts
    const canvases = document.querySelectorAll('canvas');
    
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      
      // Skip if canvas is empty or too small (likely not a chart)
      if (canvas.width < 100 || canvas.height < 100) continue;
      
      // Try to identify chart type from parent elements
      const parentElement = canvas.closest('[data-chart-type]') || 
                           canvas.closest('.chart-container') ||
                           canvas.closest('[class*="chart"]');
      
      let chartType = 'chart';
      if (parentElement) {
        if (parentElement.dataset.chartType) {
          chartType = parentElement.dataset.chartType;
        } else if (parentElement.className.includes('bar')) {
          chartType = 'barChart';
        } else if (parentElement.className.includes('pie')) {
          chartType = 'pieChart';
        } else if (parentElement.className.includes('line')) {
          chartType = 'lineChart';
        }
      }
      
      // Convert canvas to base64
      const base64Image = canvasToBase64(canvas);
      if (base64Image) {
        chartImages[`${chartType}_${i}`] = base64Image;
      }
    }
    
    return chartImages;
  } catch (error) {
    console.error('Error capturing chart images:', error);
    return {};
  }
};

/**
 * Wait for charts to render before capturing
 * @param {number} delay - Delay in milliseconds (default: 1000)
 * @returns {Promise}
 */
export const waitForChartsToRender = (delay = 1000) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Capture charts with automatic detection and labeling
 * @returns {Promise<Array>} Array of chart objects with metadata
 */
export const captureChartsWithMetadata = async () => {
  await waitForChartsToRender();
  
  const charts = [];
  const canvases = document.querySelectorAll('canvas');
  
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    
    // Skip small canvases
    if (canvas.width < 100 || canvas.height < 100) continue;
    
    // Get chart metadata from DOM
    const container = canvas.closest('.chart-container, [data-chart-title], .bg-white, .dark\\:bg-dark-card');
    let title = 'Chart';
    let type = 'unknown';
    
    if (container) {
      // Try to find title
      const titleElement = container.querySelector('h3, h4, .chart-title, [data-chart-title]');
      if (titleElement) {
        title = titleElement.textContent.trim() || titleElement.dataset.chartTitle || 'Chart';
      }
      
          // Try to determine type
    if (container.textContent.includes('Bar Chart') || container.className.includes('bar')) {
      type = 'bar';
    } else if (container.textContent.includes('Pie Chart') || container.className.includes('pie')) {
      type = 'pie';
    } else if (container.textContent.includes('Line Chart') || container.className.includes('line')) {
      type = 'line';
    }
  }
  
  // SKIP PIE CHARTS - Don't include them in the export
  const containerText = container ? container.textContent.toLowerCase() : '';
  const aspectRatio = canvas.width / canvas.height;
  const isSquareish = aspectRatio >= 0.8 && aspectRatio <= 1.2; // Nearly square canvases are often pie charts
  
  const isPieChart = type === 'pie' || 
                   title.toLowerCase().includes('pie') || 
                   title.toLowerCase().includes('distribution') || 
                   title.toLowerCase().includes('status') ||
                   title.toLowerCase().includes('total') ||
                   containerText.includes('total') ||
                   containerText.includes('%') ||
                   containerText.includes('100.0%') ||
                   containerText.includes('percentage') ||
                   // Check for circular/round chart indicators
                   containerText.includes('circle') ||
                   containerText.includes('doughnut') ||
                   // Look for common pie chart text patterns
                   (containerText.includes('total') && containerText.includes('2')) ||
                   // Check canvas shape - pie charts are often square
                   (isSquareish && containerText.includes('total')) ||
                   // More aggressive: if canvas is square and small, likely a pie chart
                   (isSquareish && canvas.width < 400);
  
  if (isPieChart) {
    console.log(`Skipping pie chart: ${title} (type: ${type}) - Container text: "${containerText.substring(0, 100)}" - Canvas: ${canvas.width}x${canvas.height}`);
    continue;
  }
  
  const base64Image = canvasToBase64(canvas);
  if (base64Image) {
    charts.push({
        id: `chart_${i}`,
        title,
        type,
        image: base64Image,
        width: canvas.width,
        height: canvas.height
      });
    }
  }
  
  return charts;
}; 