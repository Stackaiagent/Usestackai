import React from "react";
import { Box, Text } from "ink";
import type { Entry } from "./format.js";

/** Renders agent entries: tool headers (●), indented diff/sub lines, and prose. */
export function EntryLines({ entries }: { entries: Entry[] }) {
  return (
    <>
      {entries.map((e, i) => {
        if (e.kind === "tool") {
          return (
            <Box key={i} marginTop={1}>
              <Text color={e.color} bold>
                ● {e.label}
              </Text>
            </Box>
          );
        }
        if (e.kind === "sub") {
          return (
            <Box key={i} marginLeft={2}>
              <Text color={e.color}>{e.text}</Text>
            </Box>
          );
        }
        return (
          <Box key={i} marginTop={1} marginLeft={2}>
            <Text>{e.text}</Text>
          </Box>
        );
      })}
    </>
  );
}
