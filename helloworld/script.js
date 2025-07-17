document.addEventListener('DOMContentLoaded', function() {
    const text = "Hello world...this is Sneha!";
    const typewriterElement = document.getElementById('typewriter-text');
    const cursorElement = document.getElementById('cursor');
    
    let index = 0;
    const typingSpeed = 200; // milliseconds between each character
    
    function typeWriter() {
        if (index < text.length) {
            typewriterElement.textContent += text.charAt(index);
            index++;
            setTimeout(typeWriter, typingSpeed);
        } else {
            // Keep the cursor blinking after typing is complete
            cursorElement.style.display = 'inline-block';
        }
    }
    
    // Start the typewriter effect
    typeWriter();
}); 