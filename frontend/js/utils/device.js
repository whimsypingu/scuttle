export function isMobile() {
    const ua = navigator.userAgent;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);

    return (isMobileUA && isTouch) || isSmallScreen;
}

//reorganize css into mobile first, desktop last. least capable device first so it loads in fewer things