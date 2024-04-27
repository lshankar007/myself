import kaboom from "kaboom";

export const k = kaboom({
    global: false,
    touchToMouse: true, // translate all touch events to click events on mobile view
    canvas: document.getElementById("game"),
});