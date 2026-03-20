import Board from '@sabaki/go-board';

const runTests = () => {
    console.log("Starting Board State Tests...");
    let passes = 0;
    let fails = 0;

    const assert = (condition: boolean, msg: string) => {
        if (condition) {
            console.log(`✅ ${msg}`);
            passes++;
        } else {
            console.error(`❌ ${msg}`);
            fails++;
        }
    };

    try {
        // 1. Initialize Board
        const board = Board.fromDimensions(19);
        assert(board.width === 19 && board.height === 19, "Board initializes to 19x19");

        // 2. Play a move
        const board2 = board.makeMove(1, [3, 3]); // Black plays D4
        assert(board2.get([3, 3]) === 1, "Black stone placed at [3,3]");

        // 3. Play another move
        const board3 = board2.makeMove(-1, [15, 3]); // White plays Q4
        assert(board3.get([15, 3]) === -1, "White stone placed at [15,3]");

        // 4. Test Capture
        let captureBoard = Board.fromDimensions(19);
        captureBoard = captureBoard.makeMove(1, [1, 0]); // Black
        captureBoard = captureBoard.makeMove(-1, [0, 0]); // White
        captureBoard = captureBoard.makeMove(1, [0, 1]); // Black captures White at [0,0]

        assert(captureBoard.get([0, 0]) === 0, "White stone captured at [0,0]");
        assert(captureBoard.getCaptures(1) === 1, "Black capture count is 1");

        // 5. Test SignMap structure mapping
        const signMap = captureBoard.signMap;
        assert(signMap.length === 19 && signMap[0].length === 19, "SignMap has correct dimensions");
        assert(signMap[0][1] === 1 && signMap[1][0] === 1, "SignMap reflects stone placements");
        assert(signMap[0][0] === 0, "SignMap reflects empty capture space");

        // 6. Test arbitrary Setup Stone mapping (which ignores Ko and Suicides)
        let setupBoard = Board.fromDimensions(19);
        setupBoard = setupBoard.set([5, 5], 1); // direct placement
        assert(setupBoard.get([5, 5]) === 1, "Direct .set() placement bypasses rules correctly for edit tools");

    } catch (err) {
        console.error("Test execution failed:", err);
    }

    console.log(`\nResults: ${passes} passed, ${fails} failed.`);
};

runTests();
