window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// 快速获取任务 - 混合版本
// 确保按钮出现后再点击

var hasClicked4 = false;
var hasClicked2 = false;
var hasClicked3 = false;
var scriptStopped = false;
var lastLoginClickTime = 0;
var isLoggingIn = false;
var startTime = null;
var isWaitingForStartTime = false;
var hasSetStartTime = false;

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hideAutomation() {
    Object.defineProperty(navigator, 'webdriver', { get: function() { return false; } });
    Object.defineProperty(navigator, 'plugins', { get: function() { return [1, 2, 3, 4, 5]; } });
    Object.defineProperty(navigator, 'languages', { get: function() { return ['zh-CN', 'zh', 'en']; } });
    window.chrome = { runtime: {} };
}

function findByXPath(xpath) {
    try {
        var result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
    } catch (e) {
        return null;
    }
}

function waitForElement(selector, callback, maxWait) {
    var startTime = Date.now();
    
    function check() {
        var element = selector();
        if (element) {
            callback(element);
            return;
        }
        
        if (Date.now() - startTime > maxWait) {
            return;
        }
        
        setTimeout(check, 50);
    }
    
    check();
}

function isLoginPage() {
    var usernameInput = document.querySelector("#app > div > form > div:nth-child(1) > div > div.el-input.el-input--suffix > input");
    var loginButton = document.querySelector("#app > div > span > button:nth-child(1)");
    return !!(usernameInput && loginButton);
}

function resetTaskState() {
    hasClicked4 = false;
    hasClicked2 = false;
    hasClicked3 = false;
    console.log('状态已重置');
}

function createTimeDialog() {
    var dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
    `;
    
    var content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        text-align: center;
        min-width: 300px;
    `;
    
    var title = document.createElement('h2');
    title.textContent = '🎯 设置启动时间';
    title.style.cssText = 'margin: 0 0 20px 0; color: #333;';
    
    var timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.value = '10:00';
    timeInput.style.cssText = `
        padding: 10px;
        font-size: 16px;
        border: 2px solid #ddd;
        border-radius: 5px;
        margin: 10px 0;
        width: 120px;
    `;
    
    var buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin-top: 20px; display: flex; gap: 10px; justify-content: center;';
    
    var startNowBtn = document.createElement('button');
    startNowBtn.textContent = '立即开始';
    startNowBtn.style.cssText = `
        padding: 10px 20px;
        background: #f0f0f0;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    
    var confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确认时间';
    confirmBtn.style.cssText = `
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    
    var infoText = document.createElement('p');
    infoText.textContent = '默认时间：10:00';
    infoText.style.cssText = 'color: #666; font-size: 12px; margin: 10px 0 0 0;';
    
    content.appendChild(title);
    content.appendChild(document.createElement('br'));
    content.appendChild(timeInput);
    content.appendChild(document.createElement('br'));
    buttonContainer.appendChild(startNowBtn);
    buttonContainer.appendChild(confirmBtn);
    content.appendChild(buttonContainer);
    content.appendChild(infoText);
    dialog.appendChild(content);
    
    document.body.appendChild(dialog);
    
    return new Promise((resolve) => {
        startNowBtn.onclick = function() {
            document.body.removeChild(dialog);
            resolve({ type: 'now' });
        };
        
        confirmBtn.onclick = function() {
            var timeStr = timeInput.value;
            document.body.removeChild(dialog);
            resolve({ type: 'time', value: timeStr });
        };
    });
}

function showStartTimeDialog() {
    isWaitingForStartTime = true;
    
    createTimeDialog().then(function(result) {
        if (result.type === 'now') {
            console.log('立即开始');
            hasSetStartTime = true;
            isWaitingForStartTime = false;
            return;
        }
        
        var timeStr = result.value;
        
        if (!timeStr) {
            console.log('立即开始');
            hasSetStartTime = true;
            isWaitingForStartTime = false;
            return;
        }
        
        var now = new Date();
        var timeParts = timeStr.split(':');
        
        var hours = parseInt(timeParts[0]);
        var minutes = parseInt(timeParts[1]);
        
        var targetTime = new Date();
        targetTime.setHours(hours, minutes, 0, 0);
        
        if (targetTime < now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        startTime = targetTime;
        hasSetStartTime = true;
        
        var waitMs = targetTime - now;
        var waitMinutes = Math.floor(waitMs / 60000);
        var waitSeconds = Math.floor((waitMs % 60000) / 1000);
        
        console.log('设置启动时间: ' + timeStr + ', 等待 ' + waitMinutes + '分' + waitSeconds + '秒');
        
        setTimeout(function() {
            isWaitingForStartTime = false;
            console.log('时间到，开始执行任务！');
        }, waitMs);
    });
}

function checkStartTime() {
    if (!hasSetStartTime) {
        return false;
    }
    
    if (isWaitingForStartTime) {
        var now = new Date();
        var waitMs = startTime - now;
        
        if (waitMs <= 0) {
            isWaitingForStartTime = false;
            return true;
        }
        
        var minutes = Math.floor(waitMs / 60000);
        var seconds = Math.floor((waitMs % 60000) / 1000);
        
        if (minutes % 1 === 0 && seconds === 0) {
            console.log('距离启动还有 ' + minutes + '分钟');
        }
        
        return false;
    }
    
    return true;
}

function handleLoginPage() {
    if (!isLoginPage()) return;
    
    var now = Date.now();
    
    if (!isLoggingIn) {
        resetTaskState();
        
        if (now - lastLoginClickTime < 3000) return;
        
        var usernameInput = document.querySelector("#app > div > form > div:nth-child(1) > div > div.el-input.el-input--suffix > input");
        var passwordInput = document.querySelector("#app > div > form > div:nth-child(2) > div > div:nth-child(1) > div > input");
        var loginButton = document.querySelector("#app > div > span > button:nth-child(1)");
        
        if (usernameInput && passwordInput && loginButton) {
            usernameInput.value = 'To-700';
            usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
            usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            setTimeout(function() {
                passwordInput.value = 'B96GppB75hUw';
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                setTimeout(function() {
                    loginButton.click();
                    lastLoginClickTime = Date.now();
                    isLoggingIn = true;
                    console.log('已点击: 登录，等待跳转...');
                }, randomDelay(100, 200));
            }, randomDelay(50, 100));
        }
    }
}

function checkAndClickBtn4() {
    if (scriptStopped || hasClicked4) return;
    if (isLoginPage() || isLoggingIn || !checkStartTime()) return;
    
    var xpath = "//button[contains(@class,'el-button--primary')]//span[contains(text(),'领取今日任务')]";
    
    waitForElement(
        function() { return findByXPath(xpath); },
        function(btn) {
            if (btn && btn.parentElement) {
                var delay = randomDelay(100, 300);
                setTimeout(function() {
                    btn.parentElement.click();
                    hasClicked4 = true;
                    console.log('已点击: 领取今日任务');
                }, delay);
            }
        },
        5000
    );
}

function checkAndClickBtn2() {
    if (scriptStopped || !hasClicked4 || hasClicked2) return;
    if (isLoginPage() || isLoggingIn || !checkStartTime()) return;
    
    var xpath = "//button[contains(@class,'el-button--primary')]//span[contains(text(),'确认并拉取任务')]";
    
    waitForElement(
        function() { return findByXPath(xpath); },
        function(btn) {
            if (btn && btn.parentElement) {
                var delay = randomDelay(100, 300);
                setTimeout(function() {
                    btn.parentElement.click();
                    hasClicked2 = true;
                    console.log('已点击: 确认并拉取任务');
                }, delay);
            }
        },
        5000
    );
}

function checkBtn3AndStop() {
    if (scriptStopped) return;
    if (!hasClicked2) return;
    if (isLoginPage() || isLoggingIn || !checkStartTime()) return;
    
    var xpath3 = "//button[contains(@class,'el-button--primary')]//span[contains(text(),'重新获取任务')]";
    
    waitForElement(
        function() { return findByXPath(xpath3); },
        function(btn3) {
            if (btn3 && btn3.parentElement && !hasClicked3) {
                var delay3 = randomDelay(100, 300);
                setTimeout(function() {
                    btn3.parentElement.click();
                    hasClicked3 = true;
                    console.log('已点击: 重新获取任务');
                }, delay3);
            }
        },
        3000
    );
    
    var errorText = findByXPath("//span[contains(text(),'响应码异常:3,参数异常')]");
    
    if (errorText) {
        console.log('检测到错误: 响应码异常');
        
        var backBtn = document.querySelector("#app > section > main > div > button");
        
        waitForElement(
            function() { return backBtn; },
            function(btn) {
                setTimeout(function() {
                    btn.click();
                    console.log('已点击: 返回');
                }, randomDelay(50, 150));
            },
            2000
        );
        
        var checkConfirm = setInterval(function() {
            var btn = document.querySelector("body > div.el-message-box__wrapper > div > div.el-message-box__btns > button.el-button.el-button--default.el-button--small.el-button--primary");
            if (btn) {
                clearInterval(checkConfirm);
                setTimeout(function() {
                    btn.click();
                    console.log('已点击: 确定');
                    
                    hasClicked4 = false;
                    hasClicked2 = false;
                    hasClicked3 = false;
                    console.log('状态已重置，重新尝试...');
                }, randomDelay(50, 150));
            }
        }, 50);
        return;
    }
    
    var xpath4 = "//button[contains(@class,'el-button--primary')]//span[contains(text(),'开始执行任务')]";
    var btn4 = findByXPath(xpath4);
    
    if (btn4) {
        scriptStopped = true;
        console.log('✅ 任务获取成功！可以开始执行任务了');
        return;
    }
    
    if (hasClicked3) {
        hasClicked3 = false;
    }
}

function autoFillLogin() {
    function loop() {
        if (scriptStopped) return;
        
        if (isLoginPage()) {
            handleLoginPage();
        } else {
            if (isLoggingIn) {
                console.log('登录成功，设置启动时间...');
                isLoggingIn = false;
                showStartTimeDialog();
            }
            
            if (checkStartTime()) {
                checkAndClickBtn4();
                checkAndClickBtn2();
                checkBtn3AndStop();
            }
        }
        
        setTimeout(loop, 100);
    }
    
    setTimeout(loop, randomDelay(500, 800));
}

document.addEventListener('DOMContentLoaded', function() {
    hideAutomation();
    autoFillLogin();
});
