const inputs = document.querySelectorAll("input, select");
const progress = document.getElementById("progressFill");

inputs.forEach(input => {
  input.addEventListener("input", () => {
    let filled = 0;
    inputs.forEach(i => {
      if (i.value) filled++;
    });

    let percent = (filled / inputs.length) * 100;
    progress.style.width = percent + "%";
  });
});