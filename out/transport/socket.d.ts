/**
 * Module de transport WebSocket pour communiquer avec le moteur CodeIA
 */
import { IEngineSocket, CodeIAEvent, ControlMessage } from '../types';
export declare class EngineSocket implements IEngineSocket {
    private ws;
    private url;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private messageQueue;
    private isConnecting;
    private messageListeners;
    constructor(url: string);
    /**
     * Établit la connexion WebSocket
     */
    connect(): void;
    /**
     * Tente une reconnexion avec backoff exponentiel
     */
    private attemptReconnect;
    /**
     * Ferme la connexion WebSocket
     */
    disconnect(): void;
    /**
     * Envoie un événement au serveur
     */
    send(event: CodeIAEvent | ControlMessage): void;
    /**
     * Enregistre un listener pour les messages entrants
     */
    onMessage(callback: (message: unknown) => void): void;
    /**
     * Vérifie si la connexion est active
     */
    isConnected(): boolean;
    /**
     * Retourne l'URL du serveur
     */
    getUrl(): string;
    /**
     * Notifie les listeners des messages reçus
     */
    private notifyListeners;
    /**
     * Notifie la connexion établie
     */
    private notifyConnected;
    /**
     * Notifie une erreur de connexion
     */
    private notifyError;
}
//# sourceMappingURL=socket.d.ts.map