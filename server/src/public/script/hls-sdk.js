

(function (window, document) {
  const guid = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
  }

  var sdkDomain = '';
  var jsscript = document.getElementsByTagName("script");
  for (var i = 0; i < jsscript.length; i++) {
    var pattern = /hls\-sdk\.js/;
    var scriptSrc = jsscript[i].getAttribute("src");
    if (pattern.test(scriptSrc)) {
      sdkDomain = scriptSrc.split('/').slice(0, 3).join('/');
    }
  }

  var HLSPlayer = {};
  HLSPlayer.init = function (selector, options, playerCallback) {
    element = document.querySelector(selector);
    if (!element) return;
    element.style.position = 'relative';
    var iframe = document.createElement('iframe');
    element.append(iframe);
    iframe.style.border = 'none';
    iframe.style.position = 'absolute';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.top = '0';
    iframe.style.left = '0';
    var src = `${sdkDomain}/videos/${options.entityId}?`;
    var iframeId = guid();
    iframe.id = iframeId;
    if (options.disable && options.disable.includes('timeshift')) {
      src += 'timeshift=0'
    } else {
      src += 'timeshift=1'
    }
    if (options.disable && options.disable.includes('fullscreen')) {
      src += '&fullscreen=0'
    } else {
      src += '&fullscreen=1'
    }
    src += `&iframeId=${iframeId}`;
    iframe.src = src;


    var player = {};
    player.listeners = [];
    player.on = function (name, callback) {
      player.listeners.push({ name, callback });
    };
    player.emit = function (name, data) {
      player.listeners.forEach((listener) => {
        if (listener.name === name && typeof (listener.callback) === 'function') {
          listener.callback(data)
        }
      });
    }

    player.mute = () => iframe.contentWindow.postMessage(JSON.stringify({ type: 'mute' }), '*');
    player.play = (time) => iframe.contentWindow.postMessage(JSON.stringify({ type: 'play', time }), '*');
    player.pause = () => iframe.contentWindow.postMessage(JSON.stringify({ type: 'pause' }), '*');

    window.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      player.emit(data.type, data);
    });

    if (typeof (playerCallback) === 'function') {
      playerCallback(player);
    }
  }
  window.HLSPlayer = HLSPlayer;
})(window, document)
