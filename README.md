# GameVo

GameVo is a web-based application that combines gaming and real-time chat functionality. The application allows users to create or join game rooms, play games, and chat with other participants in the room.

## Deployed Link
[https://gamevo.onrender.com](https://gamevo.onrender.com)

## Features

- Real-time chat with other users in the game room.
- Create a new game room and share the room code.
- Join an existing game room using a room code.
- Play games with other users in the room.
- Background music and sound effects for enhanced user experience.

## Tech Stack

- **Frontend**: React, React Router, Socket.io-client, Styled-components, MUI
- **Backend**: Express, Socket.io
- **Styling**: CSS
- **Other Libraries**: Lottie-react for animations, Concurrently for running backend and frontend simultaneously (optional)

## Getting Started

### Prerequisites

Make sure you have the following installed on your local machine:

- Node.js (v12.x or higher)
- npm (v6.x or higher)

### Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/Nachi28/Gamevo.git
    cd Gamevo
    ```

2. **Install dependencies**:

    For the backend:

    ```bash
    cd server
    npm install
    ```

    For the frontend:

    ```bash
    cd ../client
    npm install
    ```

### Running the Application

1. **Start the backend server**:

    ```bash
    cd server
    npm run start:backend
    ```

2. **Start the frontend application**:

    ```bash
    cd ../client
    npm start
    ```

3. **Run both frontend and backend concurrently** (optional):

    ```bash
    cd server
    npm start
    ```

### Usage

1. **Creating a Room**:
    - Enter your name and click on the "Create Room" button.
    - A room code will be generated and copied to your clipboard.
    - Share this room code with other participants.

2. **Joining a Room**:
    - Enter your name and the room code you received.
    - Click on the "Join Room" button to enter the room.

3. **Chatting and Gaming**:
    - Use the chat interface to send messages to other users in the room.
    - Play the game using the provided game board.

### Project Structure

    ├── client                   # Frontend application
    │   ├── public               # Public assets
    │   ├── src                  # Source files
    │   ├── package.json         # Frontend dependencies and scripts
    ├── server                   # Backend application
    │   ├── server.js            # Main server file
    │   ├── package.json         # Backend dependencies and scripts
    ├── README.md                # Project overview and setup instructions

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes.

## License

This project is licensed under the MIT License.

