import WebSocket from 'ws';
import PlayerWebSocket from './websocket';
import { httpServer } from './http_server/index.js';
import { parseRequest, stringifyResponse } from './utils';
import {
  registration,
  login,
  createRoom,
  updateRoom,
  updateWinners,
  createGame,
  removeRoom,
  addClient,
  sendToAllClients,
} from './controller';
import { isPlayerExist } from './db';
import { Response, PlayerResponse, Rooms, Winners } from './types.js';

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
        removeRoom(data.indexRoom);
        const rooms = updateRoom();
        const game = createGame(ws.player.index);

        sendToAllClients(rooms);
        sendToAllClients(game);
        break;
      }

      default:
        console.log(`Type: ${type}`);
        console.log(`Data: ${data}`);
    }
  });
});
