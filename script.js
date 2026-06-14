const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

let state = 'AWAITING_START';
let userName = '';
let variables = { ans: 0 };
let currentNumbers = [];

function gcd2(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function gcdArr(arr) {
    if (arr.length === 0) return 0;
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
        result = gcd2(result, arr[i]);
    }
    return result;
}

function resolveTokenValue(token, variablesTable) {
    const trimmed = token.trim();
    if (variablesTable.hasOwnProperty(trimmed)) {
        return variablesTable[trimmed];
    }
    if (/^-?\d+$/.test(trimmed)) {
        return parseInt(trimmed, 10);
    }
    return null;
}

function parseNumbers(inputStr, variablesTable) {
    const tokens = inputStr.trim().split(/[\s,;]+/);
    const result = [];

    for (let token of tokens) {
        if (token === "") continue;

        const rangeMatch = token.match(/^(.+?)\.{2,}(.+)$/);
        if (rangeMatch) {
            const leftStr = rangeMatch[1];
            const rightStr = rangeMatch[2];

            const leftVal = resolveTokenValue(leftStr, variablesTable);
            const rightVal = resolveTokenValue(rightStr, variablesTable);

            if (leftVal === null || rightVal === null) {
                throw new Error("Вводите только целые числа");
            }

            if (!Number.isInteger(leftVal) || !Number.isInteger(rightVal)) {
                throw new Error("Вводите только целые числа");
            }

            if (leftVal > rightVal) {
                throw new Error("Неверный формат ввода");
            }

            for (let i = leftVal; i <= rightVal; i++) {
                result.push(i);
            }
        } else {
            const val = resolveTokenValue(token, variablesTable);
            if (val === null) {
                throw new Error("Вводите только целые числа");
            }
            if (!Number.isInteger(val)) {
                throw new Error("Вводите только целые числа");
            }
            result.push(val);
        }
    }

    if (result.length === 0) {
        throw new Error("Вводите только целые числа");
    }

    return result;
}

function formatResult(val, op) {
    if (Number.isInteger(val)) return val;
    if (op === '/') return parseFloat(val.toFixed(4));
    if (op === 'avg') return parseFloat(val.toFixed(2));
    return parseFloat(val.toFixed(4));
}

function processInput(inputStr) {
    const input = inputStr.trim();
    
    if (input === '/stop') {
        state = 'AWAITING_START';
        userName = '';
        variables = { ans: 0 };
        currentNumbers = [];
        return 'Всего доброго, если хочешь поговорить пиши /start';
    }

    switch (state) {
        case 'AWAITING_START':
            if (input === '/start') {
                state = 'AWAITING_NAME';
                return 'Привет, меня зовут Чат-бот, а как зовут тебя?';
            } else {
                return 'Введите команду /start, для начала общения';
            }

        case 'AWAITING_NAME':
            const nameMatch = input.match(/^\/name:\s*(.+)$/);
            if (nameMatch) {
                userName = nameMatch[1].trim();
                state = 'AWAITING_NUMBERS';
                return `Привет ${userName}, приятно познакомится. Я умею считать, введи числа которые надо посчитать`;
            } else {
                return 'Я не понимаю, введите другую команду!';
            }

        case 'AWAITING_NUMBERS':
            const numbersMatch = input.match(/^\/numbers:\s*(.+)$/);
            if (numbersMatch) {
                try {
                    const parsed = parseNumbers(numbersMatch[1].trim(), variables);
                    currentNumbers = parsed;
                    state = 'AWAITING_OPERATION';
                    return 'Числа приняты. Введи действие: +, -, *, /, gcd, avg, min, max';
                } catch (e) {
                    return e.message;
                }
            }

            const setMatch = input.match(/^\/set:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
            if (setMatch) {
                const varName = setMatch[1];
                const varValStr = setMatch[2].trim();
                let val;

                if (variables.hasOwnProperty(varValStr)) {
                    val = variables[varValStr];
                } else if (/^-?\d+$/.test(varValStr)) {
                    val = parseInt(varValStr, 10);
                } else if (varValStr === 'ans') {
                    val = variables['ans'];
                } else {
                    return 'Вводите только целые числа';
                }

                variables[varName] = val;
                return `Переменная ${varName} = ${val} сохранена`;
            }

            return 'Я не понимаю, введите другую команду!';

        case 'AWAITING_OPERATION':
            const op = input.toLowerCase();
            const validOps = ['+', '-', '*', '/', 'gcd', 'avg', 'min', 'max'];
            
            if (validOps.includes(op)) {
                if (currentNumbers.length === 0) {
                    state = 'AWAITING_NUMBERS';
                    return 'Ошибка: числа не найдены. Введите числа заново с помощью /numbers:';
                }

                try {
                    let res;
                    if (op === '+') {
                        res = currentNumbers.reduce((a, b) => a + b, 0);
                    } else if (op === '-') {
                        res = currentNumbers.reduce((a, b) => a - b);
                    } else if (op === '*') {
                        res = currentNumbers.reduce((a, b) => a * b, 1);
                    } else if (op === '/') {
                        for (let i = 1; i < currentNumbers.length; i++) {
                            if (currentNumbers[i] === 0) {
                                state = 'AWAITING_NUMBERS';
                                return 'Ошибка: Деление на ноль';
                            }
                        }
                        res = currentNumbers.reduce((a, b) => a / b);
                    } else if (op === 'min') {
                        res = Math.min(...currentNumbers);
                    } else if (op === 'max') {
                        res = Math.max(...currentNumbers);
                    } else if (op === 'avg') {
                        const sum = currentNumbers.reduce((a, b) => a + b, 0);
                        res = sum / currentNumbers.length;
                    } else if (op === 'gcd') {
                        res = gcdArr(currentNumbers);
                    }

                    const formatted = formatResult(res, op);
                    variables['ans'] = formatted;
                    state = 'AWAITING_NUMBERS';
                    return `Результат: ${formatted}`;
                } catch (e) {
                    state = 'AWAITING_NUMBERS';
                    return `Ошибка вычислений: ${e.message}`;
                }
            } else {
                return 'Я не понимаю, введите другую команду!';
            }

        default:
            return 'Я не понимаю, введите другую команду!';
    }
}

function appendMessage(sender, text, isTyping = false) {
    const messageRow = document.createElement('div');
    messageRow.classList.add('message-row', sender);
    
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    
    const avatarImg = document.createElement('img');
    avatarImg.src = sender === 'user' ? 'user.png' : 'bot.png';
    avatarImg.alt = sender === 'user' ? 'User Avatar' : 'Bot Avatar';
    avatarDiv.appendChild(avatarImg);
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    
    if (isTyping) {
        bubbleDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
    } else {
        bubbleDiv.textContent = text;
    }
    
    messageRow.appendChild(avatarDiv);
    messageRow.appendChild(bubbleDiv);
    
    chatMessages.insertBefore(messageRow, chatMessages.firstChild);
    chatMessages.scrollTop = 0;
    
    return messageRow;
}

let userTypingIndicator = null;

chatInput.addEventListener('input', () => {
    const val = chatInput.value;
    if (val.length > 0) {
        sendBtn.disabled = false;
        if (!userTypingIndicator) {
            userTypingIndicator = appendMessage('user', '', true);
        }
    } else {
        sendBtn.disabled = true;
        if (userTypingIndicator) {
            userTypingIndicator.remove();
            userTypingIndicator = null;
        }
    }
});

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    if (userTypingIndicator) {
        userTypingIndicator.remove();
        userTypingIndicator = null;
    }
    
    appendMessage('user', text);
    
    chatInput.value = '';
    sendBtn.disabled = true;
    
    const botTypingIndicator = appendMessage('bot', '', true);
    
    setTimeout(() => {
        botTypingIndicator.remove();
        const response = processInput(text);
        appendMessage('bot', response);
    }, 850);
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        sendMessage();
    }
});
