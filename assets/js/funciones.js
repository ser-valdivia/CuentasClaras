  const title = document.getElementById('editableTitle');
  const defaultText = "Nombre del evento!!";

  title.addEventListener('dblclick', function () {
    title.contentEditable = true;
    title.textContent = ""; // Borra el texto al editar
    title.focus();
    title.style.border = "1px dashed #007bff";
  });

  title.addEventListener('blur', function () {
    title.contentEditable = false;
    title.style.border = "none";
    if (title.textContent.trim() === "") {
      title.textContent = defaultText; // Restaura si queda vacío
    }
  });
    // También permitir edición con un solo click (opcional, descomenta si lo prefieres)
    // title.addEventListener('click', function () {
    //   title.contentEditable = true;
    //   title.focus();
    //   title.style.border = "1px dashed #007bff";
    // });
