import WebSocket from 'ws';
import PlayerWebSocket from './websocket';
import { httpServer } from './http_server/index.js';
import { registration, login } from './controllers/playerController';
import { createRoom, updateRoom, removeRoom, addUserToRoom, getRoomPlayers } from './controllers/roomController';
import { updateWinners } from './controllers/winnerController';
import {
  createGame,
  addShipsToGame,
  getShipsFromGame,
  startGame,
  getOpponent,
  moveTurn,
  getAttackResult,
  getAttackFeedback,
} from './controllers/gameController';
import { addClient, sendToAllClients, sendToSpecifyClients } from './controllers/clientController';
import { Response, PlayerResponse, Rooms, Winners, Coordinate } from './types.js';
import { parseRequest, stringifyResponse } from './utils';
import { isPlayerExist } from './db';

const HTTP_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws: PlayerWebSocket) => {
  ws.on('message', (message) => {
    const { type, data } = parseRequest(message);

    switch (type) {
      case 'reg': {
        let auth: Response<PlayerResponse>;

        if (isPlayerExist(data.name)) {
          auth = login(data);
        } else {
          auth = registration(data);
        }
        // eslint-disable-next-line no-param-reassign
        ws.player = {
          index: auth.data.index,
          name: auth.data.name,
        };
        ws.send(stringifyResponse(auth));

        addClient(ws);

        const rooms: Response<Rooms> = updateRoom();
        const winners: Response<Winners> = updateWinners();

        sendToAllClients(rooms);
        sendToAllClients(winners);
        break;
      }

      case 'create_room': {
        createRoom(ws.player);
        const rooms = updateRoom();
        wss.clients.forEach((client) => client.send(stringifyResponse(rooms)));
        break;
      }

      case 'add_user_to_room': {
        const players = getRoomPlayers(data.indexRoom);
        const isPlayerInRoom = players.find((player) => player.index === ws.player.index);

        if (!isPlayerInRoom) {
          addUserToRoom(ws.player, data.indexRoom);
        }

        if (players.length === 2) {
          removeRoom(data.indexRoom);
          createGame(players);
        }

        const rooms = updateRoom();
        sendToAllClients(rooms);
        break;
      }

      case 'add_ships': {
        addShipsToGame(data, ws.player.index);
        const playersInGame = getShipsFromGame(data.gameId);

        if (playersInGame.length === 2) {
          startGame(playersInGame);
          const playersId = playersInGame.map((player) => player.indexPlayer);
          const turn = moveTurn(ws.player.index);
          sendToSpecifyClients(turn, playersId);
        }
        break;
      }

      case 'attack': {
        const shot: Coordinate = { x: data.x, y: data.y };
        const playersInGame = getShipsFromGame(data.gameId);
        const opponent = getOpponent(data.indexPlayer, playersInGame);
        const playersId = [data.indexPlayer, opponent.indexPlayer];
        const status = getAttackResult(shot, opponent);

        if (status) {
          const feedback = getAttackFeedback(status, shot, ws.player.index);
          sendToSpecifyClients(feedback, playersId);
        }

        const turn = moveTurn(opponent.indexPlayer);
        sendToSpecifyClients(turn, playersId);
        break;
      }

      case 'randomAttack': {
        const playersInGame = getShipsFromGame(data.gameId);
        const opponent = getOpponent(data.indexPlayer, playersInGame);
        const turn = moveTurn(opponent.indexPlayer);
        const playersId = [data.indexPlayer, opponent.indexPlayer];
        sendToSpecifyClients(turn, playersId);
        break;
      }

      default:
        console.log(`Type: ${type}`);
        console.log(`Data: ${data}`);
    }
  });
});
