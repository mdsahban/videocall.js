let APP_ID = "Enter Your API Key"

let token = null;
let uid = String(Math.floor(Math.random() * 10000))

let client;
let channel;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if (!roomId) {
    window.location = 'lobby.html'
}

let localStream;
let remoteStream;
let peerConnection;

let screenStream = null;

let videos = document.getElementsByClassName('video-player');
for (let i = 0; i < videos.length; i++) {
    videos[i].style.transform = 'scaleX(-1)';
}

const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
}

let constraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio: true
}

let init = async () => {
    try {
        client = await AgoraRTM.createInstance(APP_ID)
        await client.login({ uid, token })

        channel = client.createChannel(roomId)
        await channel.join()

        channel.on('MemberJoined', handleUserJoined)
        channel.on('MemberLeft', handleUserLeft)
        channel.on('ChannelMessage', handleChannelMessage)
        
        addBotMessageToDom(`Welcome to the room User 👋`)

        client.on('MessageFromPeer', handleMessageFromPeer)

        localStream = await navigator.mediaDevices.getUserMedia(constraints)
        document.getElementById('user-1').srcObject = localStream
    } catch (error) {
        console.error("Error during Agora initialization:", error);
    }
}

let handleUserLeft = (MemberId) => {
    document.getElementById('user-2').style.display = 'none'
    document.getElementById('user-1').classList.remove('smallFrame')
    addBotMessageToDom(`User has left the room 👋`)

}

let handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text)

    if (message.type === 'offer') {
        createAnswer(MemberId, message.offer)
    }

    if (message.type === 'answer') {
        addAnswer(message.answer)
    }

    if (message.type === 'candidate') {
        if (peerConnection) {
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let handleUserJoined = async (MemberId) => {
    console.log('A new user joined the channel:', MemberId)
    createOffer(MemberId)
    addBotMessageToDom(`Welcome to the room User 👋`)

}

let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'
    document.getElementById('user-1').classList.add('smallFrame')

    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia(constraints)
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, MemberId)
        }
    }
}

let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, MemberId)
}

let createAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, MemberId)
}


let addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer)
    }
}

let handleChannelMessage = async (messageData) => {
    console.log('A new message was received')
    let data = JSON.parse(messageData.text)
    console.log('Message:', data);

    if (data.type === 'chat') {
        addMessageToDom(data.message)
    }
    

}

let sendMessage = async (e) => {
    e.preventDefault()

    let message = e.target.message.value
    channel.sendMessage({text:JSON.stringify({'type':'chat', 'message':message})})
    addMessageToDom(message)
    e.target.reset()
}

let addMessageToDom = (message) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">user</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                <div class="message__body__bot">
                    <strong class="message__author__bot">🤖 Bot</strong>
                    <p class="message__text__bot">${botMessage}</p>
                </div>
            </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}



let leaveChannel = async () => {
    await channel.leave()
    await client.logout()
    if (peerConnection) {
        peerConnection.close();
    }
}

let toggleCamera = async () => {
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

    if (videoTrack.enabled) {
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        document.getElementById('camera').style.color = '#000000'
        document.getElementById('camera').className = "fa-solid fa-video-slash fa-xl"
    } else {
        videoTrack.enabled = true
        document.getElementById('camera-btn').style.backgroundColor = '#36393e'
        document.getElementById('camera').style.color = '#fffefa'
        document.getElementById('camera').className = "fa-solid fa-video fa-xl"
    }
}

let toggleMic = () => {
    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')

    if (audioTrack.enabled) {
        audioTrack.enabled = false;
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        document.getElementById('mic').src = 'icons/mute-mic.png'
    } else {
        audioTrack.enabled = true;
        document.getElementById('mic-btn').style.backgroundColor = '#36393e'
        document.getElementById('mic').src = 'icons/mic.png'
    }
}

let toggleScreenShare = async () => {
    if (!screenStream) {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

            let screenTrack = screenStream.getVideoTracks()[0];
            let videoSender = peerConnection.getSenders().find(sender => sender.track.kind === 'video');

            if (videoSender) {
                videoSender.replaceTrack(screenTrack); 
            }

            document.getElementById('user-1').srcObject = screenStream;
            document.getElementById('camera-btn').style.display = 'none'
            document.getElementById('screen-share').style.color = '#000000'
            document.getElementById('screen-share-btn').style.backgroundColor = 'rgb(255, 80, 80)'

            let videos = document.getElementsByClassName('video-player');
            for (let i = 0; i < videos.length; i++) {
                videos[i].style.transform = 'scaleX(1)';
            }

            screenTrack.onended = () => {
                stopScreenShare();
            };
        } catch (error) {
            console.error("Error sharing the screen:", error);
        }
    } else {
        stopScreenShare();
    }
}

let stopScreenShare = () => {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());

        let videoTrack = localStream.getVideoTracks()[0];
        let videoSender = peerConnection.getSenders().find(sender => sender.track.kind === 'video');

        if (videoSender) {
            videoSender.replaceTrack(videoTrack);
        }

        document.getElementById('user-1').srcObject = localStream;
        document.getElementById('camera-btn').style.display = 'flex'
        document.getElementById('screen-share').style.color = '#fffefa'
        document.getElementById('screen-share-btn').style.backgroundColor = '#36393e'

        screenStream = null;
    }

    let videos = document.getElementsByClassName('video-player');
    for (let i = 0; i < videos.length; i++) {
        videos[i].style.transform = 'scaleX(-1)';
    }
}

let newX = 0, newY = 0, startX = 0, startY = 0;

const card = document.getElementById('user-1');
const padding = 20; // Gap between the card and the corners

// Listen for the mousedown event to start dragging
card.addEventListener('mousedown', mouseDown);

function mouseDown(e) {
    // Record the initial mouse position
    startX = e.clientX;
    startY = e.clientY;

    // Attach mousemove and mouseup listeners to track dragging
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
}

function mouseMove(e) {
    // Calculate how much the mouse has moved
    newX = startX - e.clientX;
    newY = startY - e.clientY;

    // Update the starting position for the next move
    startX = e.clientX;
    startY = e.clientY;

    // Move the card based on the mouse movement
    card.style.top = (card.offsetTop - newY) + 'px';
    card.style.left = (card.offsetLeft - newX) + 'px';
}

function mouseUp(e) {
    // Get the card's current bounding box
    const rect = card.getBoundingClientRect();
    const cardX = rect.left;
    const cardY = rect.top;

    // Get the viewport's width and height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the distances to each corner (top-left, top-right, bottom-left, bottom-right)
    const distanceToTopLeft = Math.hypot(cardX, cardY);
    const distanceToTopRight = Math.hypot(windowWidth - cardX - rect.width, cardY);
    const distanceToBottomLeft = Math.hypot(cardX, windowHeight - cardY - rect.height);
    const distanceToBottomRight = Math.hypot(windowWidth - cardX - rect.width, windowHeight - cardY - rect.height);

    // Determine the nearest corner
    const nearestCorner = Math.min(distanceToTopLeft, distanceToTopRight, distanceToBottomLeft, distanceToBottomRight);

    // Snap the card to the nearest corner with padding
    if (nearestCorner === distanceToTopLeft) {
        card.style.top = `${padding}px`;
        card.style.left = `${padding}px`;
    } else if (nearestCorner === distanceToTopRight) {
        card.style.top = `${padding}px`;
        card.style.left = `${windowWidth - rect.width - padding}px`;
    } else if (nearestCorner === distanceToBottomLeft) {
        card.style.top = `${windowHeight - rect.height - padding}px`;
        card.style.left = `${padding}px`;
    } else if (nearestCorner === distanceToBottomRight) {
        card.style.top = `${windowHeight - rect.height - padding}px`;
        card.style.left = `${windowWidth - rect.width - padding}px`;
    }

    // Remove the mousemove and mouseup listeners after dragging is finished
    document.removeEventListener('mousemove', mouseMove);
    document.removeEventListener('mouseup', mouseUp);
}




let toggleChat = () => {
   let chatBox = document.getElementById('messages__container');
    if (chatBox.style.display === 'block') {
        chatBox.style.display = 'none'
        document.getElementById('message-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        document.getElementById('message').style.color = '#000000'

        
    } else {
        chatBox.style.display = 'block'
        document.getElementById('message-btn').style.backgroundColor = '#36393e'
        document.getElementById('message').style.color = '#fffefa'

        
    }
}

window.addEventListener('beforeunload', leaveChannel)
let messageForm = document.getElementById('message__form')
messageForm.addEventListener('submit', sendMessage)

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-share-btn').addEventListener('click', toggleScreenShare)
document.getElementById('message-btn').addEventListener('click', toggleChat)


init()
