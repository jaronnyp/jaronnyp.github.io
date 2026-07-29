//target all elements to save to constants
const page1btn=document.querySelector("#page1btn");
const page2btn=document.querySelector("#page2btn");
const page3btn=document.querySelector("#page3btn");
const page4btn=document.querySelector("#page4btn");
const page5btn=document.querySelector("#page5btn");
var allpages=document.querySelectorAll(".page");
//select all subtopic pages
function hideall(){ //function to hide all pages
for(let onepage of allpages){ //go through all subtopic pages
onepage.style.display="none"; //hide it
}
}

function show(pgno){ //function to show selected page no
hideall();

//select the page based on the parameter passed in
let onepage=document.querySelector("#page"+pgno);
onepage.style.display="block"; //show the page

}
/*Listen for clicks on the buttons, assign anonymous
eventhandler functions to call show function*/
page1btn.addEventListener("click", function () {
show(1);
});

page2btn.addEventListener("click", function () {
show(2);
});
page3btn.addEventListener("click", function () {
show(3);
});
page4btn.addEventListener("click", function () {
show(4);
});
page5btn.addEventListener("click", function () {
show(5);
});
show(1); //show page 1 by default

const gases = ["oxygen", "carbondioxide", "ammonia"];
 
// Randomly assign a gas to each flask
let flaskGas = {
  1: gases[Math.floor(Math.random() * gases.length)],
  2: gases[Math.floor(Math.random() * gases.length)],
  3: gases[Math.floor(Math.random() * gases.length)]
};
 
// Which tool correctly identifies which gas
const correctTool = {
  oxygen: "splint",
  carbondioxide: "limewater",
  ammonia: "litmus"
};
 
// The test only shows a CLUE (an observation), not the gas name.
// Player has to use the clue to make their guess.
const testClues = {
  oxygen: {
    splint: "The glowing splint relights! 🔥",
    limewater: "Nothing happens to the limewater.",
    litmus: "The litmus paper stays the same."
  },
  carbondioxide: {
    splint: "The splint goes out.",
    limewater: "The limewater turns milky/cloudy! 🌫️",
    litmus: "The litmus paper stays the same."
  },
  ammonia: {
    splint: "Nothing happens to the splint.",
    limewater: "The limewater stays clear.",
    litmus: "The litmus paper turns blue! 🔵"
  }
};
 
let selectedTool = null;
let testedFlaskId = null; // which flask is currently awaiting a guess
 
const toolButtons = document.querySelectorAll(".tool");
const flaskDivs = document.querySelectorAll(".flask");
const guessButtons = document.querySelectorAll(".guess");
const guessPanel = document.getElementById("guessPanel");
const resultText = document.getElementById("result");
const scoreText = document.getElementById("score");
const selectedToolText = document.getElementById("selectedTool");
 
let score = 0;
 
// Handle tool selection
toolButtons.forEach(button => {
  button.addEventListener("click", () => {
    toolButtons.forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    selectedTool = button.getAttribute("data-tool");
    selectedToolText.textContent = "Selected tool: " + selectedTool;
  });
});
 
// Handle testing a flask -> show a clue, then open the guess panel
flaskDivs.forEach(flask => {
  flask.addEventListener("click", () => {
    if (!selectedTool) {
      resultText.textContent = "Pick a test tool first!";
      return;
    }
 
    const flaskId = flask.getAttribute("data-id");
    const gas = flaskGas[flaskId];
    const clue = testClues[gas][selectedTool];
 
    testedFlaskId = flaskId;
    resultText.textContent = "Clue: " + clue;
 
    // Replay the fade-in animation on the result text
    resultText.classList.remove("fade");
    void resultText.offsetWidth; // restart animation trick
    resultText.classList.add("fade");
 
    guessPanel.classList.remove("hidden");
  });
});
 
// Handle the player's guess
guessButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (!testedFlaskId) return;
 
    const guess = button.getAttribute("data-gas");
    const actualGas = flaskGas[testedFlaskId];
    const flaskDiv = document.querySelector('.flask[data-id="' + testedFlaskId + '"]');
 
    flaskDiv.classList.remove("correct", "wrong");
 
    if (guess === actualGas) {
      score++;
      scoreText.textContent = "Score: " + score;
      resultText.textContent = "Correct! It was " + actualGas.toUpperCase() + " ✅";
      flaskDiv.classList.add("correct");
      // Give this flask a new random gas for next time
      flaskGas[testedFlaskId] = gases[Math.floor(Math.random() * gases.length)];
    } else {
      resultText.textContent = "Not quite. It was actually " + actualGas.toUpperCase() + " ❌";
      flaskDiv.classList.add("wrong");
    }
  });
    // Reset for the next round
    guessPanel.classList.add("hidden");
    testedFlaskId = null;
  });
