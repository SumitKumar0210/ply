import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import { Paper, Typography, Box } from "@mui/material";

export default function MessageTimeline({ messages }) {
  return (
    <Box
    //   sx={{
    //     height: "300px",      
    //     overflowY: "auto",    
    //     pr: 1                
    //   }}
    >
      <Timeline 
        position="right"
        sx={{
            
          "& .MuiTimelineItem-root:before": {
            display: "none",  // remove auto pseudo element
          }
        }}
        className="production"
      
      >
        {messages.map((msg, index) => (
          <TimelineItem key={index}>
            <TimelineSeparator>
              <TimelineDot color="primary" />
              {index < messages.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>
              <Paper elevation={3} sx={{ p: 1.5, mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {msg.user?.name}
                </Typography>

                <Typography variant="body2">
                  {msg.message}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {new Date(msg.created_at).toLocaleDateString('en-GB')}
                </Typography>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}
