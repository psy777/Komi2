import { GoogleGenAI } from "@google/genai";
import { BoardState, StoneColor } from "../types";
import { boardToAscii } from "../utils/goLogic";
import { fetchKataGoAnalysis } from "./katagoService";

const getAiClient = () => {
  // Use a fallback to prevent immediate crash if env is missing
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will be disabled.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePosition = async (
  boardState: BoardState,
  playerTurn: StoneColor,
  komi: number,
  userQuestion?: string,
  gtpMoves: string[] = []
): Promise<string> => {
  const boardAscii = boardToAscii(boardState.grid);
  const turnStr = playerTurn === StoneColor.BLACK ? "Black" : "White";
  const ai = getAiClient();
  
  let kataGoContext = "";
  try {
      const kataGoData = await fetchKataGoAnalysis(gtpMoves, komi);
      if (kataGoData && kataGoData.bot_move) {
          const botMove = kataGoData.bot_move;
          const bestTen = kataGoData.diagnostics?.best_ten || [];
          kataGoContext = `
[KATAGO ENGINE DATA]
BEST MOVE: ${botMove}
Win Prob: ${kataGoData.diagnostics?.winprob ? (kataGoData.diagnostics.winprob * 100).toFixed(1) + '%' : 'N/A'}
Score Lead: ${kataGoData.diagnostics?.score ?? 'N/A'}
Alternatives: ${bestTen.slice(0, 3).map((m: any) => m.move).join(', ')}
`;
      }
  } catch (e) {
      console.error("KataGo context failed", e);
  }
  
  const systemInstruction = `You are a world-class Go (Baduk/Weiqi) teacher. 
Analyze the board state and engine data provided. Be professional, insightful, and concise. 
Current Turn: ${turnStr}, Komi: ${komi}. ${kataGoContext}`;

  const userPrompt = userQuestion 
    ? `Question: "${userQuestion}"\n\nBoard:\n${boardAscii}`
    : `What is the best move in this position? Board:\n${boardAscii}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    return response.text || "I was unable to analyze this position.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI analysis is currently unavailable. Please check your API key.";
  }
};

export const chatWithGemini = async (
  history: { role: 'user' | 'model'; content: string }[],
  boardState: BoardState,
  komi: number,
  gtpMoves: string[] = []
): Promise<string> => {
    // Map history to standard contents if needed, but analyzePosition takes specific params
    const lastUserMsg = history.filter(h => h.role === 'user').pop()?.content;
    return analyzePosition(boardState, 
        history.length % 2 === 0 ? StoneColor.BLACK : StoneColor.WHITE, 
        komi, 
        lastUserMsg, 
        gtpMoves
    );
}

export const summarizeCommentary = async (question: string, answer: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize this Go advice in <8 words: Q: ${question} A: ${answer}`,
      config: {
        systemInstruction: "You are a concise Go editor summary bot.",
        temperature: 0.5,
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};