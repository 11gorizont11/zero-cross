const WINNING_COMBO = [
  {
    list: [0, 1, 2],
    direction: "horizontal"
  },
  {
    list: [3, 4, 5],
    direction: "horizontal"
  },
  {
    list: [6, 7, 8],
    direction: "horizontal"
  },
  {
    list: [0, 3, 6],
    direction: "vertical"
  },
  {
    list: [1, 4, 7],
    direction: "vertical"
  },
  {
    list: [2, 5, 8],
    direction: "vertical"
  },
  {
    list: [0, 4, 8],
    direction: "diagonal-right"
  },
  {
    list: [2, 4, 6],
    direction: "diagonal-left"
  }
];

const DefaultAppState = {
  steps: [],
  history: [],
  winner: null,
  wonCombo: null,
  gameOver: false
};

function getAppState() {
  const state = localStorage.getItem("AppState");
  return state ? JSON.parse(state) : {};
}

function setAppState(nextState) {
  const prevState = getAppState();
  const state = Object.assign(prevState, nextState);
  localStorage.setItem("AppState", JSON.stringify(state));
}

function renderBtn({ button, isDisabled }) {
  isDisabled
    ? button.setAttribute("disabled", "")
    : button.removeAttribute("disabled");
}
function getIndex(node) {
  let currentNode = node;
  while (!currentNode.matches(".cell")) {
    currentNode = currentNode.parentNode;
  }
  return parseInt(currentNode.dataset.id, 10);
}

function addClassToCell(entry, cell) {
  const className = entry === "cross" ? "ch" : "r";
  cell.classList.add(className);
}

function evaluateSteps(playerCombo) {
  let isWin = false;
  let wonCombo = null;
  for (let combo of WINNING_COMBO) {
    let overlaps = [];
    for (let step of playerCombo) {
      if (combo.list.indexOf(step) != -1) {
        overlaps.push("yes");
      }
    }
    if (overlaps.length === 3) {
      isWin = true;
      wonCombo = combo;
      break;
    }
  }
  return {
    isWin,
    wonCombo
  };
}

function renderSteps({ cells, steps }) {
  cells.forEach(cell => (cell.classList = ["cell"]));
  steps.forEach(step => {
    const choosenCell = cells.find(cell => getIndex(cell) === step.idx);
    addClassToCell(step.player, choosenCell);
  });
}
function renderTextGame({ title, msg }) {
  title.querySelector(".won-message").textContent = msg;
  title.classList.remove("hidden");
}

function renderWonCombo({ cells, wonCombo }) {
  const { list, direction } = wonCombo;
  cells.forEach(cell => {
    if (list.indexOf(getIndex(cell)) !== -1) {
      cell.classList.add("win", direction);
    }
  });
}

function clearField({ cells }) {
  cells.forEach(cell => (cell.classList = ["cell"]));
}

function clearText({ title }) {
  title.querySelector(".won-message").textContent = "";
  title.classList.add("hidden");
}

function renderView({ container, AppState }) {
  const { steps, history, winner, wonCombo, gameOver } = AppState;
  const cells = [...container.querySelectorAll(".cell")];
  renderBtn({
    button: container.querySelector(".undo-btn"),
    isDisabled: steps.length === 0
  });
  renderBtn({
    button: container.querySelector(".redo-btn"),
    isDisabled: !(history.length > steps.length)
  });

  steps.length
    ? renderSteps({
        cells,
        steps
      })
    : clearField({
        cells
      });

  (!winner || !gameOver) &&
    clearText({
      title: container.querySelector(".won-title")
    });
  winner &&
    renderTextGame({
      title: container.querySelector(".won-title"),
      msg: `${winner === "cross" ? "Crosses" : "Toes"} won!`
    });
  wonCombo &&
    renderWonCombo({
      cells,
      wonCombo
    });
  gameOver &&
    renderTextGame({
      title: container.querySelector(".won-title"),
      msg: `It's a draw!`
    });
}

const render = () => {
  renderView({
    container: document.querySelector("#app"),
    AppState: getAppState()
  });
};

function listenTo({ event, selector, handler }) {
  document.addEventListener(event, e => {
    if (e.target.matches(selector)) {
      handler(e);
      render();
    }
  });
}

function winnerDetector(steps) {
  if (steps.length) {
    const lastStep = steps[steps.length - 1];
    const playerCombo = steps
      .filter(s => s.player === lastStep.player)
      .map(s => s.idx);
    const isWinner = evaluateSteps(playerCombo);
    setAppState({
      winner: isWinner.isWin ? lastStep.player : null,
      wonCombo: isWinner.isWin ? isWinner.wonCombo : null,
      gameOver: steps.length === 9,
      steps
    });
  }
}

function makeChoise(event) {
  const { target } = event;
  let { steps, history } = getAppState();
  const player = steps.length % 2 === 0 ? "cross" : "zero";

  steps.push({
    idx: getIndex(target),
    player
  });

  history = [...steps];
  winnerDetector(steps);

  setAppState({
    history
  });
}

function restartGame() {
  localStorage.removeItem("AppState");
  setAppState({ ...DefaultAppState });
}

function undoStep(event) {
  const { steps } = getAppState();
  winnerDetector(steps.slice(0, -1));
}

function redoStep(event) {
  const { steps, history } = getAppState();
  const stepSize = steps.length;
  const currentStep = stepSize ? steps[stepSize - 1] : { idx: -1 };
  const currStepIdx = history.findIndex(step => step.idx === currentStep.idx);
  steps.push(history[currStepIdx + 1]);
  winnerDetector(steps);
}

function bindEvents() {
  listenTo({
    event: "click",
    selector: ".cell",
    handler: makeChoise
  });
  listenTo({
    event: "click",
    selector: "button.restart-btn",
    handler: restartGame
  });
  listenTo({
    event: "click",
    selector: "button.undo-btn",
    handler: undoStep
  });
  listenTo({
    event: "click",
    selector: "button.redo-btn",
    handler: redoStep
  });
}

!localStorage.hasOwnProperty("AppState") && setAppState({ ...DefaultAppState });
bindEvents();
render();
