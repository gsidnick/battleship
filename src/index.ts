import WebSocket from 'ws';
import PlayerWebSocket from './websocket';
import { httpServer } from './http_server/index.js';
import { registration, login } from './controllers/playerController';
import { createRoom, updateRoom, removeRoom, addUserToRoom, getRoomPlayers } from './controllers/roomController';
import { setWinner, updateWinners } from './controllers/winnerController';
import {
  createGame,
  addShipsToGame,
  getShipsFromGame,
  startGame,
  getOpponent,
  moveTurn,
  getAttackResult,
  getAttackFeedback,
  getGame,
  getRandomShot,
  finishGame,
  checkWinner,
} from './controllers/gameController';
import { addClient, removeClient, sendToAllClients, sendToSpecifyClients } from './controllers/clientController';
import { makeBotAttack, playGameWithBot, startGameWithBot } from './controllers/botController';
import { Response, PlayerResponse, Rooms, Winners, Coordinate } from './types.js';
import { parseRequest, stringifyResponse } from './utils';
import { isPlayerExist } from './db';

const HTTP_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocket.Server({ server: httpServer });

let withBot = false;

wss.on('connection', (ws: PlayerWebSocket) => {
  ws.on('close', () => {
    if (ws.player) {
      removeClient(ws.player.index);
      withBot = false;
    }
  });

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

        if (!auth.data.error) {
          addClient(ws);
          const rooms: Response<Rooms> = updateRoom();
          const winners: Response<Winners> = updateWinners();
          sendToAllClients(rooms);
          sendToAllClients(winners);
        }
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

        if (withBot) {
          const player = playersInGame.find((item) => item.indexPlayer === ws.player.index);
          if (player) {
            startGameWithBot(ws, player);
            const turn = moveTurn(data.gameId, ws.player.index);
            sendToSpecifyClients(turn, [player.indexPlayer]);
          }
          break;
        }

        if (playersInGame.length === 2) {
          startGame(playersInGame);
          const playersId = playersInGame.map((player) => player.indexPlayer);
          const turn = moveTurn(data.gameId, ws.player.index);
          sendToSpecifyClients(turn, playersId);
        }
        break;
      }

      case 'attack': {
        const game = getGame(data.gameId);

        if (withBot) {
          if (game.currentPlayer === ws.player.index) {
            const shot: Coordinate = { x: data.x, y: data.y };
            const playersInGame = getShipsFromGame(data.gameId);
            const opponent = getOpponent(data.indexPlayer, playersInGame);
            const status = getAttackResult(shot, opponent);

            if (status) {
              const feedback = getAttackFeedback(status, shot, ws.player.index);
              sendToSpecifyClients(feedback, [ws.player.index]);
            }

            const isWinner = checkWinner(opponent.map);

            if (isWinner) {
              const winnerResponse = finishGame(ws.player.index);
              sendToSpecifyClients(winnerResponse, [ws.player.index]);
              setWinner(ws.player.name);
              const winners: Response<Winners> = updateWinners();
              sendToAllClients(winners);
            }

            const turn = moveTurn(data.gameId, 0);
            sendToSpecifyClients(turn, [ws.player.index]);

            const timeout = setTimeout(() => {
              makeBotAttack(ws, data.gameId);
              clearTimeout(timeout);
            }, 3000);
          }
          break;
        }

        if (game.currentPlayer === data.indexPlayer) {
          const shot: Coordinate = { x: data.x, y: data.y };
          const playersInGame = getShipsFromGame(data.gameId);
          const opponent = getOpponent(data.indexPlayer, playersInGame);
          const playersId = [data.indexPlayer, opponent.indexPlayer];
          const status = getAttackResult(shot, opponent);

          if (status) {
            const feedback = getAttackFeedback(status, shot, ws.player.index);
            sendToSpecifyClients(feedback, playersId);
          }

          const isWinner = checkWinner(opponent.map);

          if (isWinner) {
            const winnerResponse = finishGame(ws.player.index);
            sendToSpecifyClients(winnerResponse, playersId);
            setWinner(ws.player.name);
            const winners: Response<Winners> = updateWinners();
            sendToAllClients(winners);
          }

          const turn = moveTurn(game.gameId, opponent.indexPlayer);
          sendToSpecifyClients(turn, playersId);
        }

        break;
      }

      case 'randomAttack': {
        const playersInGame = getShipsFromGame(data.gameId);
        const opponent = getOpponent(data.indexPlayer, playersInGame);
        const shot: Coordinate = getRandomShot(opponent.map);
        const playersId = [data.indexPlayer, opponent.indexPlayer];
        const status = getAttackResult(shot, opponent);

        if (status) {
          const feedback = getAttackFeedback(status, shot, ws.player.index);
          sendToSpecifyClients(feedback, playersId);
        }

        const isWinner = checkWinner(opponent.map);

        if (isWinner) {
          const winnerResponse = finishGame(ws.player.index);
          sendToSpecifyClients(winnerResponse, playersId);
          const winners: Response<Winners> = updateWinners();
          sendToAllClients(winners);
          break;
        }

        const turn = moveTurn(data.gameId, opponent.indexPlayer);
        sendToSpecifyClients(turn, playersId);

        if (withBot) {
          const timeout = setTimeout(() => {
            makeBotAttack(ws, data.gameId);
            clearTimeout(timeout);
          }, 3000);
        }

        break;
      }

      case 'single_play': {
        withBot = true;
        playGameWithBot(ws);
        break;
      }

      default:
        console.log(`Type: ${type}`);
        console.log(`Data: ${data}`);
    }
  });
});
