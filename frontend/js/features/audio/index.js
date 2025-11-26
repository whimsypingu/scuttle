import { domEls } from "../../dom/selectors.js";
import { QueueStore } from "../../cache/QueueStore.js";
const { audioEl, currTimeEl, durationEl, progBarEl, ppButtonEl, loopButtonEl } = domEls;

export { 
    getAudioStream 
} from "./lib/api.js";


//looping
export {
    toggleLoopMode,
    isLoopNone,
    isLoopAll,
    isLoopOne
} from "./lib/loop.js";

export {
    updateMediaSession
} from "./lib/ui.js";


//dom inject these here
import * as audioUI from "./lib/ui.js";

import { getPlayerEl } from "./lib/streamTrick.js";

export const setCurrentTimeDisplay = (value) => audioUI.setCurrentTimeDisplay(currTimeEl, value);
export const syncCurrentTimeDisplay = () => audioUI.syncCurrentTimeDisplay(currTimeEl, getPlayerEl());

export const setDurationDisplay = (value) => audioUI.setDurationDisplay(durationEl, value); //not used in a controller file
export const syncDurationDisplay = () => audioUI.syncDurationDisplay(durationEl, QueueStore.peekTrack); //not used in a controller file

export const setProgressBar = (percent) => audioUI.setProgressBar(progBarEl, percent);
export const syncProgressBar = () => audioUI.syncProgressBar(progBarEl, getPlayerEl(), QueueStore.peekTrack());

export const updatePlayPauseButtonDisplay = (isPlaying) => audioUI.updatePlayPauseButtonDisplay(ppButtonEl, isPlaying);

export const resetUI = () => audioUI.resetUI(getPlayerEl(), currTimeEl, progBarEl, durationEl, QueueStore.peekTrack());
export const setUI = (currTime, totalTime) => audioUI.setUI(currTimeEl, progBarEl, durationEl, currTime, totalTime);


export const spinLoopButton = () => audioUI.spinLoopButton(loopButtonEl);
export const setLoopButton = (looping, one) => audioUI.setLoopButton(loopButtonEl, looping, one);


//for setting the time of a currently playing song
export const setAudioTime = (time) => {
    const playerEl = getPlayerEl();

    playerEl.currentTime = time; //set and sync
    syncCurrentTimeDisplay();
    syncProgressBar();
}




export {
    playLoadedTrack,
    pauseLoadedTrack,
    trackState,
    cleanupCurrentAudio
} from "./lib/streamTrick.js";
import { loadTrack as rawLoadTrack } from "./lib/streamTrick.js";

export async function loadTrack(trackId) {
    await rawLoadTrack(audioEl, trackId);
}


