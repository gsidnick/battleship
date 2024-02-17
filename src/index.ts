import WebSocket from 'ws';
import PlayerWebSocket from './websocket';
import { httpServer } from './http_server/index.js';
import { parseRequest, stringifyResponse } from './utils';
import { registration, login, createRoom, updateRoom } from './controller';
import { isPlayerExist } from './db';
import { Response, PlayerResponse } from './types.js';

const HTTP_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws: PlayerWebSocket) => {
  ws.on('message', (message) => {
    const { type, data } = parseRequest(message);

    switch (type) {
      case 'reg': {
        let response: Response<PlayerResponse>;

        if (isPlayerExist(data.name)) {
          response = login(data);
        } else {
          response = registration(data);
        }
        // eslint-disable-next-line no-param-reassign
        ws.player = {
          index: response.data.index,
          name: response.data.name,
        };
        ws.send(stringifyResponse(response));
        break;
      }

      case 'create_room': {
        createRoom(ws.player);
        const response = updateRoom();
        wss.clients.forEach((client) => client.send(stringifyResponse(response)));
        break;
      }

      default:
        console.log(`Type: ${type}`);
        console.log(`Data: ${data}`);
    }
  });
});
