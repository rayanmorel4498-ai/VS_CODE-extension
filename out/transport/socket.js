"use strict";
/**
 * Module de transport WebSocket pour communiquer avec le moteur CodeIA
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineSocket = void 0;
const ws_1 = __importDefault(require("ws"));
const vscode = __importStar(require("vscode"));
class EngineSocket {
    constructor(url) {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageQueue = [];
        this.isConnecting = false;
        this.messageListeners = [];
        this.url = url;
    }
    /**
     * Établit la connexion WebSocket
     */
    connect() {
        if (this.isConnected() || this.isConnecting) {
            return;
        }
        this.isConnecting = true;
        try {
            this.ws = new ws_1.default(this.url);
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
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.notifyListeners(message);
                }
                catch (error) {
                    console.error('[CodeIA] Erreur parsing message:', error);
                }
            });
            this.ws.on('error', (error) => {
                console.error('[CodeIA] Erreur WebSocket:', error.message);
                this.notifyError(error);
            });
            this.ws.on('close', () => {
                console.log('[CodeIA] Déconnecté');
                this.ws = null;
                this.isConnecting = false;
                this.attemptReconnect();
            });
        }
        catch (error) {
            console.error('[CodeIA] Erreur connexion:', error);
            this.isConnecting = false;
            this.attemptReconnect();
        }
    }
    /**
     * Tente une reconnexion avec backoff exponentiel
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`[CodeIA] Tentative reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);
            setTimeout(() => this.connect(), delay);
        }
        else {
            console.error('[CodeIA] Reconnexions échouées, abandon');
        }
    }
    /**
     * Ferme la connexion WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnecting = false;
    }
    /**
     * Envoie un événement au serveur
     */
    send(event) {
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
        }
        catch (error) {
            console.error('[CodeIA] Erreur envoi message:', error);
        }
    }
    /**
     * Enregistre un listener pour les messages entrants
     */
    onMessage(callback) {
        this.messageListeners.push(callback);
    }
    /**
     * Vérifie si la connexion est active
     */
    isConnected() {
        return this.ws !== null && this.ws.readyState === ws_1.default.OPEN;
    }
    /**
     * Retourne l'URL du serveur
     */
    getUrl() {
        return this.url;
    }
    /**
     * Notifie les listeners des messages reçus
     */
    notifyListeners(message) {
        this.messageListeners.forEach(listener => {
            try {
                listener(message);
            }
            catch (error) {
                console.error('[CodeIA] Erreur dans listener:', error);
            }
        });
    }
    /**
     * Notifie la connexion établie
     */
    notifyConnected() {
        this.notifyListeners({
            type: 'connection',
            status: 'connected',
            timestamp: Date.now()
        });
    }
    /**
     * Notifie une erreur de connexion
     */
    notifyError(error) {
        this.notifyListeners({
            type: 'connection',
            status: 'error',
            error: error.message,
            timestamp: Date.now()
        });
    }
}
exports.EngineSocket = EngineSocket;
//# sourceMappingURL=socket.js.map