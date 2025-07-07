// src/app/services/odaService.js

"use client";

const createOdaService = () => {
  let sdk = null;
  let messageListeners = [];
  let statusChangeListeners = [];

  const initialize = ({ userId }) => {
    if (typeof window === "undefined") return null;
    if (!window.WebSDK) {
      console.error(
        "WebSDK not found. Make sure web-sdk.js is included in your project."
      );
      return null;
    }

    try {
      const channelId = process.env.NEXT_PUBLIC_ODA_CHANNEL_ID;
      const uri = process.env.NEXT_PUBLIC_ODA_URI;

      if (!channelId || !uri) {
        console.error("Missing ODA configuration");
        return null;
      }

      const chatSettings = {
        URI: uri,
        channelId: channelId,
        userId: userId,
        enableAutocomplete: true,
        enableBotAudioResponse: false,
        enableClearMessage: false,
        enableSpeech: false,
        showConnectionStatus: false,
        openChatOnLoad: false,
        clientAuthEnabled: false,
        enableHeadless: true,
        isDebugMode: true,
        enableBotAudioResponse: true,
        enableAttachment: true,
        shareMenuItems: ["visual", "file", "audio"],
        delegate: {
          beforeDisplay: (message) => {
            console.log("📨 [ODA] Mensaje recibido (beforeDisplay):", {
              message,
              messageType: message?.messagePayload?.type,
              source: message?.source,
              endOfTurn: message?.endOfTurn,
              text: message?.messagePayload?.text,
            });
            // Notify listeners about new message
            messageListeners.forEach((listener) => listener(message));
            return message;
          },
          beforeSend: (message) => {
            return message;
          },
          beforePostbackSend: (postback) => {
            return postback;
          },
        },
      };

      // Initialize SDK in headless mode
      sdk = new window.WebSDK(chatSettings);
      console.log("✅ [ODA] SDK inicializado:", {
        channelId,
        uri,
        userId,
        settings: chatSettings,
      });
      return sdk;
    } catch (error) {
      console.error("Error initializing ODA SDK:", error);
      return null;
    }
  };

  const addMessageListener = (listener) => {
    messageListeners.push(listener);
  };

  const addStatusChangeListener = (listener) => {
    statusChangeListeners.push(listener);
    // If SDK already initialized, set up status change event
    if (sdk) {
      sdk.on("networkstatuschange", (status) => {
        listener(status);
      });
    }
  };

  const sendMessage = (message) => {
    if (!sdk) return false;

    try {
      // Extract the text from our message format and send it through the SDK
      const text = message.messagePayload.text;
      console.log("📤 [ODA] Enviando mensaje:", {
        originalMessage: message,
        extractedText: text,
        sdkConnected: sdk.isConnected(),
      });
      sdk.sendMessage(text);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  const connect = () => {
    if (sdk) {
      sdk
        .connect()
        .then(() => {
          console.log("Connected to ODA");
          statusChangeListeners.forEach((listener) => listener(1)); // 1 = WebSocket.OPEN
        })
        .catch((err) => {
          console.error("Failed to connect to ODA:", err);
          statusChangeListeners.forEach((listener) => listener(3)); // 3 = WebSocket.CLOSED
        });
      return true;
    }
    return false;
  };

  const disconnect = () => {
    if (sdk) {
      sdk.disconnect();
      sdk = null;
    }
  };

  const speakMessage = (message) => {
    if (sdk && sdk.speakTTS) {
      sdk.speakTTS(message);
      return true;
    }
    return false;
  };

  return {
    initialize,
    connect,
    addMessageListener,
    addStatusChangeListener,
    sendMessage,
    disconnect,
    isConnected: () => sdk && sdk.isConnected(),
    speakMessage,
    cancelAudio: () => {
      if (sdk && sdk.cancelTTS) {
        sdk.cancelTTS();
        return true;
      }
      return false;
    },
    sendAttachment: (file) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.sendAttachment(file);
    },
  };
};

export default createOdaService;
