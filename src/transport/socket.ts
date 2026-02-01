/**
 * Module de transport WebSocket pour communiquer avec le moteur CodeIA
 */

import WebSocket from 'ws';
import * as vscode from 'vscode';
import { IEngineSocket, CodeIAEvent, ControlMessage } from '../types';

export class EngineSocket implements IEngineSocket {
  private ws: WebSocket.WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageQueue: (CodeIAEvent | ControlMessage)[] = [];
  private isConnecting = false;
  private messageListeners: Array<(message: unknown) => void> = [];

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Établit la connexion WebSocket
   */
  connect(): void {
    if (this.isConnected() || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new (WebSocket as any)(this.url);

      if (!this.ws) {
        throw new Error('Failed to create WebSocket');
      }

      this.ws.on('open', () => {
        console.log(`[CodeIA] Connecté à ${this.url}`);
        this.reconnectAttempts = 0;
        this.isConnecting = false;

        // Vider la queue des messages en attente
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          if (message) {
            this.send(message);
          }
        }

        // Notifier la connexion
        this.notifyConnected();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.notifyListeners(message);
        } catch (error) {
          console.error('[CodeIA] Erreur parsing message:', error);
        }
      });

      this.ws.on('error', (error: Error) => {
        console.error('[CodeIA] Erreur WebSocket:', error.message);
        this.notifyError(error);
      });

      this.ws.on('close', () => {
        console.log('[CodeIA] Déconnecté');
        this.ws = null;
        this.isConnecting = false;
        this.attemptReconnect();
      });
    } catch (error) {
      console.error('[CodeIA] Erreur connexion:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Tente une reconnexion avec backoff exponentiel
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[CodeIA] Tentative reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('[CodeIA] Reconnexions échouées, abandon');
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }

  /**
   * Envoie un événement au serveur
   */
  send(event: CodeIAEvent | ControlMessage): void {
    // Si la connexion n'est pas établie, mettre en queue
    if (!this.isConnected()) {
      if (this.messageQueue.length < 1000) {
        this.messageQueue.push(event);
      }
      return;
    }

    try {
      const payload = {
        ...event,
        timestamp: Date.now(),
        workspaceFolder: vscode.workspace.rootPath || 'unknown'
      };
      if (this.ws) {
        this.ws.send(JSON.stringify(payload));
      }
    } catch (error) {
      console.error('[CodeIA] Erreur envoi message:', error);
    }
  }

  /**
   * Enregistre un listener pour les messages entrants
   */
  onMessage(callback: (message: unknown) => void): void {
    this.messageListeners.push(callback);
  }

  /**
   * Vérifie si la connexion est active
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Retourne l'URL du serveur
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Notifie les listeners des messages reçus
   */
  private notifyListeners(message: unknown): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('[CodeIA] Erreur dans listener:', error);
      }
    });
  }

  /**
   * Notifie la connexion établie
   */
  private notifyConnected(): void {
    this.notifyListeners({
      type: 'connection',
      status: 'connected',
      timestamp: Date.now()
    });
  }

  /**
   * Notifie une erreur de connexion
   */
  private notifyError(error: Error): void {
    this.notifyListeners({
      type: 'connection',
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    });
  }
}
