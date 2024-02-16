import WebSocket from 'ws';
import { httpServer } from './http_server/index.js';
import { parseRequest, stringifyResponse } from './utils';
import { registration, login } from './controller';
import { isPlayerExist } from './db';
import { Response, PlayerResponse } from './types.js';

const HTTP_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws) => {
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

        ws.send(stringifyResponse(response));
        break;
      }

      default:
        console.log(`Type: ${type}`);
        console.log(`Data: ${data}`);
    }
  });
});
