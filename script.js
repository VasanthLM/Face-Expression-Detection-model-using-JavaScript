const video = document.getElementById('video');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./models'),
  faceapi.nets.ageGenderNet.loadFromUri('./models')
]).then(startVideo)
  .catch(error => {
    console.error('Failed to load models:', error);
  });

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(error => {
      console.error('Failed to start video stream:', error);
    });
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  
  setInterval(async () => {
    try {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();
      
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      
      resizedDetections.forEach(element => {
        const { age, gender, genderProbability } = element;
        const text = `Age: ${Math.round(age, 0)} Years`;
        const text1 = `Gender: ${gender} (${Math.round(genderProbability * 100)}%)`;
        const textPosition = {
          x: element.detection.box.bottomLeft.x + 100,
          y: element.detection.box.bottomLeft.y
        };
        
        const text1Position = {
          x: element.detection.box.bottomLeft.x + 100,
          y: element.detection.box.bottomLeft.y + 30
        };
        
        new faceapi.draw.DrawTextField([text], textPosition).draw(canvas);
        new faceapi.draw.DrawTextField([text1], text1Position).draw(canvas);
      });
    } catch (error) {
      console.error('Error in face detection:', error);
    }
  }, 100);
});
