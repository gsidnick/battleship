import WebSocket from 'ws';
import PlayerWebSocket from './websocket';
import { httpServer } from './http_server/index.js';
import { registration, login } from './controllers/playerController';
import { createRoom, updateRoom, removeRoom, addUserToRoom, getRoomPlayers } from './controllers/roomController';
import { updateWinners } from './controllers/winnerController';
import { createGame, addShipsToGame, getShipsFromGame, startGame, getAttackResult } from './controllers/gameController';
import { addClient, sendToAllClients, sendToSpecifyClients } from './controllers/clientController';
import { Response, PlayerResponse, Rooms, Winners } from './types.js';
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
        addUserToRoom(ws.player, data.indexRoom);

        const players = getRoomPlayers(data.indexRoom);

        removeRoom(data.indexRoom);

        const game = createGame(ws.player.index);
        const rooms = updateRoom();

        sendToSpecifyClients(game, players);
        sendToAllClients(rooms);
        break;
      }

      case 'add_ships': {
        addShipsToGame(data, ws.player.index);
        const playersInGame = getShipsFromGame(data.gameId);

        if (playersInGame.length === 2) {
          startGame(playersInGame);
        }
        break;
      }

      case 'attack': {
        getAttackResult(data);
        break;
      }

      default:
        console.log(`Type: ${type}`);
        console.log(`Data: ${data}`);
    }
  });
});
