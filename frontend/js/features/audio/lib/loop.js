//frontend/js/features/audio/lib/loop.js

import { logDebug } from "../../../utils/debug.js";

const LOOP_NONE = "none";
const LOOP_ALL = "all";
const LOOP_ONE = "one";

//track looping type
let loopMode = LOOP_NONE;

function setLoopMode(mode) {
    if ([LOOP_NONE, LOOP_ALL, LOOP_ONE].includes(mode)) {
        loopMode = mode;
    } else {
        logDebug("[WARN] Invalid loop mode:", mode);
    }
}

//toggle
export function toggleLoopMode() {
    switch (loopMode) {
        case LOOP_NONE:
            setLoopMode(LOOP_ALL);
            break;
        
        case LOOP_ALL:
            setLoopMode(LOOP_ONE);
            break;

        case LOOP_ONE:
            setLoopMode(LOOP_NONE);
            break;
    }
    return {
        looping: loopMode !== LOOP_NONE,
        one: loopMode === LOOP_ONE
    };
}

//exposed getter functions
export function isLoopNone() { return loopMode === LOOP_NONE; }
export function isLoopAll() { return loopMode === LOOP_ALL; }
export function isLoopOne() { return loopMode === LOOP_ONE; }
