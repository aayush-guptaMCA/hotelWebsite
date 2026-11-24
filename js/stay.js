(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.querySelector('.photo-viewer');
  const largePhoto = dialog.querySelector('.large-photo');
  const viewerDots = dialog.querySelector('.photo-dots');
  let expanded;

  function markSelected(dots, index) {
    Array.from(dots).forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
  }

  dialog.querySelector('.photo-back').addEventListener('click', () => dialog.close());
  dialog.querySelector('.slide-prev').addEventListener('click', () => expanded.step(-1));
  dialog.querySelector('.slide-next').addEventListener('click', () => expanded.step(1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      expanded.step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  dialog.addEventListener('close', () => {
    expanded.schedule();
    expanded = null;
  });

  for (const card of document.querySelectorAll('.room-card')) {
    const cover = card.querySelector('.room-cover');
    const opener = card.querySelector('.photo-open');
    const photos = [...card.querySelectorAll('.photo-dots a')];
    let active = 0;
    let timer;
    let visible = !('IntersectionObserver' in window);

    function show(index) {
      active = index;
      const photo = photos[index];
      opener.href = cover.src = photo.href;
      cover.alt = photo.dataset.alt;
      markSelected(photos, index);
      if (expanded === gallery && dialog.open) {
        largePhoto.src = photo.href;
        largePhoto.alt = cover.alt;
        markSelected(viewerDots.children, index);
      }
    }
    function step(offset) {
      show((active + offset + photos.length) % photos.length);
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (visible && !document.hidden && !dialog.open && !motion.matches) {
        timer = setTimeout(() => step(1), 4500);
      }
    }
    const gallery = {step, schedule};
    photos.forEach((dot, index) => dot.addEventListener('click', event => {
      event.preventDefault();
      show(index);
      schedule();
    }));
    card.querySelector('.slide-prev').addEventListener('click', () => step(-1));
    card.querySelector('.slide-next').addEventListener('click', () => step(1));
    opener.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      expanded = gallery;
      viewerDots.replaceChildren(...photos.map((photo, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', photo.getAttribute('aria-label'));
        dot.addEventListener('click', () => show(index));
        return dot;
      }));
      dialog.setAttribute('aria-label', card.querySelector('h3').textContent + ' photos');
      dialog.showModal();
      show(active);
    });
    dialog.addEventListener('toggle', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      }).observe(card);
    }
    motion.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', schedule);
    show(0);
    schedule();
  }

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('stay-revealed');
          reveal.unobserve(entry.target);
        }
      }
    });
    document.querySelectorAll('[data-reveal]').forEach(item => reveal.observe(item));
  }

  const viewer = document.querySelector('.panorama');
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { alpha:false, antialias:false });
  let yaw = 0;
  let pitch = 0;
  let drawSphere;

  // Project the camera rays onto the equirectangular room photograph.
  function prepareSphere(photo) {
    if (!gl) return;
    const program = gl.createProgram();
    const shaders = [
      [gl.VERTEX_SHADER, 'attribute vec2 pos; varying vec2 screen; void main(){ screen=pos; gl_Position=vec4(pos,0.,1.); }'],
      [gl.FRAGMENT_SHADER, `precision mediump float;
        varying vec2 screen;
        uniform vec3 camera;
        uniform sampler2D room;
        void main() {
          vec3 ray = normalize(vec3(screen.x * camera.z, screen.y, 1.55));
          float c = cos(camera.y), s = sin(camera.y);
          vec3 direction = vec3(ray.x, c * ray.y + s * ray.z, c * ray.z - s * ray.y);
          float u = fract(0.5 + (camera.x + atan(direction.x, direction.z)) / 6.2831853);
          float v = 0.5 - asin(clamp(direction.y, -1.0, 1.0)) / 3.1415927;
          gl_FragColor = texture2D(room, vec2(u,v));
        }`]
    ];
    for (const [type, source] of shaders) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'pos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, photo);
    const camera = gl.getUniformLocation(program, 'camera');
    drawSphere = () => {
      const scale = Math.min(devicePixelRatio || 1, 2);
      const width = Math.round(viewer.clientWidth * scale);
      const height = Math.round(viewer.clientHeight * scale);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform3f(camera, yaw, pitch, width / height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    viewer.querySelector('.pan-world').append(canvas);
  }

  function render() {
    if (!viewer.clientWidth || !viewer.clientHeight) return;
    if (drawSphere) drawSphere();
    else viewer.style.backgroundPositionX = 'calc(50% - ' + (yaw * viewer.clientHeight / Math.PI) + 'px)';
  }

  function turn(horizontal, vertical = 0) {
    yaw = (yaw + horizontal) % (2 * Math.PI);
    pitch = Math.max(-1.4, Math.min(1.4, pitch + vertical));
    render();
  }

  let drag;
  viewer.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || !event.isPrimary || event.button !== 0) return;
    drag = { x:event.clientX, y:event.clientY, id:event.pointerId };
    viewer.setPointerCapture(event.pointerId);
  });
  viewer.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    turn((drag.x - event.clientX) * .005, (event.clientY - drag.y) * .005);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  viewer.addEventListener('lostpointercapture', () => { drag = null; });
  viewer.addEventListener('keydown', event => {
    const moves = { ArrowLeft:[-.15,0], ArrowRight:[.15,0], ArrowUp:[0,.12], ArrowDown:[0,-.12] };
    if (moves[event.key]) {
      event.preventDefault();
      turn(...moves[event.key]);
    }
  });
  viewer.querySelectorAll('[data-turn]').forEach(button => {
    button.addEventListener('click', () => turn(Number(button.dataset.turn) * Math.PI / 6));
  });
  const photo = new Image();
  photo.onload = () => {
    try { prepareSphere(photo); } catch { /* Local-file previews can restrict WebGL textures. */ }
    render();
    viewer.querySelector('.pan-tools').hidden = false;
    window.addEventListener('resize', render);
  };
  canvas.addEventListener('webglcontextlost', () => {
    drawSphere = null;
    canvas.remove();
    render();
  });
  const poster = document.querySelector('.tour-poster');
  const stage = document.querySelector('.tour-stage');
  let opener;
  for (const button of poster.querySelectorAll('[data-open-tour]')) {
    button.addEventListener('click', () => {
      opener = button;
      poster.hidden = true;
      stage.hidden = false;
      if (!photo.src) photo.src = 'img/stay1.jpg';
      render();
      viewer.focus({preventScroll:true});
    });
  }
  function closeTour() {
    stage.hidden = true;
    poster.hidden = false;
    opener.focus({preventScroll:true});
  }
  stage.querySelector('.tour-close').addEventListener('click', closeTour);
  stage.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeTour();
  });
})();
