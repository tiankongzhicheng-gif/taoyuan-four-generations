(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const el = (tag, cls, html) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };

  /* ---------------- Lifelines ---------------- */

  const START = 1900;
  const END = 2030;
  const pct = (year) => ((year - START) / (END - START)) * 100;

  const eras = [
    { from: 1911, to: 1912, label: "1911-1912", text: "The Xinhai Revolution ends the Qing empire and the Republic of China is founded." },
    { from: 1937, to: 1945, label: "1937-1945", text: "The war against Japan. Changde, the prefecture that includes Taoyuan, is a battlefield in 1943." },
    { from: 1949, to: 1953, label: "1949-1953", text: "The People’s Republic is founded in 1949. The Land Reform Law of 1950 redistributes land and classifies rural families by class." },
    { from: 1966, to: 1976, label: "1966-1976", text: "The Cultural Revolution. Families with a landlord classification remain under political pressure." },
    { from: 1977, to: 1979, label: "1977-1978", text: "The national university entrance exam returns in 1977, and reform and opening begins in 1978." },
    { from: 2001, to: 2002, label: "2001", text: "China joins the World Trade Organization, and its links with the world economy deepen." }
  ];

  const rows = [
    {
      name: "Great-grandfather Li", sub: "Generation 1, b. 1910",
      life: [[1910, 1981, "known"], [1981, 1995, "unknown"]],
      marks: [
        { year: 1910, label: "1910", text: "Born in the countryside of Taoyuan County, the year before the empire falls." },
        { from: 1928, to: 1942, label: "1930s", text: "With higher education and his parents’ savings behind him, he grows the family’s farmland. The Li household becomes one of the known landlord families of the area." },
        { year: 1945, label: "1945", text: "The family flees to Cili County for about six months, leaving its property behind." },
        { year: 1951, label: "1951", text: "Land reform: the family is classified as landlords, the property is confiscated, and he is imprisoned." },
        { from: 1955, to: 1958, label: "1955-1958", text: "Released from prison and returned to Taoyuan for three years of labour reform." },
        { year: 1981, label: "1981", text: "His status is restored and he retires. His eldest son reconnects with him after eighteen years." }
      ]
    },
    {
      name: "Grandfather Li", sub: "Generation 2, b. 1939",
      life: [[1939, 2000, "known"], [2000, 2015, "unknown"]],
      marks: [
        { year: 1939, label: "1939", text: "Born the eldest son in a village in Taoyuan, in the middle of the war." },
        { year: 1944, label: "1944", text: "Starts at a private school in the home village. After six months as a refugee in Cili in 1945, he returns to it." },
        { from: 1951, to: 1955, label: "1951-1955", text: "The year the family loses everything, he finishes primary school and goes to middle school in Changde." },
        { from: 1955, to: 1959, label: "1955-1959", text: "Admitted at sixteen to an engineering college in Wuhan; studies construction engineering." },
        { from: 1963, to: 1981, label: "1963-1981", text: "Because of his father’s history, he cuts off contact with his family in Taoyuan for eighteen years." },
        { year: 2000, label: "2000", text: "Retires as a senior engineer after forty-one years at a steel plant in Ezhou." }
      ]
    },
    {
      name: "Parents’ generation", sub: "Generation 3, b. 1973",
      life: [[1973, 2026, "known"]],
      marks: [
        { year: 1973, label: "1973", text: "Born in Ezhou, just before the country reopens its universities." },
        { from: 1979, to: 1990, label: "1980s", text: "A complete education, from primary school onward." },
        { year: 1991, label: "1991", text: "Moves to Wuhan and settles there." },
        { from: 1998, to: 2026, label: "Late 1990s to today", text: "Careers that grow with the economy. They become the experienced core of their workplaces and part of the urban middle class." }
      ]
    },
    {
      name: "My generation", sub: "Generation 4, b. 2000s",
      life: [[2008, 2026, "known"]],
      marks: [
        { year: 2008, label: "2008", text: "Born into fast growth and fierce competition, the years people now call involution." },
        { from: 2022, to: 2026, label: "2022 to today", text: "Study abroad with family support: Montreal in 2022, Stanstead in 2023, Waterloo in 2026." }
      ]
    },
    {
      name: "China", sub: "National events",
      national: true,
      marks: eras.map((e) => ({ from: e.from, to: e.to, label: e.label, text: e.text }))
    }
  ];

  function buildChart() {
    const axis = document.querySelector(".chart__axis");
    const eraLayer = document.getElementById("chart-eras");
    const rowLayer = document.getElementById("chart-rows");
    const detail = document.getElementById("chart-detail");
    if (!axis || !rowLayer) return;

    for (let y = START; y <= 2020; y += 10) {
      const tick = el("div", "chart__tick", `<span>${y}</span>`);
      tick.style.left = pct(y) + "%";
      axis.appendChild(tick);
    }
    eras.forEach((e) => {
      const band = el("div", "era");
      band.style.left = pct(e.from) + "%";
      band.style.width = Math.max(pct(e.to) - pct(e.from), 0.6) + "%";
      eraLayer.appendChild(band);
    });

    const buttons = [];
    const select = (btn, mark) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      detail.querySelector(".chart__detail-year").textContent = mark.label;
      detail.querySelector(".chart__detail-text").textContent = mark.text;
    };

    rows.forEach((row) => {
      const r = el("div", "row");
      r.appendChild(el("div", "row__label", `<strong>${row.name}</strong><small>${row.sub}</small>`));
      const track = el("div", "row__track");
      (row.life || []).forEach(([a, b, kind]) => {
        const line = el("div", kind === "known" ? "life" : "life life--unknown");
        line.style.left = pct(a) + "%";
        line.style.width = pct(b) - pct(a) + "%";
        track.appendChild(line);
      });
      row.marks.forEach((m) => {
        const isSpan = m.from !== undefined;
        const btn = el("button", isSpan ? "span" : "mark");
        btn.type = "button";
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-label", `${row.name}, ${m.label}: ${m.text}`);
        if (isSpan) {
          btn.style.left = pct(m.from) + "%";
          btn.style.width = Math.max(pct(m.to) - pct(m.from), 1.2) + "%";
        } else {
          btn.style.left = pct(m.year) + "%";
        }
        btn.addEventListener("click", () => select(btn, m));
        buttons.push(btn);
        track.appendChild(btn);
      });
      // overlapping spans sit on two levels
      if (row.name === "Grandfather Li") {
        const spans = track.querySelectorAll(".span");
        if (spans[2]) spans[2].style.marginTop = "10px";
      }
      r.appendChild(track);
      rowLayer.appendChild(r);
    });

    if (buttons[0]) select(buttons[0], rows[0].marks[0]);
  }

  /* ---------------- Family tree ---------------- */

  const children = [
    { order: "My grandfather", name: "Grandfather Li", zh: "外公", tag: "School", fate: "College in Wuhan, then 41 years as an engineer at a steel plant in Ezhou.", school: true, line: true },
    { order: "Great-aunt", name: "Eldest daughter Li", zh: "长女", tag: "School", fate: "Studied in Changsha. Stayed, worked, and raised a family there.", school: true },
    { order: "Great-uncle", name: "Second son Li", zh: "次子", tag: "Farming", fate: "Farmed in the home village." },
    { order: "Great-aunt", name: "Second daughter Li", zh: "次女", tag: "Married away", fate: "Married young and moved far from home." },
    { order: "Great-uncle", name: "Third son Li", zh: "三子", tag: "Town work", fate: "Worked in the local town." },
    { order: "Great-aunt", name: "Third daughter Li", zh: "三女", tag: "Town work", fate: "Worked in the local town." },
    { order: "Great-uncle", name: "A son who died young", tag: "", fate: "Birth order not recorded.", lost: true }
  ];

  function buildTree() {
    const tree = document.getElementById("tree");
    if (!tree) return;
    tree.appendChild(el("div", "tree__root", `<strong>Great-grandfather Li <span class="zh" lang="zh-Hans">外曾祖父</span></strong><span>Born 1910. Landlord in Taoyuan County.</span>`));
    const ul = el("ul", "tree__children");
    children.forEach((c) => {
      const cls = ["child", c.school ? "child--school" : "", c.lost ? "child--lost" : "", c.line ? "child--line" : ""].join(" ").trim();
      const li = el("li", cls);
      li.innerHTML =
        `<span class="child__order">${c.order}</span>` +
        `<span class="child__name">${c.name}${c.zh ? ` <span class="zh" lang="zh-Hans">${c.zh}</span>` : ""}</span>` +
        (c.tag ? `<span class="child__tag">${c.tag}</span>` : "") +
        `<span class="child__fate">${c.fate}</span>`;
      ul.appendChild(li);
    });
    tree.appendChild(ul);
    const line = el("ol", "tree__line");
    line.setAttribute("aria-label", "The line this site follows");
    line.innerHTML = "<li><b>Grandfather Li</b>&nbsp;in Ezhou</li><li>His children, b. 1973, Ezhou then Wuhan</li><li><b>The author</b>&nbsp;in Waterloo</li>";
    tree.appendChild(line);
    tree.appendChild(el("p", "tree__legend", "Only the eldest son and eldest daughter were old enough to be educated before 1949. The outlined card marks the line this site follows."));
  }

  /* ---------------- Credits ---------------- */

  const credits = [
    ["Plowing with a water buffalo, Changde, Hunan, c. 1900-1919", "Unknown photographer, Yale Divinity School Library", "Public domain", "https://commons.wikimedia.org/wiki/File:Plowing_with_a_water_buffalo,_Changde,_Hunan,_China,_ca.1900-1919_(IMP-YDS-RG008-358-0008-0079).jpg"],
    ["A farmhouse in Taoyuan, 1902", "Torii Ryūzō", "Public domain", "https://commons.wikimedia.org/wiki/File:Taoyuan_in_1902_(No.10150).jpg"],
    ["A man reads the Land Reform Law, 1950", "Unknown photographer", "Public domain", "https://commons.wikimedia.org/wiki/File:A_man_reads_the_Land_Reform_Law_of_PRC.jpg"],
    ["Gate of Wuhan No. 2 High School, 1950s", "Unknown photographer", "Public domain", "https://commons.wikimedia.org/wiki/File:1950%E5%B9%B4%E4%BB%A3%E7%9A%84%E6%AD%A6%E6%B1%89%E5%B8%82%E7%AC%AC%E4%BA%8C%E4%B8%AD%E5%AD%A6%E6%A0%A1%E9%97%A8.jpg"],
    ["Panorama of old Changsha, Changsha City Museum (cropped)", "Gary Todd", "CC0", "https://commons.wikimedia.org/wiki/File:Panorama_of_Old_Changsha_(10113194574).jpg"],
    ["Primary school gate in Caidian, Wuhan, 1980s (restored and colorized)", "Kitsuhontou", "CC0", "https://commons.wikimedia.org/wiki/File:%E8%94%A1%E7%94%B8%E4%B8%80%E5%B0%8F1980%E5%B9%B4%E4%BB%A3%E6%A0%A1%E9%97%A8.jpg"],
    ["Skyline of Wuhan, 2018", "Majorantarktis", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Skyline_of_Wuhan.jpg"],
    ["University of Waterloo, Waterloo Campus, 2025", "JFVoll", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:University_of_Waterloo_(Waterloo_Campus)_-_Waterloo,_Ontario.jpg"]
  ];

  function buildCredits() {
    const ul = document.getElementById("credits-list");
    if (!ul) return;
    credits.forEach(([title, who, lic, url]) => {
      const li = el("li");
      li.innerHTML = `<b>${title}</b><br>${who}. ${lic}. <a href="${url}">Source</a>`;
      ul.appendChild(li);
    });
    const note = el("li");
    note.textContent = "Map tiles from Esri World Topographic Map. Images resized and in some cases cropped.";
    ul.appendChild(note);
  }

  /* ---------------- Rail flag ---------------- */

  function buildRail() {
    const nav = document.querySelector(".rail nav");
    const flag = document.querySelector(".rail__flag");
    const links = Array.from(document.querySelectorAll(".rail__stops a"));
    if (!nav || !flag || !("IntersectionObserver" in window)) return;

    const moveTo = (link) => {
      links.forEach((a) => a.removeAttribute("aria-current"));
      if (!link) {
        nav.style.setProperty("--flag-x", "-40px");
        return;
      }
      link.setAttribute("aria-current", "true");
      const x = link.offsetLeft + link.offsetWidth / 2 - 11;
      nav.style.setProperty("--flag-x", x + "px");
      const target = link.offsetLeft - nav.clientWidth / 2 + link.offsetWidth / 2;
      if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: target, behavior: reduceMotion ? "auto" : "smooth" });
    };

    const byId = new Map(links.map((a) => [a.dataset.stop, a]));
    const visible = new Set();
    const order = links.map((a) => a.dataset.stop);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
      const current = order.filter((id) => visible.has(id)).pop();
      moveTo(current ? byId.get(current) : null);
    }, { rootMargin: "-35% 0px -60% 0px" });
    order.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  buildChart();
  buildTree();
  buildCredits();
  buildRail();
})();
