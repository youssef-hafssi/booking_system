-- Sample workstations with enhanced specifications and images
-- You can run this to test the image and specifications display feature

-- Update existing workstations with sample specifications
UPDATE work_stations SET 
    specifications = 'CPU: Intel i7-12700
RAM: 16GB DDR4
Storage: 512GB SSD
GPU: NVIDIA RTX 3060
Monitor: 27 inch 4K
OS: Windows 11 Pro
Software: Visual Studio, Adobe Creative Suite, Unity',
    description = 'High-performance gaming and development workstation',
    image_url = '/uploads/workstations/sample_gaming_workstation.jpg'
WHERE name = 'rabatworkstation1';

UPDATE work_stations SET 
    specifications = 'CPU: Intel i5-11400
RAM: 8GB DDR4
Storage: 256GB SSD
Monitor: 24 inch Full HD
Keyboard: Mechanical RGB
Mouse: Gaming Mouse
OS: Windows 11
Software: VS Code, Node.js, Git, Chrome',
    description = 'Standard development workstation for coding and web development',
    image_url = '/uploads/workstations/sample_dev_workstation.jpg'
WHERE name = 'rabatworkstation2';

UPDATE work_stations SET 
    specifications = 'CPU: Intel i9-12900K
RAM: 32GB DDR5
Storage: 1TB NVMe SSD
GPU: NVIDIA RTX 4070
Monitor: 32 inch Ultrawide
Webcam: 4K Webcam
Microphone: Studio Quality
OS: Windows 11 Pro
Software: Adobe Premiere Pro, After Effects, Blender, DaVinci Resolve',
    description = 'Premium workstation for video editing, 3D rendering, and intensive development tasks',
    image_url = '/uploads/workstations/sample_premium_workstation.jpg'
WHERE name = 'rabatworkstation3';

-- If you want to add new sample workstations (adjust room_id as needed)
-- INSERT INTO work_stations (name, description, specifications, status, room_id, position, image_url, created_at, updated_at) VALUES
-- ('DemoWorkstation1', 'AI/ML Development Station', '{"cpu": "AMD Ryzen 9 7950X", "ram": "64GB DDR5", "storage": "2TB NVMe SSD", "gpu": "NVIDIA RTX 4090", "monitor": "Dual 27 inch 4K", "specialSoftware": "TensorFlow, PyTorch, CUDA", "os": "Ubuntu 22.04"}', 'AVAILABLE', 1, 'Corner Desk A1', '/uploads/workstations/ai_workstation.jpg', NOW(), NOW());

-- Note: The image URLs are placeholders. In a real scenario, you would:
-- 1. Upload actual images through the admin interface
-- 2. The system will store them in the uploads/workstations/ directory
-- 3. The URLs will be automatically generated 