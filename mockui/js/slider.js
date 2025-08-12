const slider = document.getElementById('audio-progress-bar');

const fillColor = "var(--text-1)";
const blankColor = "var(--bg-7)";

function updateSliderFill() {
    const min = slider.min ? slider.min : 0;
    const max = slider.max ? slider.max : 100;
    const val = slider.value;

    // Calculate the percentage filled (0 to 100)
    const percent = ((val - min) / (max - min)) * 100;

    // Set background gradient:
    // from left to 'percent'% is the fill color,
    // from 'percent'% to right is the empty track color
    slider.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, ${blankColor} ${percent}%, ${blankColor} 100%)`;
}

// Initialize fill on load
updateSliderFill();

// Update fill on input (while dragging)
slider.addEventListener('input', updateSliderFill);
