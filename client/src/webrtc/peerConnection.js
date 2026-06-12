export const createPeerConnection = (configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}) => {
  return new RTCPeerConnection(configuration);
};

export const addTracksToPeer = (peerConnection, stream) => {
  if (stream) {
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
  }
};

export const createOffer = async (peerConnection) => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

export const createAnswer = async (peerConnection, offer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

export const setRemoteAnswer = async (peerConnection, answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};