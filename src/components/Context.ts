import React, { createContext, useContext } from "react";

export const LitContext = React.createContext<any>(null);

export const useLitContext = () => {
  return useContext(LitContext);
};
