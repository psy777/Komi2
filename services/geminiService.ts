
import { GoogleGenAI } from "@google/genai";
import { BoardState, StoneColor } from "../types";
import { boardToAscii } from "../utils/goLogic";
import { fetchKataGoAnalysis } from "./katagoService";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePosition = async (
  boardState: BoardState,
  playerTurn: StoneColor,
  komi: number,
  userQuestion?: string,
  gtpMoves: string[] = []
): Promise<string> => {
  const boardAscii = boardToAscii(boardState.grid);
  const turnStr = playerTurn === StoneColor.BLACK ? "Black" : "White";
  
  // 1. Fetch KataGo Analysis
  let kataGoContext = "";
  let engineMovesSent = JSON.stringify(gtpMoves);

  try {
      const kataGoData = await fetchKataGoAnalysis(gtpMoves, komi);
      
      if (kataGoData && kataGoData.bot_move) {
          const botMove = kataGoData.bot_move;
          const bestTen = kataGoData.diagnostics?.best_ten || [];
          
          kataGoContext = `
          [SUPERHUMAN ENGINE DATA (KATAGO) - ABSOLUTE TRUTH]
          The engine has analyzed the position. You MUST follow its recommendation.
          
          BEST MOVE: ${botMove}
          - Win Probability: ${kataGoData.diagnostics?.winprob ? (kataGoData.diagnostics.winprob * 100).toFixed(1) + '%' : 'N/A'}
          - Score Lead: ${kataGoData.diagnostics?.score ?? 'N/A'}
          
          Alternative Moves:
          ${bestTen.slice(0, 4).map((m: any) => `- ${m.move} (Score: ${m.score}, Win: ${(m.winrate || m.winprob || 0) * 100}%)`).join('\n')}
          `;
      } else if (kataGoData && kataGoData.moveInfos) {
          const topMoves = kataGoData.moveInfos.slice(0, 3);
          kataGoContext = `
          [SUPERHUMAN ENGINE DATA (KATAGO)]
          Best Move: ${topMoves[0].move}
          Win Rate: ${(topMoves[0].winrate * 100).toFixed(1)}%
          `;
      } else {
          kataGoContext = "\n[WARNING: KataGo returned valid JSON but no move data found.]";
      }
  } catch (e: any) {
      console.error("Failed to inject KataGo context", e);
      kataGoContext = `\n[Error fetching Engine Data: ${e.message}]`;
  }
  
  const systemPrompt = `
    You are an expert Go analysis assistant. You use an ASCII board representation and external engine data to provide commentary.
    
    INSTRUCTIONS:
    1. Report the "BEST MOVE" from the Engine Data.
    2. Explain the tactical implications of the move based on the board state.
    3. Be concise, educational, and helpful to a student of the game.

    Current Turn: ${turnStr}
    Komi: ${komi}
    
    ${kataGoContext}
  `;

  const userPrompt = userQuestion 
    ? `Student Question: "${userQuestion}"\n\nBoard:\n${boardAscii}`
    : `What is the best move? Board:\n${boardAscii}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
      ],
      config: {
        temperature: 0.3,
      }
    });

    const aiText = response.text || "I couldn't generate an analysis.";
    
    // APPEND DEBUG INFO FOR THE USER
    const debugBlock = `
\n\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
**🛠️ DEBUG CONTEXT**
**Moves Sent:** \`${engineMovesSent}\`

**Engine Data:**
${kataGoContext.trim()}
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯`;

    return aiText + debugBlock;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, error communicating with AI.\n\n" + kataGoContext;
  }
};

export const chatWithGemini = async (
  history: { role: 'user' | 'model'; content: string }[],
  boardState: BoardState,
  komi: number,
  gtpMoves: string[] = []
): Promise<string> => {
    return analyzePosition(boardState, 
        history.length % 2 === 0 ? StoneColor.BLACK : StoneColor.WHITE, 
        komi, 
        history[history.length-1].content, 
        gtpMoves
    );
}

export const summarizeCommentary = async (question: string, answer: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { 
            role: 'user', 
            parts: [{ text: `Summarize this Go advice into a tiny comment (MAX 8 WORDS). Plain text.
            
            Q: ${question}
            A: ${answer}
            
            Summary:` }] 
        }
      ],
      config: {
        temperature: 0.5,
        maxOutputTokens: 20, 
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "";
  }
};
