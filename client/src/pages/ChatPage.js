import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket';
import Lottie from 'lottie-react';
import typingAnimation from '../assets/Typing_animation.json'; // Adjust the path to your Lottie JSON file
import '../styles/ChatPage.css';
import Tictactoe from '../components/Tictactoe.js';
import sendIcon from '../assets/send.svg';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import MusicOffIcon from '@mui/icons-material/MusicOff';
import Fab from '@mui/material/Fab';
import backgroundMusic from '../assets/sound/bg1.mp3';
import clickSound from '../assets/sound/chat-click.mp3';

const ChatPage = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [typingMessages, setTypingMessages] = useState(false);
    const [othertypingMessages, setOthertypingMessages] = useState(false);
    const [typinguser, setTypinguser] = useState({ sender: '', name: '' });
    const [isMusicOn, setIsMusicOn] = useState(true);
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const room = location.state;

    const messagesEndRef = useRef(null);
    const bgMusicRef = useRef(null);
    const clickSoundRef = useRef(null);

    useEffect(() => {
        bgMusicRef.current = new Audio(backgroundMusic);
        clickSoundRef.current = new Audio(clickSound);

        // Autoplay the music if it's on initially
        if (isMusicOn) {
            bgMusicRef.current.volume = 0.1;
            bgMusicRef.current.play().catch(error => console.log('Error playing music:', error));
            bgMusicRef.current.loop = true;
        }
        return () => {

            bgMusicRef.current.pause();
        };
    }, []);

    useEffect(() => {
        const bgMusic = bgMusicRef.current;

        if (isMusicOn) {
            bgMusic.play().catch(error => console.log('Error playing music:', error));
            bgMusic.loop = true;
        } else {
            bgMusic.pause();
        }

        return () => {
            if (bgMusic) {
                bgMusic.pause();
            }
        };
    }, [isMusicOn]);

    useEffect(() => {
        const handleNewMessage = ({ sender, message, name }) => {
            setMessages((prevMessages) => [...prevMessages, { sender, message, name }]);
        };

        const handlePlayerJoined = (name) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'system', message: `${name} joined the room` },
            ]);
        };

        const handlePlayerLeft = (playerId, name) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'system', message: `${name} left the room` },
            ]);
            console.log('PlayerID: ' + playerId + ' SocketID: ' + socket.id);
            if (playerId === socket.id) {
                navigate('/');
            }
        };

        const handleRoomNotFound = () => {
            navigate('/');
        };

        socket.emit('checkRoomAndPlayer', roomCode);

        socket.once('roomAndPlayerExists', () => {
            socket.emit('joinRoom', roomCode);

            socket.on('newMessage', handleNewMessage);
            socket.on('othertyping', (user) => {
                // console.log('othertyping', user);
                setOthertypingMessages(true);
                setTypinguser({ sender: user.sender, name: user.userName });
                let timeout = 1500;

                setTimeout(() => {
                    setOthertypingMessages(false);
                    setTypinguser({ sender: '', name: '' });
                }, timeout);
            });
            socket.on('playerJoined', (name) => {
                handlePlayerJoined(name);
            });
            socket.on('playerLeft', (playerId, name) => {
                handlePlayerLeft(playerId, name);
            });
        });

        socket.once('roomOrPlayerNotFound', handleRoomNotFound);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('playerJoined', handlePlayerJoined);
            socket.off('playerLeft', handlePlayerLeft);
            socket.off('roomAndPlayerExists');
            socket.off('roomOrPlayerNotFound');
        };
    }, [navigate, roomCode]);

    useEffect(() => {
        if (typingMessages === true) {
            socket.emit('typing', roomCode);
            setTypingMessages(false);
        }
    }, [typingMessages, roomCode]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (message) {
            socket.emit('sendMessage', roomCode, message);
            clickSoundRef.current.play().catch(error => console.log('Error playing click sound:', error));
            setMessage('');
        }
    };

    const handleExitRoom = () => {
        socket.emit('exitRoom', roomCode, () => {
            clickSoundRef.current.play().catch(error => console.log('Error playing click sound:', error));
            navigate('/');
        });
    };

    const toggleMusic = () => {
        setIsMusicOn((prevIsMusicOn) => !prevIsMusicOn);
    };

    return (
        <div className="chat-page">
            <div className="tic-tac-toe-board">
                <Tictactoe roomCode={roomCode} isMusicOn={isMusicOn} />
            </div>
            <div className="chat-container">
                <h1>Chat Room <span style={{ color: 'grey', fontSize: '0.7em' }}>({roomCode})</span></h1>
                <span id="othertyping" style={{ display: (othertypingMessages && socket.id !== typinguser.sender) ? 'block' : 'none' }}>
                    {typinguser.name} is typing...
                </span>
                <div className="messages">
                    {messages.map((msg, index) => (
                        <div key={index}>
                            {msg.sender === 'system' ? (
                                <span style={{ fontWeight: 'bold' }}>{msg.message}</span>
                            ) : (
                                <span>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {msg.sender === socket.id ? 'You' : ` ${msg.name}`}:
                                    </span>{' '}
                                    {msg.message}
                                </span>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <Lottie animationData={typingAnimation} style={{ width: 50, height: 50, display: (othertypingMessages && socket.id !== typinguser.sender) ? 'block' : 'none' }} />
                <form onSubmit={sendMessage}>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            setTypingMessages(true);
                        }}
                    />
                    <button type="submit" aria-label="Send message">
                        <img src={sendIcon} alt="Send message" />
                    </button>
                </form>
                <button onClick={handleExitRoom}>Exit Room</button>
            </div>
            <Fab className="floating-button"
                style={{ position: 'fixed', bottom: 60, left: 60, zIndex: 100, height: 60, width: 70 }}
                variant="extended"
                onClick={toggleMusic}
            >
                {isMusicOn ? <AudiotrackIcon /> : <MusicOffIcon />}
            </Fab>
        </div>
    );
};

export default ChatPage;
