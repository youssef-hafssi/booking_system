import React, { useState } from 'react';
import { captureChartsWithMetadata } from '../../utils/chartExportUtils';

const TestChartCapture = () => {
  const [capturedCharts, setCapturedCharts] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureCharts = async () => {
    setIsCapturing(true);
    try {
      const charts = await captureChartsWithMetadata();
      setCapturedCharts(charts);
      console.log('Captured charts:', charts);
    } catch (error) {
      console.error('Error capturing charts:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Chart Capture Test</h3>
      
      <button
        onClick={handleCaptureCharts}
        disabled={isCapturing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isCapturing ? 'Capturing...' : 'Test Chart Capture'}
      </button>

      {capturedCharts.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Captured Charts ({capturedCharts.length}):</h4>
          <ul className="space-y-2">
            {capturedCharts.map((chart, index) => (
              <li key={index} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="text-sm">
                  <strong>Title:</strong> {chart.title}
                </div>
                <div className="text-sm">
                  <strong>Type:</strong> {chart.type}
                </div>
                <div className="text-sm">
                  <strong>Size:</strong> {chart.width} x {chart.height}
                </div>
                <div className="text-sm">
                  <strong>Image:</strong> {chart.image ? 'Captured' : 'Failed'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestChartCapture; 