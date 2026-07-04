// ==UserScript==
// @name         DeepSeek Always Answer in English
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Auto-prepends system instruction and auto-sends on DeepSeek chat
// @author       You
// @match        https://chat.deepseek.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const PREFIX = '[SYSTEM INSTRUCTION: You MUST respond in English only. Do not write in Chinese or any other language.]\n\n';
    let _busy = false;

    function prependAndSend(e) {
        if (_busy) return;
        const sendBtn = e.target.closest('.ds-button--primary');
        if (!sendBtn) return;

        const textarea = document.querySelector('textarea');
        if (!textarea || !textarea.value.trim()) return;
        if (textarea.value.startsWith(PREFIX.trim())) return;

        _busy = true;

        // React-compatible value setter
        const setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
        ).set;
        setter.call(textarea, PREFIX + textarea.value);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // Programmatically click send button to auto-send
        sendBtn.click();

        setTimeout(() => { _busy = false; }, 500);
    }

    document.addEventListener('pointerdown', prependAndSend, true);

    // Also handle Enter key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const textarea = document.querySelector('textarea');
            if (!textarea || !textarea.value.trim()) return;
            if (textarea.value.startsWith(PREFIX.trim())) return;

            _busy = true;
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 'value'
            ).set;
            setter.call(textarea, PREFIX + textarea.value);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            // Enter key already triggers send, so nothing extra needed
            setTimeout(() => { _busy = false; }, 500);
        }
    }, true);
})();