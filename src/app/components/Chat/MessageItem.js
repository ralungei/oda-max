"use client";

import { Person, PlayArrow } from "@mui/icons-material";
import { Box, IconButton, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import MessageContent from "./MessageContent";

export default function MessageItem({ message }) {
  const theme = useTheme();
  const isFromBot = message.from;

  const primaryColor = theme.palette.primary.main;
  const primaryLight = theme.palette.primary.light;
  const primaryDark = theme.palette.primary.dark;

  const botMessageVariants = {
    initial: {
      opacity: 0,
      x: -30,
      scale: 0.96,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      },
    },
  };

  const userMessageVariants = {
    initial: {
      opacity: 0,
      x: 30,
      scale: 0.96,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 320,
        damping: 25,
        duration: 0.4,
      },
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isFromBot ? "flex-start" : "flex-end",
        width: "100%",
        padding: "4px 16px",
      }}
    >
      {isFromBot ? (
        <motion.div
          variants={botMessageVariants}
          initial="initial"
          animate="animate"
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "80%",
            width: "auto",
            padding: "12px 0",
          }}
        >
          <Box
            sx={{
              backgroundColor: "rgba(246, 246, 246, 0.95)",
              borderRadius: "22px",
              padding: "12px 16px",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <MessageContent message={message} isFromBot />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 0.5,
              mr: 2,
            }}
          >
            <IconButton
              size="small"
              onClick={() => handlePlayAudio(message)}
              sx={{
                width: 24,
                height: 24,
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                },
              }}
            >
              <PlayArrow sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          variants={userMessageVariants}
          initial="initial"
          animate="animate"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            maxWidth: "80%",
            width: "auto",
            borderRadius: "22px",
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
            color: "#fff",
            padding: "6px 14px 6px 8px",
            boxShadow: `0 2px 12px ${primaryColor}20, 0 1px 3px rgba(0, 0, 0, 0.1)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${primaryLight}30`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              minWidth: "24px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              mr: 1.5,
              alignSelf: "flex-start",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <Person
              sx={{
                fontSize: "14px",
                color: "#fff",
                opacity: 0.9,
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, pt: "2px" }}>
            <MessageContent message={message} />
          </Box>
        </motion.div>
      )}
    </Box>
  );
}
