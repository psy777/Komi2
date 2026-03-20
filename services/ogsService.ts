import sgf from '@sabaki/sgf';

/**
 * Fetches the SGF from OGS for a given Game ID and parses it into a GameTree array using @sabaki/sgf
 */
export const fetchOGSGameSgf = async (gameId: string | number) => {
    try {
        const response = await fetch(`https://online-go.com/api/v1/games/${gameId}/sgf`);
        if (!response.ok) {
            throw new Error(`Failed to fetch game ${gameId} from OGS API. Status: ${response.status}`);
        }
        const sgfText = await response.text();

        // Parse the SGF text into game trees using @sabaki/sgf
        // Returns an array of GameTrees (usually just one tree for a single game)
        const rootNodes = sgf.parse(sgfText);

        return rootNodes;
    } catch (err) {
        console.error("Error fetching OGS Game:", err);
        throw err;
    }
};
