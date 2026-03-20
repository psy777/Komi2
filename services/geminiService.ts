
import { GoogleGenAI } from "@google/genai";
import { BoardState, StoneColor } from "../types";
import { boardToAscii, fromGtpCoordinate } from "../utils/goLogic";
import { fetchKataGoAnalysis } from "./katagoService";
import boardmatcher from '@sabaki/boardmatcher';

const getAiClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will be disabled.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates a concise fallback commentary from KataGo data if Gemini fails.
 */
const generateFallbackCommentary = (kataGoData: any): string => {
  if (!kataGoData || !kataGoData.bot_move) {
    return "The engine is currently calculating. Please wait a moment or try again.";
  }

  const botMove = kataGoData.bot_move;
  const winProb = kataGoData.diagnostics?.winprob
    ? (kataGoData.diagnostics.winprob * 100).toFixed(1) + '%'
    : 'unknown probability';
  const score = kataGoData.diagnostics?.score !== undefined
    ? kataGoData.diagnostics.score.toFixed(1)
    : 'unknown';

  return `Engine suggests ${botMove} with a ${winProb} win probability. The current estimated score lead is ${score} points.`;
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
  let rawKataGoData: any = null;

  try {
    rawKataGoData = await fetchKataGoAnalysis(gtpMoves, komi);
    if (rawKataGoData && rawKataGoData.bot_move) {
      const botMove = rawKataGoData.bot_move;
      const bestTen = rawKataGoData.diagnostics?.best_ten || [];

      let botMoveName = "";
      const botCoord = fromGtpCoordinate(botMove);
      if (botCoord) {
        // boardmatcher needs the grid. kataGo suggestion is *not* on the board yet.
        const name = boardmatcher.nameMove(boardState.grid, playerTurn === StoneColor.BLACK ? 1 : -1, [botCoord.x, botCoord.y]);
        if (name) botMoveName = name;
      }

      kataGoContext = `
[KATAGO ENGINE DATA]
BEST MOVE: ${botMove} ${botMoveName ? `(${botMoveName})` : ''}
Win Prob: ${rawKataGoData.diagnostics?.winprob ? (rawKataGoData.diagnostics.winprob * 100).toFixed(1) + '%' : 'N/A'}
Score Lead: ${rawKataGoData.diagnostics?.score ?? 'N/A'}
Alternatives: ${bestTen.slice(0, 3).map((m: any) => m.move).join(', ')}
`;
    }
  } catch (e) {
    console.error("KataGo context failed", e);
  }

  // Determine the name of the last move if there is one
  let lastMoveContext = "";
  if (boardState.lastMove) {
    // To match the last move, we must temporarily remove it from the grid
    const { x, y } = boardState.lastMove;
    const previousSign = playerTurn === StoneColor.BLACK ? -1 : 1; // last move was by the *other* player
    const gridCopy = boardState.grid.map(row => [...row]);
    gridCopy[y][x] = 0; // Temporarily reverse

    const lastMoveName = boardmatcher.nameMove(gridCopy, previousSign, [x, y]);
    if (lastMoveName) {
      lastMoveContext = `\nThe last move played was a ${lastMoveName.replace("4-4 Point", "star point")}.`;
    }
  }

  const systemInstruction = `You are a world-class Go (Baduk/Weiqi) teacher. 
When analyzing the position, explain the board state as a whole (e.g., who is leading, balance of territory vs. influence, weak groups) rather than just stating the engine's best move. Answer the user's question directly and insightfully.
CRITICAL: Keep your response short (2-3 sentences maximum) but comprehensive.
CRITICAL: Do NOT use any Markdown formatting whatsoever (no asterisks, no bold, no lists). Use only plain text.
Current Turn: ${turnStr}, Komi: ${komi}. ${kataGoContext}${lastMoveContext}`;

  const userPrompt = userQuestion
    ? `Question: "${userQuestion}"\n\nBoard:\n${boardAscii}`
    : `What is the best move in this position? Board:\n${boardAscii}`;

  try {
    // If API_KEY is missing, skip the call and go straight to fallback
    if (!process.env.NEXT_PUBLIC_API_KEY) {
      return generateFallbackCommentary(rawKataGoData);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    return response.text || generateFallbackCommentary(rawKataGoData);
  } catch (error) {
    console.error("Gemini Error, falling back to engine parsing:", error);
    // Provide a helpful fallback instead of an error message
    return generateFallbackCommentary(rawKataGoData);
  }
};

export const chatWithGemini = async (
  history: { role: 'user' | 'model'; content: string }[],
  boardState: BoardState,
  komi: number,
  gtpMoves: string[] = []
): Promise<string> => {
  const lastUserMsg = history.filter(h => h.role === 'user').pop()?.content;
  return analyzePosition(boardState,
    gtpMoves.length % 2 === 0 ? StoneColor.BLACK : StoneColor.WHITE,
    komi,
    lastUserMsg,
    gtpMoves
  );
}

export const summarizeCommentary = async (question: string, answer: string): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) return "";

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize this Go advice in <8 words: Q: ${question} A: ${answer}`,
      config: {
        systemInstruction: "You are a concise Go editor summary bot. CRITICAL: Use strictly plain text, do NOT use any Markdown formatting.",
        temperature: 0.5,
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};
