const editors = [];

/* ======================
  NOTIFICATION SYSTEM
====================== */
function notify(zone, msg, type = "info") {
  if (!zone) return;

  let el = zone.querySelector(".dz-msg");

  if (!el) {
    el = document.createElement("div");
    el.className = "dz-msg";
    el.style.marginTop = "6px";
    zone.appendChild(el);
  }

  el.textContent = msg;

  el.style.color =
    type === "success" ? "green" :
    type === "error" ? "red" :
    "#333";
}

/* ======================
  QUILL COUNTER MODULE
====================== */
Quill.register('modules/counter', function(quill, options) {
  const container = typeof options.container === 'string' 
    ? document.querySelector(options.container)
    : options.container;
  
  if (!container) return;
  
  function update() {
    const text = quill.getText().trim();
    const length = text.length;
    container.innerHTML = `${length} ${length === 1 ? 'karakter' : 'karakterek'}`;
  }
  
  quill.on('text-change', update);
  update();
});

/* ======================
  INIT
====================== */
function initEditors() {
  editors.forEach(e => {
    try {
      e.quill.disable();
    } catch (_) {}
  });
  editors.length = 0;

  document.querySelectorAll('.editor').forEach((el) => {
    if (el.dataset.inited === "1") return;

    const counterContainer = el.closest('.quill-wrap')?.querySelector('.char-counter');
    
    const quill = new Quill(el, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ script: 'sub' }, { script: 'super' }],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image', 'video'],
          ['clean']
        ],
        counter: counterContainer ? { container: counterContainer } : false
      }
    });

    el.dataset.inited = "1";

    if (el.dataset.content) {
      quill.root.innerHTML = el.dataset.content;
    }

    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('upload', file);

        try {
          const res = await fetch('/admin/upload', {
            method: 'POST',
            body: formData
          });

          if (!res.ok) throw new Error("upload failed");

          const data = await res.json();

          const range = quill.getSelection(true) || { index: 0 };
          quill.insertEmbed(range.index, 'image', data.url);

        } catch (err) {
          alert("Kép feltöltési hiba!");
        }
      };

      input.click();
    });

    editors.push({ el, quill });
  });
}

/* ======================
  SYNC EDITORS
====================== */
function syncEditors() {
  editors.forEach(e => {
    const form = e.el.closest("form");
    if (!form) return;

    const name = e.el.dataset.target;
    const input = form.querySelector(`input[name="${name}"]`);

    if (input) {
      input.value = e.quill.root.innerHTML;
    }
  });
}

/* ======================
  CONFIRM DELETE
====================== */
document.querySelectorAll('.js-confirm-delete').forEach(form => {
  form.addEventListener('submit', e => {
    const msg = form.dataset.message || "Are you sure?";
    if (!confirm(msg)) {
      e.preventDefault();
    }
  });
});

/* ======================
  FORM SUBMIT HOOK
====================== */
document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.classList.contains('js-editor-form')) {
    syncEditors();
  }
});

/* ======================
  DROPZONE
====================== */
function setupDropzone(zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;

  const input = zone.querySelector('input[type="file"]');
  if (!input) return;

  zone.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    input.click();
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    zone.addEventListener(evt, e => e.preventDefault());
  });

  zone.addEventListener('dragover', () => zone.classList.add('hover'));
  zone.addEventListener('dragleave', () => zone.classList.remove('hover'));
  zone.addEventListener('drop', async (e) => {
    zone.classList.remove('hover');
    const files = e.dataTransfer?.files;
    if (!files?.length) return;

    const dt = new DataTransfer();
    dt.items.add(files[0]);
    input.files = dt.files;
    await handleFileUpload(zone, input);
  });

  input.addEventListener('change', async () => {
    if (!input.files?.length) return;
    await handleFileUpload(zone, input);
  });
}

/* ======================
  UPLOAD HANDLER
====================== */
async function handleFileUpload(zone, input) {
  notify(zone, "Feltöltés...", "info");

  const form = zone.closest("form");
  if (!form) {
    notify(zone, "Nincs form!", "error");
    return;
  }

  const formData = new FormData(form);

  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("upload failed");

    notify(zone, "Sikeres feltöltés ✔", "success");
    setTimeout(() => location.reload(), 700);

  } catch (err) {
    console.error(err);
    notify(zone, "Feltöltési hiba ✖", "error");
    input.value = "";
  }
}

/* ======================
  REINIT
====================== */
document.addEventListener('DOMContentLoaded', () => {
  const waitForQuill = () => {
    if (typeof Quill !== 'undefined') {
      initEditors();
    } else {
      setTimeout(waitForQuill, 50);
    }
  };

  waitForQuill();
  setupDropzone("dz-image");
});
