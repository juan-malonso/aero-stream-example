import React from "react";
import { Handle, Position } from "@xyflow/react";
import { colors } from "@/styles/tokens";

export const StartNode = () => {
  return (
    <div
      style={{
        background: colors.pink300,
        color: colors.black,
        padding: "10px",
        borderRadius: "50%",
        width: "30px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `3px solid ${colors.pink500}`,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        fontWeight: "bold",
        fontSize: "12px",
      }}
    >
      Start
      <Handle
        type="source"
        position={Position.Right}
        id="start"
        style={{
          background: colors.pink500,
          width: "10px",
          height: "10px",
          right: "-5px",
          border: "none",
        }}
      />
    </div>
  );
};
