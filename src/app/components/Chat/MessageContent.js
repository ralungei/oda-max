"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import Markdown from "markdown-to-jsx";

export default function MessageContent({ message, isFromBot }) {
  const payload = message.messagePayload;

  switch (payload.type) {
    case "text":
      return (
        <Box
          className="markdown-content"
          sx={{
            fontSize: "0.88rem",
            letterSpacing: "0.01px",
            lineHeight: 1.5,
            ...(isFromBot && {
              fontFamily: "var(--font-exo2), sans-serif",
              "& *": { fontFamily: "var(--font-exo2), sans-serif !important" },
            }),
          }}
        >
          <Markdown>{payload.text}</Markdown>
        </Box>
      );
    case "card":
      return (
        <Card variant="outlined">
          <CardContent>
            {payload.cards &&
              payload.cards.map((card, idx) => (
                <Box key={idx}>
                  {card.title && (
                    <Typography variant="h6">{card.title}</Typography>
                  )}
                  {card.description && (
                    <Typography variant="body2">{card.description}</Typography>
                  )}
                  {card.url && (
                    <Typography variant="body2">
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {card.url}
                      </a>
                    </Typography>
                  )}
                </Box>
              ))}
          </CardContent>
        </Card>
      );
    case "attachment":
      const attachment = payload.attachment;

      // Si es imagen, mostrarla directamente
      if (attachment.type.startsWith("image/")) {
        return (
          <Box
            component="img"
            src={attachment.url}
            alt={attachment.title || "Uploaded image"}
            sx={{
              maxWidth: 200,
              maxHeight: 300,
              borderRadius: 0.5,
              objectFit: "contain",
            }}
          />
        );
      }

      return (
        <Typography>
          Attachment: {attachment.type} -{" "}
          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
            {attachment.title || "View"}
          </a>
        </Typography>
      );

    default:
      return (
        <Typography color="error">
          Unsupported message type: {payload.type}
        </Typography>
      );
  }
}
