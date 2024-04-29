class Console {
  constructor() {
    this.isOpen = localStorage.getItem('__console__isOpen') === 'true';
    this.entries = [];
    this.inputHistory = [];
    this.currentHistory = -1;
    this.isLoaded = false;

    this.stylesheet = this._createStylesheet();
    this.wrapper = this._createWrapper();

    document.addEventListener('error', (e) => this.errorHandler(e));
    document.addEventListener('keydown', (e) => this.keydownHandler(e));
    document.addEventListener('DOMContentLoaded', () => this._DOMContentLoadedHandler());
  }

  errorHandler(errorEvent) {
    this._createEntry(errorEvent.message, errorEvent.filename, errorEvent.lineno, errorEvent.colno, 'error');
  }

  keydownHandler(keyEvent) {
    if (keyEvent.ctrlKey && keyEvent.altKey && keyEvent.key == 'c') {
      this.toggle();
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.isOpen ? this.wrapper.classList.add('open') : this.wrapper.classList.remove('open');
    localStorage.setItem('__console__isOpen', this.isOpen.toString());
  }

  log(message, showStack = true) {
    // get the first one for right now
    const stack = showStack ? this._parseStackStr(new Error().stack)[0] : [null, null, null];
    let type;
    if (message === undefined) {
      type = 'nullish';
      message = 'undefined';
    } else if (message === null) {
      type = 'nullish';
      message = 'null';
    } else {
      type = typeof message;
    }

    if (type === 'object') {
      message = JSON.stringify(message, null, 2);
    }

    this._createEntry(message, stack?.[0], stack?.[1], stack?.[2], type);
  }




  _parseStackStr(str) {
    return str?.split('\n')                          // split up the stack
    ?.map(item => item?.split('@')[1])                // remove the logging info
    ?.map(item => item?.replace(location.origin, '')) // remove the origin
    ?.map(item => item?.split(':'))                   // split the file, line, and column
    ?.slice(1);                                      // remove this stack call
  }

  _createStylesheet() {
    const style = document.createElement('style');

    if (style.styleSheet){
      // This is required for IE8 and below.
      style.styleSheet.cssText = _console_css;
    } else {
      style.appendChild(document.createTextNode(_console_css));
    }

    return style;
  }

  _createWrapper() {
    const wrapper = document.createElement('div');
    wrapper.id = '__console__';
    this.isOpen ? wrapper.classList.add('open') : wrapper.classList.remove('open');

    const entries = document.createElement('div');
    entries.className = 'entryWrapper';

    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('spellcheck', "false");
    input.addEventListener('keypress', (e) => {
      if (e.key == 'Enter') {
        this._createEntry(input.value, null, null, null, 'input');
        this.log(eval(input.value), false);

        this.inputHistory.push(input.value);
        this.currentHistory = this.inputHistory.length;
        input.value = '';
      }
    })
    input.addEventListener('keydown', (e) => {
      if (e.key == 'ArrowUp') {
        if (this.currentHistory === -1) return;
        this.currentHistory--;
        if (this.currentHistory < 0) this.currentHistory = 0;
        input.value = this.inputHistory[this.currentHistory];
      }

      if (e.key == 'ArrowDown') {
        if (this.currentHistory === -1) return;
        this.currentHistory++;
        if (this.currentHistory > this.inputHistory.length) this.currentHistory = this.inputHistory.length;
        input.value = this.inputHistory[this.currentHistory] ?? '';
      }
    })

    

    wrapper.appendChild(entries);
    wrapper.appendChild(input);



    return wrapper;
  }

  _createEntry(message, file, line, column, type = null) {
    const entry = document.createElement('div');
    entry.classList.add('entry');
    type && entry.classList.add(type);
    entry.innerHTML = `
      <pre class="message">${message}</pre>
      <div class="file">${file ? file + ':' : ''}${line ? line + ':' : ''}${column ?? ''}</div>
    `


    const entryData = {
      element: entry,
      message,
      file,
      line,
      column,
      type
    }

    this.entries.push(entryData);
    if (this.isLoaded) {
      this._render(entryData);
    }
  }

  _render(entry = null) {
    const entryWrapper = this.wrapper.querySelector('.entryWrapper');
    // render just this entry or the entire console
    if (entry) {
      // if at the bottom keep scrolling
      const currentScoll = Math.abs(entryWrapper.scrollHeight - entryWrapper.clientHeight - entryWrapper.scrollTop);
      
      entryWrapper.appendChild(entry.element);

      if (currentScoll < 1) {
        entry.element.scrollIntoView();
      }

    } else {
      // remove all other logs
      while (entryWrapper.firstChild) {
        entryWrapper.removeChild(this.wrapper.lastChild);
      }

      this.entries.forEach(_entry => this._render(_entry));
    }
  }

  _DOMContentLoadedHandler() {
    this.isLoaded = true;

    document.body.appendChild(this.wrapper);
    document.head.appendChild(this.stylesheet);

    this._render();
  }
}

const _console_css = `
#__console__ {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 12px;
  font-weight: 400;
  display: none;
  flex-direction: column;
  justify-content: flex-end;
  position: fixed;
  bottom: 0;
  left: 0;
  height: var(--console-height);
  width: 100vw;
  background-color: #363636;
  overflow-x: hidden;
}

#__console__.open {
  display: flex;
}

#__console__ > .entryWrapper {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
}

#__console__ > input {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 12px;
  font-weight: 400;
  display: block;
  width: 100%;
  border: none;
  border-top: 1px solid #545454;
  padding: 6px 3px;
  color: white;
  background-color: #363636;
  margin: 0;
}

#__console__ > input:focus {
  outline: none;
}

#__console__ .entry {
  padding: 3px 3px;
  color: white;
  border-bottom: 1px solid #545454;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

#__console__ .entry:first-child {
  border-top: 1px solid #545454;
}

#__console__ .entry .message {
  margin: 0;
}

#__console__ .entry.number .message {
  color: #B5CEA8;
}

#__console__ .entry.string .message {
  color: #E89650;
}

#__console__ .entry.boolean .message {
  color: #569BD5;
}

#__console__ .entry.nullish .message {
  color: #A6A6A6;
}

#__console__ .entry.input .message {
  color: #5E9FDA;
}

#__console__ .entry .file {
  color: #A6A6A6;
}

#__console__ .entry.error {
  background-color: #4E3431;
  color: #EE7E64;
}
`;

const _console = new Console();