/* Portfolio applications web — interactions */
(() => {
  'use strict'
  const doc = document.documentElement
  doc.classList.add('js')
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches

  /* ---- barre de progression, navigation, dock ---- */
  const progress = $('#progress'), nav = $('#nav'), dock = $('#dock'), hero = $('#hero')
  let ticking = false
  const onScroll = () => {
    const y = scrollY, h = doc.scrollHeight - innerHeight
    progress.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`
    nav.classList.toggle('is-scrolled', y > 24)
    const wr = $('#projets').getBoundingClientRect()
    const inWorks = wr.top < innerHeight * 0.6 && wr.bottom > innerHeight * 0.5
    dock.classList.toggle('is-visible', inWorks)
    ticking = false
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll) } }, { passive: true })
  onScroll()

  /* ---- projecteur qui suit le curseur ---- */
  const spot = $('#spot')
  if (fine && !reduce) {
    let x = 0, y = 0, tx = 0, ty = 0
    addEventListener('pointermove', (e) => { tx = e.clientX - 310; ty = e.clientY - 310 }, { passive: true })
    const loop = () => { x += (tx - x) * 0.12; y += (ty - y) * 0.12; spot.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(loop) }
    loop()
  } else spot.remove()

  /* ---- apparition au défilement ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); setTimeout(() => { e.target.classList.remove('reveal', 'is-in'); e.target.style.transitionDelay = '' }, 1400) } })
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(el) })

  /* ---- compteurs ---- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      countIO.unobserve(e.target)
      const el = e.target, end = +el.dataset.count
      if (reduce) { el.textContent = end; return }
      const t0 = performance.now(), dur = 1400
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur)
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }, { threshold: 0.6 })
  $$('[data-count]').forEach((el) => countIO.observe(el))

  /* ---- carrousel de l'accueil ---- */
  const stage = $('#stage'), slides = $$('.slide', stage), dots = $('#stageDots')
  const stageName = $('#stageName'), stageUrl = $('b', $('#stageUrl'))
  let cur = 0, timer
  slides.forEach((s, i) => {
    const b = document.createElement('button')
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', s.dataset.name)
    b.addEventListener('click', () => { show(i); restart() })
    dots.appendChild(b)
  })
  function show(i) {
    cur = i
    slides.forEach((s, k) => s.classList.toggle('is-on', k === i))
    $$('button', dots).forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-selected', k === i) })
    const s = slides[i]
    stage.style.setProperty('--a', s.dataset.a); stage.style.setProperty('--b', s.dataset.b)
    stageName.textContent = s.dataset.name; stageUrl.textContent = s.dataset.url
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => show((cur + 1) % slides.length), 3600) }
  slides.forEach((s) => { s.loading = 'eager' })
  show(0); restart()
  document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : restart()))

  /* ---- inclinaison 3D des cadres ---- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach((el) => {
      const max = +(el.dataset.tiltMax || 5)
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5
        el.style.transform = `rotateY(${px * max * 2}deg) rotateX(${-py * max * 2}deg) translateZ(0)`
      })
      el.addEventListener('pointerleave', () => { el.style.transform = '' })
    })
    /* ---- boutons magnétiques ---- */
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect()
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.16}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`
      })
      el.addEventListener('pointerleave', () => { el.style.transform = '' })
    })
  }

  /* ---- visionneuse de captures ---- */
  $$('.case').forEach((c) => {
    const img = $('.frame__img', c), cap = $('.frame__cap', c), thumbs = $$('.thumb', c)
    thumbs.forEach((t) => t.addEventListener('click', () => {
      if (t.classList.contains('is-on')) return
      thumbs.forEach((x) => x.classList.toggle('is-on', x === t))
      img.classList.add('is-swapping')
      const next = new Image()
      next.onload = next.onerror = () => {
        img.src = t.dataset.src
        img.alt = `Capture de ${c.dataset.name} : ${t.dataset.cap}`
        cap.textContent = t.dataset.cap
        requestAnimationFrame(() => img.classList.remove('is-swapping'))
      }
      next.src = t.dataset.src
    }))
  })

  /* ---- dock : application active ---- */
  const items = $$('.dock__item')
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      items.forEach((it) => it.classList.toggle('is-on', it.dataset.target === e.target.id))
    })
  }, { rootMargin: '-45% 0px -50% 0px' })
  $$('.case').forEach((c) => spy.observe(c))

  /* ---- onglets d'installation ---- */
  const tabs = $$('.tab'), panels = $$('.how')
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', x === t) })
    panels.forEach((p) => p.classList.toggle('is-on', p.dataset.panel === t.dataset.tab))
  }))
  /* onglet par défaut selon l'appareil */
  const ua = navigator.userAgent
  const pick = /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : null
  if (pick) $(`.tab[data-tab="${pick}"]`)?.click()
})()

/* ---- e-mail : ouvre Gmail sur ordinateur, l'application de messagerie sur mobile, et permet de copier l'adresse ---- */
(() => {
  const mail = document.querySelector('.js-mail')
  const copy = document.querySelector('.js-copy')
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  if (mail && !mobile) {
    const to = encodeURIComponent(mail.dataset.mail)
    mail.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodeURIComponent('Prise de contact depuis votre portfolio')}`
    mail.target = '_blank'
    mail.rel = 'noopener'
    mail.title = 'Ouvre Gmail pour écrire à ' + mail.dataset.mail
  }
  if (copy) {
    const label = copy.textContent
    copy.addEventListener('click', async () => {
      const text = copy.dataset.copy
      try { await navigator.clipboard.writeText(text) } catch (e) {
        const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'
        document.body.appendChild(t); t.select(); try { document.execCommand('copy') } catch (_) {} t.remove()
      }
      copy.textContent = 'Adresse copiée ✓'
      setTimeout(() => { copy.textContent = label }, 2200)
    })
  }
})()
