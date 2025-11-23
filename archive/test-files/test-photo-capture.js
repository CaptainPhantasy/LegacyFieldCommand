// Test script to verify photo capture
// Run this in browser console on the arrival gate page

async function testPhotoCapture() {
  console.log('Starting photo capture test...');
  
  // Find the video element
  const video = document.querySelector('video');
  if (!video) {
    console.error('Video element not found. Click "Take Arrival Photo" first.');
    return;
  }
  
  console.log('Video element found:', {
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    readyState: video.readyState,
    paused: video.paused,
    srcObject: !!video.srcObject
  });
  
  // Wait for video to be ready
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.log('Waiting for video dimensions...');
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });
  }
  
  console.log('Video ready:', {
    width: video.videoWidth,
    height: video.videoHeight
  });
  
  // Try to capture
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Failed to get canvas context');
    return;
  }
  
  try {
    ctx.drawImage(video, 0, 0);
    console.log('✅ Successfully drew video to canvas');
    
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('✅ Successfully created blob:', blob.size, 'bytes');
        console.log('Photo capture test PASSED');
      } else {
        console.error('❌ Failed to create blob');
      }
    }, 'image/jpeg', 0.9);
  } catch (error) {
    console.error('❌ Error capturing:', error);
  }
}

// Run test
testPhotoCapture();

