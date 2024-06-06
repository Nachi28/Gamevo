import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import Confetti from 'react-confetti';
import '../styles/Tictactoe.css';
import loseSound from '../assets/sound/lose.mp3';
import winSound from '../assets/sound/win.mp3';
import clickSound from '../assets/sound/game-click.wav';
import chatClickSound from '../assets/sound/chat-click.mp3';

const TicTacToe = ({ roomCode }) => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isNext, setIsNext] = useState(null);
    const [winner, setWinner] = useState(null);
    const [nextPlayerName, setNextPlayerName] = useState('');
    const [nextMove, setNextMove] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const loseSoundRef = useRef(null);
    const winSoundRef = useRef(null);
    const clickSoundRef = useRef(null);
    const chatClickSoundRef = useRef(null);

    useEffect(() => {
        loseSoundRef.current = new Audio(loseSound);
        winSoundRef.current = new Audio(winSound);
        clickSoundRef.current = new Audio(clickSound);
        chatClickSoundRef.current = new Audio(chatClickSound);

    }, []);

    useEffect(() => {
        if (!roomCode) return;

        socket.emit('StartGame', roomCode);

        socket.on('GameInitialized', ({ playerId, playerName, nextMove }) => {
            setPlayerName(playerName);
            setIsNext(playerId === socket.id);
            setNextPlayerName(playerName);
            setNextMove(nextMove);
        });

        socket.on('gameUpdate', ({ newBoard, nextPlayerId, nextPlayerName, nextMove, gameWinner, gameWinnerID }) => {
            setShowConfetti(false);
            setBoard(newBoard);
            setIsNext(nextPlayerId === socket.id);
            setWinner(gameWinner);
            setNextPlayerName(nextPlayerName);
            setNextMove(nextMove);


            if (gameWinner) {

                if (gameWinner === "Tie") {
                    loseSoundRef.current.play();
                    // window.alert("It's a tie!");
                } else if (gameWinnerID === socket.id) {
                    winSoundRef.current.play();
                    setShowConfetti(true);
                    console.log("showconffeti", showConfetti);
                    // window.alert(`Winner: ${gameWinner}`);
                } else {
                    setIsNext(true);
                    loseSoundRef.current.play();
                    // window.alert(`Winner: ${gameWinner}`);
                }
            }
        });

        return () => {
            socket.off('GameInitialized');
            socket.off('gameUpdate');
        };
    }, [roomCode, playerName]);

    useEffect(() => {
        boardColourUpdate();
    }, [isNext]);

    const boardColourUpdate = () => {
        const boardElement = document.querySelector('.board');
        if (boardElement) {
            if (winner) {
                boardElement.style.opacity = '0.5';

            }
            else {
                boardElement.style.opacity = isNext ? '1' : '0.5';
            }
        }
    };

    const handleClick = (index) => {
        if (board[index] || winner || !isNext) {
            return;
        }
        clickSoundRef.current.play();
        const newBoard = board.slice();
        newBoard[index] = nextMove;
        const gameWinner = calculateWinner(newBoard) || (!newBoard.includes(null) ? "Tie" : null);

        socket.emit('makeMove', { nextMove, roomCode, newBoard, gameWinner });
    };

    const renderSquare = (index) => {
        return (
            <button className="square" onClick={() => handleClick(index)}>
                {board[index]}
            </button>
        );
    };

    const calculateWinner = (squares) => {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    const resetGame = () => {
        const newBoard = Array(9).fill(null);
        setBoard(newBoard);
        setIsNext(null);
        setWinner(null);
        setShowConfetti(false);
        chatClickSoundRef.current.play();
        socket.emit('resetGame', { roomCode, newBoard });
    };

    return (

        <div className="tic-tac-toe">
            <h1>Tic Tac Toe</h1>
            {console.log(showConfetti)}
            {showConfetti && <Confetti />}
            <div className="board">

                <div className="row">
                    {renderSquare(0)}
                    {renderSquare(1)}
                    {renderSquare(2)}
                </div>
                <div className="row">
                    {renderSquare(3)}
                    {renderSquare(4)}
                    {renderSquare(5)}
                </div>
                <div className="row">
                    {renderSquare(6)}
                    {renderSquare(7)}
                    {renderSquare(8)}
                </div>
            </div>
            <div style={{ textAlign: 'center' }} className="info">
                {console.log("isnexxtt", isNext)}
                {winner
                    ? (winner === "Tie"
                        ? <p>Game Tied</p>
                        : <p>{isNext ? `You LOST` : `You WON (${winner})`}</p>
                    )
                    : <p>{isNext ? "Your Turn" : `Opponent's Turn - ${nextPlayerName}`} ({nextMove})</p>
                }
                <button onClick={resetGame}>Reset Game</button>
            </div>
        </div>
    );
};

export default TicTacToe;
