//dom injection here

import * as popupUI from "./lib/ui.js";

import { popupDomEls } from "../../dom/selectors.js";
const { popupOverlayEl, popupEl } = popupDomEls;

export const hidePopup = async () => popupUI.hidePopup(popupEl, popupOverlayEl);
export const showPopup = () => popupUI.showPopup(popupOverlayEl);