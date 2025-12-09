let expression = '';
let stack = [];
let result = null;
let steps = [];
let currentStep = -1;
let infixExpression = '';
let activeTab = 'evaluator';

const examples = [
  { infix: '2 + 3', postfix: '2 3 +', result: 5 },
  { infix: '5 * (3 + 2)', postfix: '5 3 2 + *', result: 25 },
  { infix: '(8 + 2) * (5 - 3)', postfix: '8 2 + 5 3 - *', result: 20 },
  { infix: '10 / (2 + 3)', postfix: '10 2 3 + /', result: 2 },
  { infix: '2 ^ 3 + 4', postfix: '2 3 ^ 4 +', result: 12 },
  { infix: '100 - 50 + 20', postfix: '100 50 - 20 +', result: 70 }
];

document.addEventListener('DOMContentLoaded', function() {
  initTabs();
  initExamples();
  initConverterExamples();
  initEventListeners();
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  activeTab = tabName;
  
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

function initExamples() {
  const grid = document.getElementById('examples-grid');
  examples.forEach(ex => {
    const card = document.createElement('button');
    card.className = 'example-card';
    card.innerHTML = `
      <div class="example-infix">${ex.infix}</div>
      <div class="example-postfix">${ex.postfix}</div>
      <div class="example-result">= ${ex.result}</div>
    `;
    card.addEventListener('click', () => loadExample(ex));
    grid.appendChild(card);
  });
}

function initConverterExamples() {
  const list = document.getElementById('converter-examples-list');
  examples.forEach(ex => {
    const item = document.createElement('div');
    item.className = 'converter-example-item';
    item.innerHTML = `
      <div class="info">
        <div class="infix">Infix: ${ex.infix}</div>
        <div class="postfix">Postfix: ${ex.postfix}</div>
      </div>
      <button class="btn-load">Load</button>
    `;
    item.querySelector('.btn-load').addEventListener('click', () => {
      document.getElementById('infix-input').value = ex.infix;
      expression = ex.postfix;
      document.getElementById('expression-input').value = ex.postfix;
      showPostfixResult(ex.postfix);
    });
    list.appendChild(item);
  });
}

function initEventListeners() {
  document.getElementById('evaluate-btn').addEventListener('click', handleEvaluate);
  document.getElementById('reset-btn').addEventListener('click', reset);
  document.getElementById('convert-btn').addEventListener('click', convertInfixToPostfix);
  
  document.getElementById('expression-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') handleEvaluate();
  });
  
  document.getElementById('infix-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') convertInfixToPostfix();
  });
}

function showMessage(text, type = 'success') {
  const msgEl = document.getElementById('message');
  msgEl.textContent = text;
  msgEl.className = `message ${type}`;
  msgEl.classList.remove('hidden');
  
  setTimeout(() => {
    msgEl.classList.add('hidden');
  }, 3000);
}

function isOperator(char) {
  return ['+', '-', '*', '/', '^', '%'].includes(char);
}

function performOperation(a, b, operator) {
  const numA = typeof a === 'string' ? parseFloat(a) : a;
  const numB = typeof b === 'string' ? parseFloat(b) : b;
  
  switch (operator) {
    case '+': return numA + numB;
    case '-': return numA - numB;
    case '*': return numA * numB;
    case '/': 
      if (numB === 0) throw new Error('Division by zero');
      return numA / numB;
    case '^': return Math.pow(numA, numB);
    case '%': return numA % numB;
    default: return 0;
  }
}

function evaluatePostfix(expr) {
  const tokens = expr.trim().split(/\s+/);
  const tempStack = [];
  const evaluationSteps = [];
  let stepCount = 1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (isOperator(token)) {
      if (tempStack.length < 2) {
        throw new Error('Invalid expression: Not enough operands');
      }

      const b = tempStack.pop();
      const a = tempStack.pop();
      const res = performOperation(a, b, token);
      tempStack.push(res);

      evaluationSteps.push({
        step: stepCount++,
        token: token,
        action: `Pop ${b} and ${a}, compute ${a} ${token} ${b} = ${res}`,
        stack: [...tempStack],
        type: 'operation'
      });
    } else {
      const num = parseFloat(token);
      if (isNaN(num)) {
        throw new Error(`Invalid token: ${token}`);
      }
      tempStack.push(num);

      evaluationSteps.push({
        step: stepCount++,
        token: token,
        action: `Push ${token}`,
        stack: [...tempStack],
        type: 'push'
      });
    }
  }

  if (tempStack.length !== 1) {
    throw new Error('Invalid expression: Multiple values remaining');
  }

  return { result: tempStack[0], steps: evaluationSteps };
}

function handleEvaluate() {
  const input = document.getElementById('expression-input');
  expression = input.value;
  
  if (!expression.trim()) {
    showMessage('Please enter a postfix expression', 'error');
    return;
  }

  try {
    const evalResult = evaluatePostfix(expression);
    result = evalResult.result;
    steps = evalResult.steps;
    stack = [];
    currentStep = -1;
    
    renderResult();
    renderStack();
    renderStepControls();
    renderStepsTable();
    
    showMessage('Expression evaluated successfully!', 'success');
  } catch (error) {
    showMessage(error.message || 'An error occurred', 'error');
    result = null;
    steps = [];
    stack = [];
    currentStep = -1;
    
    hideResult();
    renderStack();
    renderStepControls();
    hideStepsTable();
  }
}

function stepThrough() {
  if (currentStep < steps.length - 1) {
    currentStep++;
    stack = steps[currentStep].stack;
    renderStack();
    renderStepControls();
    updateStepsTableHighlight();
  } else {
    showMessage('All steps completed!', 'success');
  }
}

function reset() {
  expression = '';
  stack = [];
  result = null;
  steps = [];
  currentStep = -1;
  infixExpression = '';
  
  document.getElementById('expression-input').value = '';
  document.getElementById('infix-input').value = '';
  
  hideResult();
  renderStack();
  renderStepControls();
  hideStepsTable();
  hidePostfixResult();
  
  showMessage('Reset complete', 'success');
}

function loadExample(example) {
  expression = example.postfix;
  infixExpression = example.infix;
  document.getElementById('expression-input').value = example.postfix;
  
  result = null;
  steps = [];
  stack = [];
  currentStep = -1;
  
  hideResult();
  renderStack();
  renderStepControls();
  hideStepsTable();
  
  showMessage(`Loaded: ${example.infix}`, 'success');
}

function renderResult() {
  const display = document.getElementById('result-display');
  const value = document.getElementById('result-value');
  
  display.classList.remove('hidden');
  value.textContent = result;
}

function hideResult() {
  document.getElementById('result-display').classList.add('hidden');
}

function renderStack() {
  const container = document.getElementById('stack-container');
  
  if (stack.length === 0) {
    container.innerHTML = '<div class="stack-empty">Stack is empty</div>';
    return;
  }
  
  let html = '<div class="stack-base"></div>';
  stack.forEach((item, index) => {
    const isTop = index === stack.length - 1;
    html += `<div class="stack-item ${isTop ? 'top' : ''}">${item}</div>`;
  });
  
  container.innerHTML = html;
}

function renderStepControls() {
  const container = document.getElementById('step-controls');
  
  if (steps.length === 0) {
    container.innerHTML = '<div class="step-empty">Evaluate an expression to see step-by-step execution</div>';
    return;
  }
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isComplete = currentStep >= steps.length - 1;
  
  let html = `
    <div class="step-progress">
      <div class="step-info">Step ${currentStep + 1} of ${steps.length}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>
    <button class="btn-step" ${isComplete ? 'disabled' : ''} onclick="stepThrough()">
      ${isComplete ? 'All Steps Complete' : 'Next Step →'}
    </button>
  `;
  
  if (currentStep >= 0) {
    const step = steps[currentStep];
    html += `
      <div class="current-step-info">
        <div class="current-step-label">Current Token:</div>
        <div class="current-step-token">${step.token}</div>
        <div class="current-step-label">Action:</div>
        <div class="current-step-action">${step.action}</div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function renderStepsTable() {
  const container = document.getElementById('steps-table-container');
  const tbody = document.getElementById('steps-table-body');
  
  container.classList.remove('hidden');
  
  let html = '';
  steps.forEach((step, idx) => {
    const isHighlight = idx === currentStep;
    const stackBadges = step.stack.map(val => `<span class="stack-badge">${val}</span>`).join('');
    
    html += `
      <tr class="${isHighlight ? 'highlight' : ''}" data-step="${idx}">
        <td>${step.step}</td>
        <td><span class="token-badge ${step.type === 'operation' ? 'operation' : 'push'}">${step.token}</span></td>
        <td>${step.action}</td>
        <td><div class="stack-state">${stackBadges}</div></td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

function updateStepsTableHighlight() {
  const rows = document.querySelectorAll('#steps-table-body tr');
  rows.forEach((row, idx) => {
    if (idx === currentStep) {
      row.classList.add('highlight');
    } else {
      row.classList.remove('highlight');
    }
  });
}

function hideStepsTable() {
  document.getElementById('steps-table-container').classList.add('hidden');
}

function infixToPostfix(infix) {
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, '%': 2 };
  const output = [];
  const operatorStack = [];
  const tokens = infix.match(/(\d+\.?\d*|[+\-*/^%()])/g) || [];

  for (const token of tokens) {
    if (!isNaN(parseFloat(token))) {
      output.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
        output.push(operatorStack.pop());
      }
      operatorStack.pop();
    } else if (isOperator(token)) {
      while (
        operatorStack.length &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        output.push(operatorStack.pop());
      }
      operatorStack.push(token);
    }
  }

  while (operatorStack.length) {
    output.push(operatorStack.pop());
  }

  return output.join(' ');
}

function convertInfixToPostfix() {
  const input = document.getElementById('infix-input');
  infixExpression = input.value;
  
  if (!infixExpression.trim()) {
    showMessage('Please enter an infix expression', 'error');
    return;
  }

  try {
    const postfix = infixToPostfix(infixExpression);
    expression = postfix;
    document.getElementById('expression-input').value = postfix;
    
    showPostfixResult(postfix);
    showMessage('Converted to postfix!', 'success');
  } catch (error) {
    showMessage('Invalid infix expression', 'error');
  }
}

function showPostfixResult(postfix) {
  const container = document.getElementById('postfix-result');
  const value = document.getElementById('postfix-value');
  
  container.classList.remove('hidden');
  value.textContent = postfix;
}

function hidePostfixResult() {
  document.getElementById('postfix-result').classList.add('hidden');
}