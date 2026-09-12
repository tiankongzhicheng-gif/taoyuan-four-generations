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
      name: "Li Hanqing", sub: "Generation 1, b. 1910",
      life: [[1910, 1969, "known"], [1969, 1992, "unknown"]],
      marks: [
        { year: 1910, label: "1910", text: "Born in the countryside of Taoyuan County, the year before the empire falls." },
        { from: 1928, to: 1948, label: "1930s-1940s", text: "With higher education and his parents’ savings behind him, he grows the family’s farmland. The Li household becomes one of the known landlord families of the area." },
        { from: 1937, to: 1969, label: "Late 1930s to late 1960s", text: "Seven children are born. One son dies young." },
        { year: 1951, label: "After 1949", text: "Classified as a landlord, he is sent to prison. The house and land are confiscated. The family account does not record the year." }
      ]
    },
    {
      name: "Li Zhiyuan", sub: "Generation 2, b. 1939",
      life: [[1939, 1986, "known"], [1986, 2012, "unknown"]],
      marks: [
        { year: 1939, label: "1939", text: "Born the eldest son, when the family is at its most prosperous." },
        { from: 1952, to: 1966, label: "Year not recorded", text: "Leaves home on his own to study in Wuhan. He and his elder sister are the only two of the children who received an education." },
        { year: 1982, label: "Early 1980s", text: "The restitution policy returns part of the family’s property and the household moves into town. He has settled in Wuhan with a job and a family of his own." }
      ]
    },
    {
      name: "Parents’ generation", sub: "Generation 3, b. 1973",
      life: [[1973, 2026, "known"]],
      marks: [
        { year: 1973, label: "1973", text: "Born just before the country reopens its universities." },
        { from: 1979, to: 1996, label: "1980s-1990s", text: "A complete education, from primary school through university." },
        { from: 1998, to: 2026, label: "Late 1990s to today", text: "Careers that grow with the economy. They become the experienced core of their workplaces and part of the urban middle class." }
      ]
    },
    {
      name: "My generation", sub: "Generation 4, b. 2000s",
      life: [[2003, 2026, "known"]],
      marks: [
        { year: 2003, label: "Early 2000s", text: "Born into fast growth and fierce competition, the years people now call involution." },
        { from: 2019, to: 2026, label: "Recent years", text: "With family support, study abroad: from Wuhan to Montreal, Stanstead, and Waterloo." }
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
      // overlapping spans on the first row sit on two levels
      if (row.name === "Li Hanqing") {
        const spans = track.querySelectorAll(".span");
        if (spans[1]) spans[1].style.marginTop = "10px";
        if (spans[0]) spans[0].style.marginTop = "-22px";
      }
      r.appendChild(track);
      rowLayer.appendChild(r);
    });

    if (buttons[0]) select(buttons[0], rows[0].marks[0]);
  }

  /* ---------------- Routes map ---------------- */

  const places = {
    village: { name: "Home village", note: "approximate", ll: [28.79, 111.33] },
    town: { name: "Local town", note: "approximate", ll: [28.905, 111.49] },
    changsha: { name: "Changsha", ll: [28.228, 112.939] },
    wuhan: { name: "Wuhan", ll: [30.593, 114.305] },
    montreal: { name: "Montreal", ll: [45.502, -73.567 + 360] },
    stanstead: { name: "Stanstead", ll: [45.020, -72.099 + 360] },
    waterloo: { name: "Waterloo", ll: [43.464, -80.520 + 360] }
  };

  const legs = [
    {
      title: "Taoyuan to Wuhan",
      text: "The eldest son leaves home to study, and stays to work and raise a family. Year not recorded.",
      stops: ["village", "wuhan"]
    },
    {
      title: "Taoyuan to Changsha",
      text: "The eldest daughter leaves to study in the provincial capital and settles there.",
      stops: ["village", "changsha"]
    },
    {
      title: "Village to town",
      text: "Early 1980s. Part of the property is returned and the family moves into the local town.",
      stops: ["village", "town"]
    },
    {
      title: "Wuhan to Waterloo",
      text: "The fourth generation studies abroad: Montreal, then Stanstead, then Waterloo.",
      stops: ["wuhan", "montreal", "stanstead", "waterloo"]
    }
  ];

  function arc(a, b, bend) {
    const [lat1, lng1] = a;
    const [lat2, lng2] = b;
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const cLat = midLat + dLng * bend;
    const cLng = midLng - dLat * bend;
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 0.04) {
      const u = 1 - t;
      pts.push([u * u * lat1 + 2 * u * t * cLat + t * t * lat2, u * u * lng1 + 2 * u * t * cLng + t * t * lng2]);
    }
    return pts;
  }

  function buildRoutes() {
    const list = document.getElementById("legs");
    const mapEl = document.getElementById("map");
    const fallback = document.getElementById("map-fallback");
    if (!list) return;

    const buttons = legs.map((leg, i) => {
      const li = el("li");
      const btn = el("button", "leg",
        `<span class="leg__num" aria-hidden="true">${i + 1}</span><span class="leg__title">${leg.title}</span><span class="leg__text">${leg.text}</span>`);
      btn.type = "button";
      btn.setAttribute("aria-pressed", "false");
      li.appendChild(btn);
      list.appendChild(li);
      return btn;
    });

    if (typeof L === "undefined") {
      fallback.hidden = false;
            buttons.forEach((b, i) => b.addEventListener("click", () => {
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      }));
      return;
    }

    const ink = css("--ink");
    const violet = css("--violet");
    const face = css("--face");

    const map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: false, zoomSnap: 0.25 });
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
      maxZoom: 16
    }).addTo(map);

    const layers = legs.map((leg) => {
      const group = L.featureGroup();
      for (let i = 0; i < leg.stops.length - 1; i++) {
        const a = places[leg.stops[i]].ll;
        const b = places[leg.stops[i + 1]].ll;
        L.polyline(arc(a, b, 0.18), { color: ink, weight: 2.5, dashArray: "2 7", lineCap: "round", opacity: 0.55 }).addTo(group);
      }
      return group;
    });

    const active = L.layerGroup().addTo(map);
    const markerFor = (key, highlight) => {
      const p = places[key];
      return L.circleMarker(p.ll, {
        radius: highlight ? 7 : 5, color: highlight ? violet : ink, weight: 2.5,
        fillColor: face, fillOpacity: 1
      }).bindTooltip(p.note ? `${p.name} <small>(${p.note})</small>` : p.name, {
        permanent: true, direction: "right", offset: [8, 0], className: "place-label"
      });
    };

    function show(index) {
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
      active.clearLayers();
      const leg = legs[index];
      const pts = [];
      for (let i = 0; i < leg.stops.length - 1; i++) {
        const a = places[leg.stops[i]].ll;
        const b = places[leg.stops[i + 1]].ll;
        const line = arc(a, b, 0.18);
        pts.push(...line);
        L.polyline(line, { color: violet, weight: 3.5, lineCap: "round" }).addTo(active);
      }
      leg.stops.forEach((k, i) => markerFor(k, i === 0 || i === leg.stops.length - 1).addTo(active));
      const bounds = L.latLngBounds(pts);
      const pad = leg.stops.includes("montreal") ? [40, 40] : [70, 70];
      map.flyToBounds(bounds, { padding: pad, maxZoom: leg.stops.includes("town") ? 9 : 7, duration: reduceMotion ? 0 : 1.1 });
    }

    layers.forEach((g) => g.addTo(map));
    map.fitBounds(L.latLngBounds([places.village.ll, places.wuhan.ll]), { padding: [70, 70] });
    buttons.forEach((b, i) => b.addEventListener("click", () => show(i)));
    show(0);
  }

  /* ---------------- Family tree ---------------- */

  const children = [
    { order: "Eldest son", name: "Li Zhiyuan", zh: "李致远", tag: "School", fate: "Studied in Wuhan. Stayed, worked, and raised a family there.", school: true, line: true },
    { order: "Eldest daughter", name: "Li Zhiqing", zh: "李致清", tag: "School", fate: "Studied in Changsha. Stayed, worked, and raised a family there.", school: true },
    { order: "Second son", name: "Li Zhiping", zh: "李致平", tag: "Farming", fate: "Farmed in the home village." },
    { order: "Second daughter", name: "Li Zhilan", zh: "李致兰", tag: "Married away", fate: "Married young and moved far from home." },
    { order: "Third son", name: "Li Zhikang", zh: "李致康", tag: "Town work", fate: "Worked in the local town." },
    { order: "Third daughter", name: "Li Zhimei", zh: "李致梅", tag: "Town work", fate: "Worked in the local town." },
    { order: "A son", name: "Died young", tag: "", fate: "Birth order not recorded.", lost: true }
  ];

  function buildTree() {
    const tree = document.getElementById("tree");
    if (!tree) return;
    tree.appendChild(el("div", "tree__root", `<strong>Li Hanqing <span class="zh" lang="zh-Hans">李翰卿</span></strong><span>Born 1910. Landlord in Taoyuan County.</span>`));
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
    line.innerHTML = "<li><b>Li Zhiyuan</b>&nbsp;in Wuhan</li><li>His children, b. 1973</li><li><b>The author</b>&nbsp;in Waterloo</li>";
    tree.appendChild(line);
    tree.appendChild(el("p", "tree__legend", "Only the eldest son and eldest daughter were old enough to be educated before 1949. The outlined card marks the line this site follows."));
  }

  /* ---------------- Words ---------------- */

  const words = [
    {
      gen: "Generation 1", years: "1910 onward",
      items: [
        ["乡绅", "xiāngshēn", "Local gentry, who kept order in the countryside"],
        ["宗族", "zōngzú", "The clan, and its authority over families"],
        ["勤俭持家", "qínjiǎn chíjiā", "Running a household by hard work and thrift"],
        ["田产", "tiánchǎn", "Farmland as the measure of a family’s wealth"]
      ]
    },
    {
      gen: "Generation 2", years: "1939 onward",
      items: [
        ["地主", "dìzhǔ", "Landlord: the class label that decided the family’s fate"],
        ["没收", "mòshōu", "Confiscated: the house and the land"],
        ["颠沛流离", "diānpèi liúlí", "Uprooted, with no settled place to live"],
        ["落实政策", "luòshí zhèngcè", "Restitution: the policy that returned part of the property"]
      ]
    },
    {
      gen: "Generation 3", years: "1973 onward",
      items: [
        ["改革开放", "gǎigé kāifàng", "Reform and opening"],
        ["完整的教育", "wánzhěng de jiàoyù", "A complete education, school through university"],
        ["中坚力量", "zhōngjiān lìliàng", "The experienced core of a workplace"],
        ["城市中产", "chéngshì zhōngchǎn", "The urban middle class"]
      ]
    },
    {
      gen: "Generation 4", years: "2000s onward",
      items: [
        ["内卷", "nèijuǎn", "Involution: competition with no finish line"],
        ["出国留学", "chūguó liúxué", "Going abroad to study"],
        ["身份转变", "shēnfèn zhuǎnbiàn", "A change of identity, and of country"],
        ["父母的支持", "fùmǔ de zhīchí", "Parents’ support, which makes leaving possible"]
      ]
    }
  ];

  function buildWords() {
    const root = document.getElementById("coupons");
    if (!root) return;
    words.forEach((col) => {
      const div = el("div", "coupon-col");
      div.appendChild(el("h3", "", `${col.gen}<small>${col.years}</small>`));
      const ul = el("ul");
      col.items.forEach(([zh, py, en]) => {
        ul.appendChild(el("li", "coupon",
          `<span class="coupon__zh" lang="zh-Hans">${zh}</span><span class="coupon__py" lang="zh-Latn-pinyin">${py}</span><span class="coupon__en">${en}</span>`));
      });
      div.appendChild(ul);
      root.appendChild(div);
    });
  }

  /* ---------------- Credits ---------------- */

  const credits = [
    ["Plowing with a water buffalo, Changde, Hunan, c. 1900-1919", "Unknown photographer, Yale Divinity School Library", "Public domain", "https://commons.wikimedia.org/wiki/File:Plowing_with_a_water_buffalo,_Changde,_Hunan,_China,_ca.1900-1919_(IMP-YDS-RG008-358-0008-0079).jpg"],
    ["A farmhouse in Taoyuan, 1902", "Torii Ryūzō", "Public domain", "https://commons.wikimedia.org/wiki/File:Taoyuan_in_1902_(No.10150).jpg"],
    ["A man reads the Land Reform Law, 1950", "Unknown photographer", "Public domain", "https://commons.wikimedia.org/wiki/File:A_man_reads_the_Land_Reform_Law_of_PRC.jpg"],
    ["Gate of Wuhan No. 2 High School, 1950s", "Unknown photographer", "Public domain", "https://commons.wikimedia.org/wiki/File:1950%E5%B9%B4%E4%BB%A3%E7%9A%84%E6%AD%A6%E6%B1%89%E5%B8%82%E7%AC%AC%E4%BA%8C%E4%B8%AD%E5%AD%A6%E6%A0%A1%E9%97%A8.jpg"],
    ["Panorama of old Changsha, Changsha City Museum (cropped)", "Gary Todd", "CC0", "https://commons.wikimedia.org/wiki/File:Panorama_of_Old_Changsha_(10113194574).jpg"],
    ["Hangzhou street scene, 1984", "BabelStone", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Hangzhou_street_scene_1984.jpg"],
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
    note.textContent = "Map tiles from Esri World Light Gray Canvas. Images resized and in some cases cropped.";
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
  buildWords();
  buildCredits();
  buildRail();
  if (document.readyState === "complete") buildRoutes();
  else window.addEventListener("load", buildRoutes);
})();
