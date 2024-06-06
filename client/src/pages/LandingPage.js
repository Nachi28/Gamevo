import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import '../styles/LandingPage.css';
import gamevoLogo from '../assets/logo1.png';

function LandingPage() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [room, setRoom] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      console.log(socket.id);
    });
    socket.on('playerJoined', () => {
      console.log(room);
      navigate(`/chat/${roomCode}`);
    });
    socket.on('roomsUpdate', (room) => {
      setRoom(room);
      // console.log("update", room);
    });
    return () => {
      socket.off('connect');
      socket.off('playerJoined');
      socket.off('roomsUpdate');
    };
  }, [navigate, roomCode]);

  const handleCreateRoom = () => {
    setIsJoiningRoom(false);
    if (!name) {
      alert('Please enter your name');
      return;
    }
    setIsCreatingRoom(true);
    socket.emit('createRoom', name);
    socket.on('roomCreated', async (code) => {
      setRoomCode(code);
      try {
        await navigator.clipboard.writeText(code);
        alert("Room code copied to clipboard");
      } catch (err) {
        console.error('Failed to copy room code: ', err);
      }
    });
  };

  const handleJoinRoom = () => {
    setIsCreatingRoom(false);
    if (!name) {
      alert('Please enter your name');
      return;
    }
    setIsJoiningRoom(true);
  };

  const handleConnect = () => {
    socket.emit('joinRoom', roomCode, name);
    socket.on('joinedRoom', () => {
      // console.log(room);
      navigate(`/chat/${roomCode}`, { state: room });
    });
    socket.on('joinError', () => {
      alert('Room does not exist');
      setIsJoiningRoom(false);
    });
  };

  return (
    <div className="landing-page-container">
      <img src={gamevoLogo} alt="GameVo Logo" className="gamevo-logo" />
      <h1 className="landing-page-title">GAMEVO</h1>
      <div className="landing-page-form">
        <h2>Game+Convo</h2>
        <input
          id="name-input"
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="button-container">
          <button onClick={handleCreateRoom}>Create Room</button>
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
        <div className="room-status" style={{ display: isCreatingRoom ? 'block' : 'none' }}>
          <input
            id="code-input"
            type="text"
            placeholder="Room Code"
            value={roomCode}
            disabled
          />
          <p>Waiting for other user to join...</p>
        </div>
        <div className="room-input-div" style={{ display: isJoiningRoom ? 'block' : 'none' }}>
          <input
            id="room-input"
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={handleConnect}>Connect</button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;