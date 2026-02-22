window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});var scheduledTime = null;
var isTaskRunning = false;
var taskStep1Attempts = 0;
var maxTaskAttempts = 20;
var failCheckCount = 0;
var maxFailCheckCount = 3000;
var attempts = 0;
var maxAttempts = 20;
var loginAttempts = 0;
var maxLoginAttempts = 50;
var isLoggedIn = false;

function log(msg, type) {
    try {
        var d = new Date();
        var timeStr = d.toLocaleTimeString();
        var ms = d.getMilliseconds();
        var output = '[AutoLogin ' + timeStr + '.' + ms + '] ' + msg;
        
        var style = 'color: #333;';
        if (type === 'info') {
            style = 'color: #409EFF; font-weight: bold;';
        } else if (type === 'success') {
            style = 'color: #67C23A; font-weight: bold;';
        } else if (type === 'error') {
            style = 'color: #F56C6C; font-weight: bold;';
        } else if (type === 'warn') {
            style = 'color: #E6A23C;';
        }
        
        if (typeof window.console !== 'undefined' && typeof window.console.log === 'function') {
            console.log('%c' + output, style);
        }
    } catch(e) {}
}

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function simulateClick(element, callback) {
    var rect = element.getBoundingClientRect();
    var x = rect.left + rect.width / 2 + randomDelay(-5, 5);
    var y = rect.top + rect.height / 2 + randomDelay(-5, 5);
    
    if (element.scrollIntoView) {
        element.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
    
    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
    element.click();
    
    if (callback) {
        setTimeout(callback, 50);
    }
}

function triggerInputEvent(element) {
    var events = ['input', 'change', 'blur'];
    events.forEach(function(eventType) {
        var event = new Event(eventType, { bubbles: true });
        element.dispatchEvent(event);
    });
}

function executeTask() {
    if (isTaskRunning) {
        return;
    }
    isTaskRunning = true;
    failCheckCount = 0;
    
    log('开始执行任务', 'info');
    taskStep1Attempts = 0;
    executeTaskStep1();
}

function executeTaskStep1() {
    taskStep1Attempts++;
    log('尝试查找领取任务按钮, attempt: ' + taskStep1Attempts, 'warn');
    
    var taskBtn = null;
    
    var taskBtnSpan = document.evaluate(
        '//span[contains(text(),"领取今日任务")]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    taskBtn = taskBtnSpan ? taskBtnSpan.parentElement : null;
    
    if (taskBtn) {
        log('找到领取今日任务按钮', 'success');
        simulateClick(taskBtn, function() {
            log('已点击领取今日任务按钮', 'success');
            isTaskRunning = false;
            checkConfirmAndExecute();
        });
    } else if (taskStep1Attempts < maxTaskAttempts) {
        setTimeout(executeTaskStep1, 300);
    } else {
        log('未找到领取今日任务按钮，任务结束', 'error');
        isTaskRunning = false;
    }
}

function checkConfirmAndExecute() {
    var confirmBtnSpan = document.evaluate(
        '//span[contains(text(),"确认并拉取任务")]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    var confirmBtn = confirmBtnSpan ? confirmBtnSpan.parentElement : null;
    
    if (confirmBtn) {
        log('找到确认按钮', 'success');
        simulateClick(confirmBtn, function() {
            log('已点击确认按钮，等待检查失败信息', 'success');
            setTimeout(checkTaskFailure, 300);
        });
    } else {
        log('未找到确认按钮，300ms后重试', 'warn');
        setTimeout(checkConfirmAndExecute, 300);
    }
}

function checkTaskFailure() {
    if (failCheckCount >= maxFailCheckCount) {
        log('失败检测已达到最大次数，任务结束', 'error');
        return;
    }
    failCheckCount++;
    
    var errorSpan = document.evaluate(
        '//span[contains(text(),"响应码异常:3,参数异常")]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    
    if (!errorSpan) {
        var allSpans = document.querySelectorAll('span');
        for (var k = 0; k < allSpans.length; k++) {
            if (allSpans[k].textContent.indexOf('响应码异常') !== -1) {
                errorSpan = allSpans[k];
                break;
            }
        }
    }
    
    if (errorSpan) {
        log('检测到参数异常错误，点击取消任务按钮', 'error');
        
        var cancelBtnSpan = document.evaluate(
            '//span[contains(text(),"取消任务｜返回首页")]',
            document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
        ).singleNodeValue;
        
        if (cancelBtnSpan) {
            var cancelBtn = cancelBtnSpan.parentElement;
            if (cancelBtn && cancelBtn.tagName === 'BUTTON') {
                simulateClick(cancelBtn, function() {
                    log('已点击取消任务按钮，等待确认按钮出现', 'warn');
                    
                    var checkConfirmBtn = setInterval(function() {
                        var confirmBtn = document.querySelector('button.el-button.el-button--default.el-button--small.el-button--primary');
                        if (confirmBtn) {
                            clearInterval(checkConfirmBtn);
                            log('找到确认按钮，点击', 'success');
                            simulateClick(confirmBtn, function() {
                                log('已点击确认按钮，重新执行任务', 'success');
                                failCheckCount = 0;
                                executeTaskStep1();
                            });
                        }
                    }, 500);
                });
                return;
            }
        }
        
        location.reload();
        return;
    }
    
    var failSpan = document.evaluate(
        '//span[text()="获取任务失败 ｜ 等待重新获取任务"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    
    if (failSpan) {
        log('检测到失败信息', 'warn');
        var failBtn = document.querySelector('#app > section.el-container > main.el-main > div.businessTaskPage > button.el-button:nth-of-type(2)');
        if (failBtn) {
            log('点击重新获取按钮', 'error');
            simulateClick(failBtn, function() {
                log('已点击重新获取', 'error');
            });
        }
    }
    
    var finishSpan = document.querySelector('#app > section > main > div > button:nth-child(4) > span');
    if (finishSpan) {
        log('检测到任务完成按钮，脚本停止运行', 'success');
        isTaskRunning = false;
        return;
    }
    
    setTimeout(checkTaskFailure, 200);
}

function checkLogoutAndPrompt() {
    loginAttempts++;
    
    var logoutSpan = document.evaluate(
        '//span[text()="退出"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    
    log('检查退出按钮, attempt: ' + loginAttempts + ', found: ' + (logoutSpan !== null), 'warn');
    
    if (logoutSpan) {
        log('找到退出按钮，弹出设置时间', 'success');
        var defaultTime = '09:59:58';
        createCustomPrompt(defaultTime, function(userTime) {
            scheduledTime = userTime;
            log('已设置运行时间: ' + scheduledTime, 'info');
            waitForScheduledTime();
        }, function() {
            executeTask();
        });
    } else if (loginAttempts < maxLoginAttempts) {
        setTimeout(checkLogoutAndPrompt, 500);
    }
}

function autoLogin() {
    if (isLoggedIn) {
        return;
    }
    
    attempts++;
    
    var inputs = document.querySelectorAll('input');
    var usernameInput = null;
    var passwordInput = null;
    
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.type === 'text' && input.placeholder === '输入用户名称') {
            usernameInput = input;
        }
        if (input.type === 'password' && input.placeholder === '请输入密码') {
            passwordInput = input;
        }
    }
    
    var buttons = document.querySelectorAll('button');
    var loginButton = null;
    
    for (var j = 0; j < buttons.length; j++) {
        var btn = buttons[j];
        if (btn.textContent === '登录' && btn.type === 'button') {
            loginButton = btn;
            break;
        }
    }
    
    if (usernameInput && passwordInput && loginButton) {
        log('找到登录表单，开始自动登录', 'info');
        simulateClick(usernameInput, function() {
            usernameInput.focus();
            setTimeout(function() {
                var username = 'To-700';
                var charIndex = 0;
                
                function typeUsername() {
                    if (charIndex < username.length) {
                        usernameInput.value = username.substring(0, charIndex + 1);
                        triggerInputEvent(usernameInput);
                        charIndex++;
                        setTimeout(typeUsername, randomDelay(50, 150));
                    } else {
                        log('用户名输入完成', 'success');
                        setTimeout(function() {
                            simulateClick(passwordInput, function() {
                                passwordInput.focus();
                                setTimeout(function() {
                                    var password = 'B96GppB75hUw';
                                    var pwdIndex = 0;
                                    
                                    function typePassword() {
                                        if (pwdIndex < password.length) {
                                            passwordInput.value = password.substring(0, pwdIndex + 1);
                                            triggerInputEvent(passwordInput);
                                            pwdIndex++;
                                            setTimeout(typePassword, randomDelay(50, 150));
                                        } else {
                                            log('密码输入完成', 'success');
                                            setTimeout(function() {
                                                log('已点击登录按钮', 'success');
                                                simulateClick(loginButton, function() {
                                                    isLoggedIn = true;
                                                    setTimeout(checkLogoutAndPrompt, 1000);
                                                });
                                            }, randomDelay(2000, 4000));
                                        }
                                    }
                                    
                                    typePassword();
                                }, randomDelay(1000, 2000));
                            });
                        }, randomDelay(1000, 2000));
                    }
                }
                
                typeUsername();
            }, randomDelay(1000, 2000));
        });
    } else {
        log('未找到登录表单', 'error');
    }
}

function createCustomPrompt(defaultTime, callback, runNowCallback) {
    log('创建自定义弹窗', 'info');
    
    var overlay = document.createElement('div');
    overlay.id = 'auto-login-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;';
    
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;padding:30px;border-radius:10px;min-width:300px;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    
    var title = document.createElement('div');
    title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:20px;color:#333;';
    title.textContent = '设置脚本运行时间';
    
    var timeContainer = document.createElement('div');
    timeContainer.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:20px;';
    
    var hourInput = document.createElement('input');
    hourInput.type = 'text';
    hourInput.maxLength = 2;
    hourInput.placeholder = '09';
    hourInput.style.cssText = 'width:40px;padding:10px;font-size:16px;text-align:center;border:1px solid #ddd;border-radius:5px;';
    
    var colon1 = document.createElement('span');
    colon1.textContent = ':';
    colon1.style.cssText = 'font-size:18px;font-weight:bold;';
    
    var minuteInput = document.createElement('input');
    minuteInput.type = 'text';
    minuteInput.maxLength = 2;
    minuteInput.placeholder = '59';
    minuteInput.style.cssText = 'width:40px;padding:10px;font-size:16px;text-align:center;border:1px solid #ddd;border-radius:5px;';
    
    var colon2 = document.createElement('span');
    colon2.textContent = ':';
    colon2.style.cssText = 'font-size:18px;font-weight:bold;';
    
    var secondInput = document.createElement('input');
    secondInput.type = 'text';
    secondInput.maxLength = 2;
    secondInput.placeholder = '58';
    secondInput.style.cssText = 'width:40px;padding:10px;font-size:16px;text-align:center;border:1px solid #ddd;border-radius:5px;';
    
    hourInput.addEventListener('keydown', function(e) {
        if (!((e.key >= '0' && e.key <= '9') || e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab')) {
            e.preventDefault();
        }
    });
    
    minuteInput.addEventListener('keydown', function(e) {
        if (!((e.key >= '0' && e.key <= '9') || e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab')) {
            e.preventDefault();
        }
    });
    
    secondInput.addEventListener('keydown', function(e) {
        if (!((e.key >= '0' && e.key <= '9') || e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab')) {
            e.preventDefault();
        }
    });
    
    hourInput.addEventListener('input', function() {
        var val = this.value.replace(/\D/g, '');
        if (val.length > 2) val = val.substring(0, 2);
        var num = parseInt(val);
        if (num > 23) val = '23';
        this.value = val;
        if (this.value.length === 2) {
            minuteInput.focus();
        }
    });
    
    minuteInput.addEventListener('input', function() {
        var val = this.value.replace(/\D/g, '');
        if (val.length > 2) val = val.substring(0, 2);
        var num = parseInt(val);
        if (num > 59) val = '59';
        this.value = val;
        if (this.value.length === 2) {
            secondInput.focus();
        }
    });
    
    secondInput.addEventListener('input', function() {
        var val = this.value.replace(/\D/g, '');
        if (val.length > 2) val = val.substring(0, 2);
        var num = parseInt(val);
        if (num > 59) val = '59';
        this.value = val;
    });
    
    timeContainer.appendChild(hourInput);
    timeContainer.appendChild(colon1);
    timeContainer.appendChild(minuteInput);
    timeContainer.appendChild(colon2);
    timeContainer.appendChild(secondInput);
    
    var btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:10px;';
    
    var btnRunNow = document.createElement('button');
    btnRunNow.textContent = '立即运行';
    btnRunNow.style.cssText = 'flex:1;padding:12px;font-size:16px;background:#67C23A;color:#fff;border:none;border-radius:5px;cursor:pointer;';
    
    var btnConfirm = document.createElement('button');
    btnConfirm.textContent = '确定';
    btnConfirm.style.cssText = 'flex:1;padding:12px;font-size:16px;background:#409EFF;color:#fff;border:none;border-radius:5px;cursor:pointer;';
    
    btnRunNow.onclick = function() {
        overlay.remove();
        if (runNowCallback) {
            runNowCallback();
        }
    };
    
    btnConfirm.onclick = function() {
        var hour = hourInput.value || '09';
        var minute = minuteInput.value || '59';
        var second = secondInput.value || '58';
        
        if (hour.length === 1) hour = '0' + hour;
        if (minute.length === 1) minute = '0' + minute;
        if (second.length === 1) second = '0' + second;
        
        var time = hour + ':' + minute + ':' + second;
        
        overlay.remove();
        if (callback) {
            callback(time);
        }
    };
    
    btnContainer.appendChild(btnRunNow);
    btnContainer.appendChild(btnConfirm);
    
    box.appendChild(title);
    box.appendChild(timeContainer);
    box.appendChild(btnContainer);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    log('自定义弹窗已创建', 'success');
}

function waitForScheduledTime() {
    if (!scheduledTime) {
        log('未设置运行时间', 'error');
        return;
    }
    
    var now = new Date();
    var currentTime = now.toTimeString().substring(0, 8);
    
    log('当前时间: ' + currentTime + ', 目标时间: ' + scheduledTime, 'warn');
    
    if (currentTime >= scheduledTime) {
        log('到达目标时间，开始执行任务', 'success');
        executeTask();
    } else {
        setTimeout(waitForScheduledTime, 1000);
    }
}

log('脚本启动', 'info');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoLogin);
} else {
    autoLogin();
}
