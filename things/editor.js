'use strict';

(() => {
  const it = {};

  it.editor_config = {
    language: 'json',
    lineNumbers: 'on',
    roundedSelection: true,
    scrollBeyondLastLine: true,
    readOnly: false,
    wordWrap: 'on',
    minimap: {
      enabled: false,
    },
    theme: 'vs-dark',
    tabSize: 2,
  };

  it.editor_state = {
    is_valid_json: false,
    is_formatted: false,
    unregister_events: {
      onDidChangeModelLanguageConfiguration: null,
    }
  };

  it.editor_dom_id = 'monaco_editor';

  it.editor = null;

  it.load_editor_source = async () => {
    return new Promise((resolve, reject) => {
      require.config({ paths: { vs: './things/monaco-editor/vs' } });

      require(['vs/editor/editor.main'], function () {
        return resolve();
      });
    })
  }

  it.wait_receive_data = async () => {
    return new Promise((resolve, reject) => {
      window.onmessage = async function (event) {
        if (event.data) {
          const { code, data } = event.data;

          if (code === 'view_data_update' && data) {
            return resolve({ data });
          }
        }
      }
    });
  }

  it.create_editor = async ({ config, data }) => {
    const editor_dom_container = it.get_editor_dom_container();

    const editor = monaco.editor.create(editor_dom_container, {
      value: data,
      ...it.editor_config,
      ...config,
    });

    editor.getModel().updateOptions({ tabSize: it.editor_config.tabSize });

    it.add_command_toggle_word_wrap({ editor });
    it.add_command_set_theme_light({ editor });
    it.add_command_set_theme_dark({ editor });
    it.add_command_turn_on_validation({ editor });
    it.add_command_turn_off_validation({ editor });

    editor.focus();

    return editor;
  }

  it.add_command_toggle_word_wrap = ({ editor }) => {
    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'toggle_word_wrap',

      // A label of the action that will be presented to the user.
      label: 'Toggle Wordwrap',

      // An optional array of keybindings for the action.
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyCode.KeyZ,
      ],

      // A precondition for this action.
      precondition: null,

      // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
      keybindingContext: null,

      contextMenuGroupId: 'navigation',

      contextMenuOrder: 1,

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: function (editor) {
        const { wordWrap } = editor.getRawOptions();

        editor.updateOptions({ wordWrap: wordWrap === 'on' ? 'off' : 'on' });
      }
    });
  }

  it.add_command_set_theme_light = ({ editor }) => {
    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'set_theme_light',

      // A label of the action that will be presented to the user.
      label: 'Set theme: light',

      // An optional array of keybindings for the action.
      keybindings: [],

      // A precondition for this action.
      precondition: null,

      // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
      keybindingContext: null,

      contextMenuGroupId: 'navigation',

      contextMenuOrder: 2,

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: function (editor) {
        editor.updateOptions({ theme: 'vs-light' });
      }
    });
  }

  it.add_command_set_theme_dark = ({ editor }) => {
    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'set_theme_dark',

      // A label of the action that will be presented to the user.
      label: 'Set theme: dark',

      // An optional array of keybindings for the action.
      keybindings: [],

      // A precondition for this action.
      precondition: null,

      // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
      keybindingContext: null,

      contextMenuGroupId: 'navigation',

      contextMenuOrder: 2.1,

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: function (editor) {
        editor.updateOptions({ theme: 'vs-dark' });
      }
    });
  }

  it.add_command_turn_on_validation = ({ editor }) => {
    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'turn_on_validation',

      // A label of the action that will be presented to the user.
      label: 'Turn on validation',

      // An optional array of keybindings for the action.
      keybindings: [],

      // A precondition for this action.
      precondition: null,

      // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
      keybindingContext: null,

      contextMenuGroupId: 'navigation',

      contextMenuOrder: 3,

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: function (editor) {
        const { language } = editor.getRawOptions();

        if (language === 'json') {
          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: true });
        }
      }
    });
  }

  it.add_command_turn_off_validation = ({ editor }) => {
    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'turn_off_validation',

      // A label of the action that will be presented to the user.
      label: 'Turn off validation',

      // An optional array of keybindings for the action.
      keybindings: [],

      // A precondition for this action.
      precondition: null,

      // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
      keybindingContext: null,

      contextMenuGroupId: 'navigation',

      contextMenuOrder: 3,

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: function (editor) {
        const { language } = editor.getRawOptions();

        if (language === 'json') {
          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: false });
        }
      }
    });
  }

  it.get_editor_dom_container = () => {
    return document.getElementById(it.editor_dom_id);
  }

  it.format_text = async () => {
    return new Promise((resolve, reject) => {
      if (!it.editor_state.is_valid_json) {
        return;
      }

      it.editor_state.unregister_events.onDidChangeModelLanguageConfiguration = it.editor.onDidChangeModelLanguageConfiguration((e) => {
        if (it.editor_state.is_formatted) {
          if (it.editor_state.unregister_events.onDidChangeModelLanguageConfiguration) {
            it.editor_state.unregister_events.onDidChangeModelLanguageConfiguration();
          }

          return;
        }

        const value = it.editor.getValue();

        if (!(value && value.length > 0)) {
          return;
        }

        it.editor.getAction('editor.action.formatDocument')
          .run()
          .then(() => {
            return resolve();
          });

        it.editor_state.is_formatted = true;
      });
    });
  }

  it.set_read_only = () => {
    it.editor.updateOptions({ readOnly: true });
  }

  it.check_json_text = ({ text }) => {
    try {
      const value = JSON.parse(text);

      return { is_valid: true, value };
    }
    catch (error) {
      return { is_valid: false, error };
    }
  }

  it.config_for_view_data = async () => {
    const [load_editor_source_result, wait_receive_data_result] = await Promise.all([
      it.load_editor_source(),
      it.wait_receive_data(),
    ]);

    const { data } = wait_receive_data_result;

    const { is_valid: is_valid_json } = it.check_json_text({ text: data });
    it.editor_state.is_valid_json = is_valid_json;

    it.editor = await it.create_editor({ data });
    await it.format_text();
    // it.set_read_only();
  }

  it.config_for_edit_blank_json = async () => {
    await it.load_editor_source();
    it.editor = await it.create_editor({ data: '' });
  }

  it.default_html_content = 
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body {
      background-color: rgb(30, 30, 30);
      color: #ccc;
    }
  </style>
</head>
<body>
  hello
</body>
</html>
`

  it.update_html_preview_content = () => {
    const value = it.editor.getValue();

    it.html_preview_dom_container.srcdoc = value;
  }

  it.config_for_edit_blank_html = async () => {
    await it.load_editor_source();

    it.editor = await it.create_editor({ config: { language: 'html' }, data: it.default_html_content });

    it.html_preview_dom_container = document.getElementById('html_preview');
    
    it.editor_state.unregister_events.onDidChangeModelContent = it.editor.onDidChangeModelContent(_.debounce(it.update_html_preview_content, 250, { maxWait: 5000 }));

    it.update_html_preview_content();
  }

  window.editor = it;
})()