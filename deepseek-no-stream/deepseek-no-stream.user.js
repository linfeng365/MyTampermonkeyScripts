// ==UserScript==
// @name         DeepSeek Chat - 禁用流式打字效果 + 防滚动 大纲 36
// @name:en      DeepSeek Chat - Disable Streaming & Auto-Scroll 36
// @namespace    https://github.com/tampermonkey-scripts
// @version      2.4
// @description  禁用 AI 流式打字效果（生成完成后一次性显示）+ 生成过程中阻止页面自动滚动
// @author       You
// @match        https://chat.deepseek.com/*
// @icon         https://chat.deepseek.com/favicon.ico
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // ========================================
  // 配置
  // ========================================
  const CONFIG = {
    SCROLL_CONTAINER: ".ds-virtual-list, [class*='virtual-list']",
    MD_CONTENT: [
      '[class*="ds-markdown"]',
      '[class*="markdown-body"]',
      '[class*="message-content"]',
      '[class*="msg-content"]',
      '[class*="response-content"]',
      '[class*="chat-message"]',
      '.markdown',
      '[data-testid="message-content"]',
    ].join(","),
    STREAM_IDLE_TIMEOUT: 1200,
    POLL_INTERVAL: 200,
  };

  // ========================================
  // 状态
  // ========================================
  let streamingCount = 0;
  let aiGenerating = false; // AI 是否正在生成
  // 立即检查停止按钮状态（不等 300ms 后首次轮询）
  (function() {
    var btn = document.querySelector('[class*="stop"] button, button[class*="stop"], [class*="stop-generate"], [aria-label*="stop" i]');
    if (btn && btn.offsetParent !== null) aiGenerating = true;
  })();

  // ========================================
  // CSS
  // ========================================
  GM_addStyle(`
    ._ds_hide { opacity: 0 !important; transition: none !important; }
    ._ds_hide_final { opacity: 1 !important; }
    ._ds_hint {
      color: #888;
      padding: 12px;
      font-size: 13px;
      user-select: none;
      background: linear-gradient(90deg, #888 0%, #fff 40%, #888 80%);
      background-size: 200% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: _ds_shimmer 1.8s ease-in-out infinite;
    }
    @keyframes _ds_shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    ._ds_outline {
      border: 1px solid rgba(128,128,128,0.3);
      border-radius: 8px;
      padding: 12px 16px;
      margin: 8px 0 16px 0;
      background: rgba(255,255,255,0.04);
        font-family: "宋体", "SimSun", serif;
    }
    ._ds_outline_title {
      font-weight: 700;
      margin-bottom: 6px;
      font-size: 15px;         /* ← 标题字号 */
      color: #aaa;
    }
    ._ds_outline_item {
      font-size: 17px;         /* ← 条目字号 */
      line-height: 1.5;
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    ._ds_outline_h1 { padding-left: 0; font-weight: 600; font-size: 15px; }
    ._ds_outline_h2 { padding-left: 18px; }
    ._ds_outline_h3 { padding-left: 36px; }
    ._ds_outline_h4 { padding-left: 54px; }
    ._ds_outline_h5 { padding-left: 72px; }
    ._ds_outline_h6 { padding-left: 90px; }
  `);

  // ========================================
  // 拦截程序化滚动（流式生成时阻止 AI 自动滚动）
  // ========================================
  // 只拦截 scrollIntoView 和 scrollTo，不干扰用户手动滚动。
  // 不设 scroll 事件锁，确保拖拽滚动条、触控板等所有用户交互完全正常。

  var nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function () {
    if (streamingCount > 0) {
      if (this.matches('.ds-virtual-list, .ds-virtual-list *') || this.closest('.ds-virtual-list')) return;
    }
    return nativeScrollIntoView.apply(this, arguments);
  };

  // --- 拦截 window.scrollTo ---
  var nativeScrollTo = window.scrollTo.bind(window);
  window.scrollTo = function () {
    if (streamingCount > 0) return;
    return nativeScrollTo.apply(window, arguments);
  };
  window.scroll = window.scrollTo;


  // ========================================
  // 插入大纲
  // ========================================
  function insertOutline(container) {
    if (container._ds_outline_inserted) return [];
    var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length < 2) return [];

    var html = '<div class="_ds_outline">' +
      '<div class="_ds_outline_title"></div>' +
      '<div class="_ds_outline_items">';
/* ← 标题字号 */
    headings.forEach(function(h) {
      var level = parseInt(h.tagName.substring(1));
      var text = h.textContent.trim();
      if (!text) return;
      html += '<div class="_ds_outline_item _ds_outline_h' + level + '">· ' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
    });

    html += '</div></div>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var headEl = wrapper.firstElementChild;
    container.insertBefore(headEl, container.firstChild);

    var tailEl = headEl.cloneNode(true);
    container.appendChild(tailEl);

    container._ds_outline_inserted = true;
    return [headEl, tailEl];
  }

  // ========================================
  // Thinking Hint
  // ========================================
  function showThinkingHint(container) {
    if (container._ds_hintEl) return;
    var hint = document.createElement("div");
    hint.className = "_ds_hint";
    hint.textContent = "✨ AI 正在思考，生成完成后将完整显示...";
    container._ds_hintEl = hint;
    container.parentNode && container.parentNode.insertBefore(hint, container);
  }

  function removeThinkingHint(container) {
    var hint = container._ds_hintEl;
    if (hint) {
      hint.remove();
      delete container._ds_hintEl;
    }
  }

  // ========================================
  // 生成大纲文本（不依赖 DOM 元素）
  // ========================================
  function getOutlineText(container) {
    if (!container) return "";
    var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length < 2) return "";
    // 计算最浅标题级别
    var minLevel = 7;
    headings.forEach(function(h) {
      var lvl = parseInt(h.tagName.substring(1));
      if (lvl < minLevel) minLevel = lvl;
    });
    var lines = ["> 📚 大纲"];
    headings.forEach(function(h) {
      var text = h.textContent.trim();
      if (!text) return;
      var lvl = parseInt(h.tagName.substring(1));
      var indent = (lvl - minLevel) * 2;
      var pad = indent > 0 ? new Array(indent + 1).join(" ") : "";
      lines.push("> " + pad + text);
    });
    return lines.join("\n");
  }

  // ========================================
  // 监视 AI 回复容器
  // ========================================
  function watchResponseContainer(container) {
    if (container._ds_watched) return;

    let lastText = container.textContent || "";
    let idleTimer = null;
    let observer = null;
    let isActive = false;

    // 如果容器已有完整内容（非空且可能是已完成的消息），直接插入大纲和最终样式
    if (lastText.length > 50) {
      insertOutline(container);
      container.classList.add("_ds_hide_final");
    }

    container._ds_watched = true;

    function markStart() {
      if (!isActive) {
        isActive = true;
        streamingCount++;

        container.classList.add("_ds_hide");
        container.classList.remove("_ds_hide_final");
        // 流式生成时隐藏大纲
        container.querySelectorAll("._ds_outline").forEach(function(el) { el.classList.add("_ds_hide"); });
        showThinkingHint(container);
      }
    }

    function markEnd() {
      if (isActive) {
        isActive = false;
        streamingCount = Math.max(0, streamingCount - 1);
        // 先移除 thinking hint（它在容器外部，必须先移除避免布局抖动）
        removeThinkingHint(container);
        // 插入大纲（容器仍隐藏，布局变化不可见）
        insertOutline(container);
        // 统一显示：容器 + 首尾大纲同时可见
        container.classList.remove("_ds_hide");
        container.classList.add("_ds_hide_final");
        container.querySelectorAll("._ds_outline").forEach(function(el) { el.classList.remove("_ds_hide"); });
        // 更新 lastText 防止大纲插入触发 MutationObserver 误判
        lastText = container.textContent || "";
        if (streamingCount === 0) {
        }
      }
    }

    function onTextChange() {
      const currentText = container.textContent || "";
      if (currentText === lastText) return;
      lastText = currentText;

      // AI 未在生成且内容已充分 → React 虚拟列表渲染已有消息，直接显示大纲
      if (!isActive && currentText.length > 0 && !aiGenerating) {
        var els = insertOutline(container);
        if (els.length > 0) container.classList.add("_ds_hide_final");
        return;
      }

      markStart();

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        markEnd();
        idleTimer = null;
      }, CONFIG.STREAM_IDLE_TIMEOUT);
    }

    observer = new MutationObserver(onTextChange);
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // 轮询兜底（React 异步渲染）
    const pollTimer = setInterval(() => {
      if (!document.contains(container)) {
        clearInterval(pollTimer);
        if (observer) observer.disconnect();
        if (idleTimer) clearTimeout(idleTimer);
        markEnd();
        container._ds_watched = false;
        return;
      }
      onTextChange();
    }, CONFIG.POLL_INTERVAL);
  }

  // ========================================
  // 定位 AI 回复容器
  // ========================================
  function findResponseContainers() {
    const candidates = document.querySelectorAll(CONFIG.MD_CONTENT);

    for (const el of candidates) {
      const isAssistant =
        el.closest('[class*="assistant"], [class*="bot"], [class*="ai"], [class*="reply"]');
      const isMessage = el.closest('[class*="ds-chat-message"], [class*="message-item"]');
      if (isAssistant || isMessage) {
        watchResponseContainer(el);
      }
    }
  }

  // ========================================
  // 监听"停止生成"按钮 → 强制完成
  // ========================================
  (function watchStopButton() {
    let wasVisible = false;
    setInterval(() => {
      const btn = document.querySelector(
        '[class*="stop"] button, button[class*="stop"], [class*="stop-generate"], [aria-label*="stop" i]'
      );
      if (btn && btn.offsetParent !== null) {
        wasVisible = true;
        aiGenerating = true;
      } else if (wasVisible) {
        // 停止按钮从可见变为不可见 → 所有流已结束
        wasVisible = false;
        aiGenerating = false;
        document.querySelectorAll("._ds_hide").forEach((el) => {
          el.classList.remove("_ds_hide");
          el.classList.add("_ds_hide_final");
        });
        streamingCount = 0;
      }
    }, 300);
  })();

  // ========================================
  // 复制时包含大纲
  // ========================================
  // 记录最后一次点击的消息容器（带大纲的）
  document.addEventListener("click", function(e) {
    document._ds_lastCopyContainer = null;
    // 从点击目标向上找包含 AI 回复的容器
    var itemEl = e.target.closest('[data-virtual-list-item-key]');
    if (!itemEl) return;
    var c = itemEl.querySelector(CONFIG.MD_CONTENT);
    // 有 _ds_outline 元素或至少有 2 个标题就算
    if (c && (c.querySelector("._ds_outline") || c.querySelectorAll("h1,h2,h3,h4,h5,h6").length >= 2)) {
      document._ds_lastCopyContainer = c;
    }
  }, true);

  // 注：navigator.clipboard 在 Tampermonkey 沙箱中可能不可用，
  // 因此通过 <script> 注入到页面上下文执行
  var _clipInject = document.createElement("script");
  _clipInject.textContent = `
(function(){
  function _dsOutlineText(){
    var c=document._ds_lastCopyContainer;
    if(!c)return"";
    // 从标题实时生成大纲（不依赖 DOM 中已插入的 _ds_outline 元素）
    var hs=c.querySelectorAll('h1,h2,h3,h4,h5,h6');
    if(hs.length<2)return"";
    // 计算最浅标题级别
    var minLvl=7;
    for(var i=0;i<hs.length;i++){
      var l=parseInt(hs[i].tagName.substring(1));
      if(l<minLvl)minLvl=l;
    }
    var lines=["> 📚 大纲"];
    for(var i=0;i<hs.length;i++){
      var t=hs[i].textContent.trim();
      if(t){
        var lvl=parseInt(hs[i].tagName.substring(1));
        var ind=(lvl-minLvl)*2;
        var pad=ind>0?new Array(ind+1).join(" "):"";
        lines.push("> "+pad+t);
      }
    }
    return lines.join("\\n");
  }
  var _ot,_ow,_ow2;
  // writeText 拦截
  if(navigator.clipboard&&navigator.clipboard.writeText){
    _ow=navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText=function(t){
      _ot=_dsOutlineText();
      if(_ot&&t.indexOf("大纲")===-1)t=_ot+"\\n\\n"+t;
      return _ow(t);
    };
  }
  // write 拦截
  if(navigator.clipboard&&navigator.clipboard.write){
    _ow2=navigator.clipboard.write.bind(navigator.clipboard);
    navigator.clipboard.write=function(items){
      _ot=_dsOutlineText();
      if(!_ot)return _ow2(items);
      var resolved=Array.from(items).map(function(item){
        if(!item||!item.types)return Promise.resolve(item);
        var entries=[];
        var proms=item.types.map(function(type){
          return item.getType(type).then(function(blob){
            if(type==="text/plain"||type==="text/html"){
              return blob.text().then(function(text){
                if(text.indexOf("大纲")===-1)text=_ot+"\\n\\n"+text;
                entries.push([type,new Blob([text],{type:type})]);
              });
            }else{
              entries.push([type,blob]);
            }
          });
        });
        return Promise.all(proms).then(function(){
          return new ClipboardItem(Object.fromEntries(entries));
        });
      });
      return Promise.all(resolved).then(function(arr){return _ow2(arr);});
    };
  }
  console.log("[DS NoStream] clipboard override installed (page ctx)");
})();`;
  document.documentElement.appendChild(_clipInject);
  _clipInject.remove();

  // ========================================
  // 键盘快捷键：Ctrl+Shift+C 复制当前 AI 回复（含大纲）
  // ========================================
  document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.metaKey && (e.key === 'c' || e.key === 'C')) {
      var items = document.querySelectorAll('[data-virtual-list-item-key]');
      var lastAssistant = null;
      for (var i = items.length - 1; i >= 0; i--) {
        if (items[i].querySelector('[class*="assistant"], [class*="bot"], [class*="ai"]')) {
          lastAssistant = items[i];
          break;
        }
      }
      if (!lastAssistant) return;
      e.preventDefault();
      var mdEl = lastAssistant.querySelector(CONFIG.MD_CONTENT);
      if (mdEl) {
        document._ds_lastCopyContainer = mdEl;
        // 用 SVG path 找到复制按钮并点击
        var btn = lastAssistant.querySelector('div[role="button"] svg path');
        if (btn) btn = btn.closest('div[role="button"]');
        if (btn) btn.click();
      }
    }
  });

  // ========================================
  // 键盘快捷键：Alt+↑/↓ 切换会话（侧边栏保持不动，只切换内容）
  // ========================================
  document.addEventListener("keydown", function(e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      var links = document.querySelectorAll('a[href*="/a/chat/s/"]');
      if (links.length < 2) return;
      e.preventDefault();

      // 找到当前会话在列表中的位置
      var currentIdx = -1;
      var currentPath = location.pathname;
      for (var i = 0; i < links.length; i++) {
        try {
          if (new URL(links[i].href).pathname === currentPath) { currentIdx = i; break; }
        } catch(_) {}
      }

      var targetIdx;
      if (currentIdx >= 0) {
        targetIdx = e.key === 'ArrowUp' ? currentIdx - 1 : currentIdx + 1;
      } else {
        targetIdx = e.key === 'ArrowUp' ? links.length - 1 : 0;
      }
      if (targetIdx < 0 || targetIdx >= links.length) return;

      // 直接点击目标链接，不操作侧边栏滚动
      links[targetIdx].click();
    }
  });

  // ========================================
  // 键盘快捷键：Ctrl+↑/↓ 在同会话中切换提问
  // ========================================
  // 通过 <script> 注入到页面上下文执行（确保事件捕获不受 Tampermonkey 沙箱影响）
  var _questionNavScript = document.createElement("script");
  _questionNavScript.textContent = `
(function() {
  if (document._ds_questionNavInstalled) return;
  document._ds_questionNavInstalled = true;

  document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {

      var items = document.querySelectorAll('[data-virtual-list-item-key]');
      var questions = [];
      items.forEach(function(el) {
        if (!el.querySelector('[class*="ds-assistant"]') && !el.querySelector('[class*="ds-markdown"]')) {
          var text = (el.textContent || '').trim();
          if (text) questions.push(el);
        }
      });
      if (questions.length < 2) return;
      e.preventDefault();

      if (document._ds_questionIdx === undefined || document._ds_questionIdx >= questions.length) {
        var scrollContainer = document.querySelector('.ds-virtual-list');
        if (scrollContainer) {
          var cr = scrollContainer.getBoundingClientRect();
          var viewCenter = cr.top + cr.height / 2;
          var best = 0, bestDist = Infinity;
          questions.forEach(function(q, i) {
            var qr = q.getBoundingClientRect();
            var qc = qr.top + qr.height / 2;
            var d = Math.abs(qc - viewCenter);
            if (d < bestDist) { bestDist = d; best = i; }
          });
          document._ds_questionIdx = best;
        } else {
          document._ds_questionIdx = 0;
        }
      }

      var targetIdx = e.key === 'ArrowUp' ? document._ds_questionIdx - 1 : document._ds_questionIdx + 1;
      if (targetIdx < 0 || targetIdx >= questions.length) return;

      document._ds_questionIdx = targetIdx;
      var target = questions[targetIdx];
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      var orig = target.style.outline;
      target.style.outline = '2px solid rgba(74,144,226,0.8)';
      target.style.outlineOffset = '-2px';
      setTimeout(function() { target.style.outline = orig; }, 1500);
    }
  });
  console.log("[DS NoStream] question nav installed (page ctx)");
})();`;
  document.documentElement.appendChild(_questionNavScript);
  _questionNavScript.remove();

  // ========================================
  // 启动
  // ========================================
  setTimeout(findResponseContainers, 500);

  const bodyObserver = new MutationObserver(() => {
    findResponseContainers();
  });
  bodyObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
