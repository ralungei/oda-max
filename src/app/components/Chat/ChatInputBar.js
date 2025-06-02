"use client";

import { Box, IconButton, Stack, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Forward, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ChatInputBar({
  onSendMessage,
  onToggleSpeechRecognition,
  isConnected,
  isListening,
  isPreview,
  currentSpeechProvider,
}) {
  const [input, setInput] = useState("");
  const [audioLevels, setAudioLevels] = useState([0, 0, 0, 0, 0]);
  const inputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const theme = useTheme();

  const handleSendMessage = () => {
    if (!input.trim() || !isConnected) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isOracleListening = currentSpeechProvider === "oracle" && isListening;

  useEffect(() => {
    if (isOracleListening) {
      const startAudioAnalysis = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: 16000, channelCount: 1 },
          });

          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();

          const source =
            audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);

          analyserRef.current.fftSize = 256;
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateLevels = () => {
            analyserRef.current.getByteFrequencyData(dataArray);

            const newLevels = [];
            const segmentSize = Math.floor(bufferLength / 5);

            for (let i = 0; i < 5; i++) {
              const start = i * segmentSize;
              const end = start + segmentSize;
              let sum = 0;

              for (let j = start; j < end; j++) {
                sum += dataArray[j];
              }

              const average = sum / segmentSize;
              const normalized = Math.min(average / 80, 3);
              newLevels.push(normalized);
            }

            setAudioLevels(newLevels);
            animationFrameRef.current = requestAnimationFrame(updateLevels);
          };

          updateLevels();
        } catch (error) {
          console.error("Error accessing microphone:", error);
        }
      };

      startAudioAnalysis();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioLevels([0, 0, 0, 0, 0]);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, [isOracleListening]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <motion.div
        layout
        style={{
          borderRadius: 24,
          backgroundColor: "white",
          boxShadow: "0 8px 24px -8px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: 4,
          display: "flex",
          alignItems: "center",
          width: isOracleListening ? "auto" : "100%",
          maxWidth: "md",
          minHeight: 47,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        {!isOracleListening && (
          <TextField
            autoFocus
            size="small"
            fullWidth
            variant="standard"
            placeholder="Start with a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || isListening}
            multiline
            maxRows={4}
            InputProps={{
              disableUnderline: true,
              inputRef: inputRef,
              sx: {
                color: theme.palette.text.primary,
                "::placeholder": {
                  color: theme.palette.text.secondary,
                },
              },
            }}
            sx={{ px: 2, py: 0.5 }}
          />
        )}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            onClick={onToggleSpeechRecognition}
            disabled={!isConnected}
            title={isListening ? "Stop recording" : "Start voice recording"}
            sx={{
              color: isListening
                ? "white" // Cambio: icono blanco cuando está grabando
                : theme.palette.text.secondary,
              backgroundColor: isListening
                ? theme.palette.error.main // Nuevo: fondo rojo cuando está grabando
                : "transparent",
              "&:hover": {
                backgroundColor: isListening
                  ? theme.palette.error.dark // Cambio: hover más oscuro cuando está grabando
                  : theme.palette.primary.main + "14",
              },
              "&:disabled": {
                color: theme.palette.text.disabled,
              },
            }}
          >
            {isOracleListening ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1px",
                  width: 18,
                  height: 18,
                  overflow: "hidden",
                }}
              >
                {[2, 1, 0, 1, 2].map((position, index) => (
                  <motion.div
                    key={index}
                    style={{
                      width: 2,
                      backgroundColor: "white",
                      borderRadius: 1,
                      height: 4 + audioLevels[position] * 10,
                    }}
                    animate={{
                      height: 4 + audioLevels[position] * 10,
                    }}
                    transition={{
                      duration: 0.1,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Mic size={18} />
            )}
          </IconButton>
          {!isOracleListening && (
            <IconButton
              onClick={handleSendMessage}
              disabled={!isPreview && (!isConnected || !input.trim())}
              title="Send message"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
                "&:disabled": {
                  backgroundColor: theme.palette.action.disabled,
                  color: theme.palette.action.disabledBackground,
                },
              }}
            >
              <Forward
                size={16}
                style={{ paddingBottom: 2.5, paddingLeft: 2 }}
              />
            </IconButton>
          )}
        </Stack>
      </motion.div>
    </Box>
  );
}
