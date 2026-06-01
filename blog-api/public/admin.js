/* ===========================================================================
   Admin panel client.
   Sets up two Markdown editors (English + Persian) with a toolbar that
   includes tables, code blocks and YouTube embeds, plus drag-free image
   upload. Editor contents are copied into hidden inputs on submit.
   =========================================================================== */
(function () {
  if (typeof EasyMDE === 'undefined') return;

  // --- Upload a file to the server, return the stored URL ---
  async function uploadImage(file) {
    var fd = new FormData();
    fd.append('image', file);
    var res = await fetch('/admin/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('upload failed');
    var data = await res.json();
    return data.url;
  }

  // --- Insert text at the editor cursor ---
  function insert(editor, text) {
    var cm = editor.codemirror;
    cm.replaceSelection(text);
    cm.focus();
  }

  // --- Custom toolbar buttons shared by both editors ---
  function customButtons(getEditor) {
    return [
      'bold', 'italic', 'heading', '|',
      'quote', 'unordered-list', 'ordered-list', '|',
      'link',
      {
        name: 'image-upload',
        className: 'fa fa-picture-o',
        title: 'Upload image',
        action: function () {
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async function () {
            if (!input.files[0]) return;
            try {
              var url = await uploadImage(input.files[0]);
              insert(getEditor(), '\n![image](' + url + ')\n');
            } catch (e) { alert('Image upload failed.'); }
          };
          input.click();
        },
      },
      {
        name: 'table',
        className: 'fa fa-table',
        title: 'Insert table',
        action: function () {
          insert(getEditor(),
            '\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |\n| Cell | Cell |\n\n');
        },
      },
      {
        name: 'code',
        className: 'fa fa-code',
        title: 'Insert code block',
        action: function () {
          insert(getEditor(), '\n\n```js\n// your code here\n```\n\n');
        },
      },
      {
        name: 'youtube',
        className: 'fa fa-youtube-play',
        title: 'Embed YouTube video',
        action: function () {
          var v = prompt('Paste a YouTube link or video ID:');
          if (v) insert(getEditor(), '\n\n@[youtube](' + v.trim() + ')\n\n');
        },
      },
      '|', 'preview', 'side-by-side', 'fullscreen',
    ];
  }

  var editors = {};
  function makeEditor(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var editor = new EasyMDE({
      element: el,
      autoDownloadFontAwesome: true,
      spellChecker: false,
      status: false,
      minHeight: '320px',
      toolbar: customButtons(function () { return editor; }),
    });
    editors[id] = editor;
    return editor;
  }

  makeEditor('body_en');
  makeEditor('body_fa');

  // --- Tabs (English / Persian) ---
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.getAttribute('data-tab');
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('.tab-pane').forEach(function (pane) {
        pane.classList.toggle('hidden', pane.getAttribute('data-pane') !== name);
      });
      // EasyMDE needs a refresh when its container becomes visible.
      Object.keys(editors).forEach(function (k) {
        setTimeout(function () { editors[k].codemirror.refresh(); }, 10);
      });
    });
  });

  // --- Cover image upload ---
  var coverFile = document.getElementById('coverFile');
  if (coverFile) {
    coverFile.addEventListener('change', async function () {
      if (!coverFile.files[0]) return;
      try {
        var url = await uploadImage(coverFile.files[0]);
        document.getElementById('cover_image').value = url;
        var prev = document.getElementById('coverPreview');
        prev.src = url; prev.classList.remove('hidden');
      } catch (e) { alert('Cover upload failed.'); }
    });
  }

  // --- Copy editor contents into hidden inputs before submit ---
  var form = document.getElementById('postForm');
  if (form) {
    form.addEventListener('submit', function () {
      if (editors['body_en']) document.getElementById('body_en_input').value = editors['body_en'].value();
      if (editors['body_fa']) document.getElementById('body_fa_input').value = editors['body_fa'].value();
    });
  }
})();
