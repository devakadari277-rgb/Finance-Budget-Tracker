/* Interactive background - parallax on mouse move */
(function() {
  const bg = document.getElementById('bgImage');
  if (!bg) return;

  document.addEventListener('mousemove', function(e) {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    bg.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(1.05)';
  });

  document.addEventListener('mouseleave', function() {
    bg.style.transform = 'translate(0, 0) scale(1.05)';
  });
})();
