"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import createOdaService from "../services/odaService";
import createOracleSpeechService from "../services/oracleSpeechService";
import createSpeechService from "../services/speechService";
import { createUserMessage } from "../utils/messageUtils";
import { useProject } from "./ProjectsContext";

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

const createSpeechServiceFactory = (speechProvider) => {
  switch (speechProvider) {
    case "oracle":
      return createOracleSpeechService();
    case "browser":
    default:
      return createSpeechService();
  }
};

export const ChatProvider = ({ children }) => {
  const { getCurrentProject } = useProject();
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [odaService, setOdaService] = useState(null);
  const [speechService, setSpeechService] = useState(null);
  const [currentSpeechProvider, setCurrentSpeechProvider] = useState("browser");
  const [playingMessageId, setPlayingMessageId] = useState(null);

  useEffect(() => {
    const storedUserId =
      typeof window !== "undefined"
        ? window.localStorage.getItem("chatUserId")
        : null;

    const newUserId =
      storedUserId || `user${Math.random().toString(36).substring(2, 10)}`;

    setUserId(newUserId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("chatUserId", newUserId);
    }
  }, []);

  useEffect(() => {
    switch (connectionStatus) {
      case 0:
        setConnected(false);
        setLoading(true);
        break;
      case 1:
        setConnected(true);
        setLoading(false);
        setError("");
        break;
      case 2:
        setConnected(false);
        break;
      case 3:
        setConnected(false);
        setLoading(false);
        break;
      default:
        break;
    }
  }, [connectionStatus]);

  useEffect(() => {
    const currentProject = getCurrentProject();
    const provider = currentProject.speechProvider || "browser";

    if (currentSpeechProvider !== provider) {
      setSpeechService(createSpeechServiceFactory(provider));
      setCurrentSpeechProvider(provider);

      setMessages([]);
      setIsWaitingForResponse(false);
    }
  }, [getCurrentProject, currentSpeechProvider]);

  useEffect(() => {
    if (!userId) return;

    const handleMessage = (data) => {
      console.log("🎯 [Chat] Mensaje procesado:", {
        data,
        hasPayload: !!data?.messagePayload,
        source: data?.source,
        endOfTurn: data?.endOfTurn,
        messageText: data?.messagePayload?.text,
        messageType: data?.messagePayload?.type,
      });

      if (data && data.source === "BOT" && data.messagePayload) {
        if (
          data.endOfTurn &&
          data.messagePayload.text &&
          data.messagePayload.text.trim()
        ) {
          console.log("✅ [Chat] Añadiendo mensaje al estado");
          setIsWaitingForResponse(false);

          setMessages((prev) => [
            ...prev,
            {
              ...data,
              userId: userId,
              from: { type: "bot" },
            },
          ]);
        } else {
          console.log("⚠️ [Chat] Mensaje no cumple condiciones:", {
            endOfTurn: data.endOfTurn,
            hasText: !!data.messagePayload?.text,
            textTrimmed: data.messagePayload?.text?.trim(),
          });
        }
      } else {
        console.log("⚠️ [Chat] Mensaje descartado:", {
          hasData: !!data,
          source: data?.source,
          hasPayload: !!data?.messagePayload,
        });
      }
    };

    const service = createOdaService();

    service.addMessageListener(handleMessage);
    service.addStatusChangeListener(setConnectionStatus);

    const sdk = service.initialize({ userId });
    if (sdk) {
      setOdaService(service);
      service.connect();
    }

    return () => {
      if (service) {
        service.disconnect();
      }
    };
  }, [userId]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage.from?.type === "bot" &&
      currentSpeechProvider === "oracle" &&
      isListening &&
      odaService?.speakMessage
    ) {
      if (odaService.cancelAudio) {
        odaService.cancelAudio();
      }
      odaService.speakMessage(lastMessage);
    }
  }, [messages, currentSpeechProvider, isListening, odaService]);

  const sendMessage = useCallback(
    (text) => {
      if (!text.trim() || !connected || !odaService) return false;

      const message = createUserMessage(text, userId);

      setMessages((prev) => [...prev, message]);
      setIsWaitingForResponse(true);

      return odaService.sendMessage(message);
    },
    [connected, userId, odaService]
  );

  const sendAttachment = useCallback(
    async (file) => {
      if (!file || !connected || !odaService) return false;

      try {
        const attachmentMessage = {
          userId: userId,
          messagePayload: {
            type: "attachment",
            attachment: {
              type: file.type,
              title: file.name,
              url: URL.createObjectURL(file), // Para preview local
            },
          },
          date: new Date().toISOString(),
          from: null, // null = usuario
        };

        setMessages((prev) => [...prev, attachmentMessage]);

        await odaService.sendAttachment(file);
        return true;
      } catch (error) {
        setError(`Failed to send attachment: ${error.message}`);
        return false;
      }
    },
    [connected, userId, odaService]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsWaitingForResponse(false);
  }, []);

  const toggleSpeechRecognition = useCallback(() => {
    if (!speechService || !speechService.isSupported()) {
      setError("Speech recognition is not supported");
      return;
    }

    if (isListening) {
      if (speechService.stopListening) {
        speechService.stopListening();
      } else if (speechService.stopRecording) {
        speechService.stopRecording();
      }
      setIsListening(false);
      return;
    }

    let started = false;

    if (currentSpeechProvider === "oracle") {
      started = speechService.startRecording(
        (result) => {
          if (result.isFinal && result.transcript) {
            sendMessage(result.transcript);
          }
        },
        (error) => {
          setIsListening(false);
          setError(`Speech recognition error: ${error}`);
        }
      );
    } else {
      started = speechService.startListening(
        (result) => {
          if (result.stopped) {
            setIsListening(false);
            return;
          }

          if (result.isFinal || result.stopped) {
            setIsListening(false);
            if (result.transcript) {
              sendMessage(result.transcript);
            }
          }
        },
        (error) => {
          setIsListening(false);
          setError(`Speech recognition error: ${error}`);
        }
      );
    }

    setIsListening(started);
  }, [isListening, sendMessage, speechService, currentSpeechProvider]);

  useEffect(() => {
    if (!speechService) {
      setSpeechService(createSpeechServiceFactory("browser"));
    }
  }, [speechService]);

  const value = {
    messages,
    connected,
    loading,
    error,
    isListening,
    isWaitingForResponse,
    userId,
    sendMessage,
    sendAttachment,
    clearChat,
    toggleSpeechRecognition,
    setError,
    currentSpeechProvider,
    speakMessage: odaService?.speakMessage || (() => false),
    cancelAudio: () => {
      if (odaService?.cancelAudio) {
        odaService.cancelAudio();
      }
      setPlayingMessageId(null);
    },
    playingMessageId,
    setPlayingMessageId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
