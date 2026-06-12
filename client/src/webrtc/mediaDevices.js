export const getUserMedia = async (constraints = { video: true, audio: true }) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw error;
  }
};

export const getDisplayMedia = async (constraints = { video: true, audio: true }) => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error sharing screen:', error);
    throw error;
  }
};

export const getAvailableDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      audioInput: devices.filter(d => d.kind === 'audioinput'),
      audioOutput: devices.filter(d => d.kind === 'audiooutput'),
      videoInput: devices.filter(d => d.kind === 'videoinput')
    };
  } catch (error) {
    console.error('Error getting devices:', error);
    return { audioInput: [], audioOutput: [], videoInput: [] };
  }
};

export const stopMediaStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};