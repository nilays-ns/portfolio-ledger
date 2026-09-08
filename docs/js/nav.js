(function () {
  var btn = document.querySelector('.nav-hamburger');
  var inner = document.querySelector('.nav-inner');
  if (!btn || !inner) return;
  btn.addEventListener('click', function () {
    inner.classList.toggle('open');
  });

  // mark active nav link
  var links = document.querySelectorAll('.nav-links a');
  var path = window.location.pathname;
  links.forEach(function (a) {
    var href = a.getAttribute('href');
    if (href && path.endsWith(href.replace(/^\.\.\//, '').replace(/^\.\//, ''))) {
      a.classList.add('active');
    }
  });
})();
