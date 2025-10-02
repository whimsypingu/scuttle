import { domEls } from "../../dom/selectors.js";
const { audioEl, currTimeEl, durationEl, progBarEl, ppButtonEl } = domEls;

export { 
    getAudioStream 
} from "./lib/api.js";


//dom inject these here
export {
    updateMediaSession
} from "./lib/ui.js";
import * as audioUI from "./lib/ui.js";

import { getPlayerEl } from "./lib/streamTrick.js";

export const setCurrentTimeDisplay = (value) => audioUI.setCurrentTimeDisplay(currTimeEl, value);
export const syncCurrentTimeDisplay = () => audioUI.syncCurrentTimeDisplay(currTimeEl, getPlayerEl());

export const setDurationDisplay = (value) => audioUI.setDurationDisplay(durationEl, value);
export const syncDurationDisplay = () => audioUI.syncDurationDisplay(durationEl, getPlayerEl());

export const setProgressBar = (percent) => audioUI.setProgressBar(progBarEl, percent);
export const syncProgressBar = () => audioUI.syncProgressBar(progBarEl, getPlayerEl());

export const updatePlayPauseButtonDisplay = (isPlaying) => audioUI.updatePlayPauseButtonDisplay(ppButtonEl, isPlaying);

export const resetUI = () => audioUI.resetUI(getPlayerEl(), currTimeEl, progBarEl, durationEl);
export const setUI = (currTime, totalTime) => audioUI.setUI(currTimeEl, progBarEl, durationEl, currTime, totalTime);




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


