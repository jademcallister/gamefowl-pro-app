// Judging core: checkpoints, judge personas, prompts, normalization, consensus.
// Pure functions — no DOM — so the same logic can later run on a server.
window.GPCore = (function () {
  var POINTS = [
    { key: 'toes', label: 'Toes & claws', short: 'Toes', rule: 'Toes straight, fully formed, similar side to side (three forward, one back). Claws do not curl into the foot. Pads free of sores or swelling.' },
    { key: 'feet', label: 'Feet & shanks', short: 'Feet', rule: 'Stands comfortably on both feet, legs support the bird evenly. No swelling, twisting, or feet turning markedly in or out. Healthy scales; shanks similar in size.' },
    { key: 'hocks', label: 'Hocks & thighs', short: 'Hocks', rule: 'Joints even on both sides, no obvious enlargement or stiffness. Thighs proportionate to the body — not weak behind or unusually heavy in front.' },
    { key: 'stance', label: 'Stance & gait', short: 'Stance', rule: 'Stable stance from side and front. At a calm walk: even steps, both feet placed securely, turns without limping, stumbling or favoring a leg. Without video frames, score stance only.' },
    { key: 'body', label: 'Body & keel', short: 'Body', rule: 'Balanced and symmetrical. Back straight and well supported. Breastbone not crooked or sharply prominent. Shape does not appear to strain the legs.' },
    { key: 'wings', label: 'Wings & shoulders', short: 'Wings', rule: 'Both wings sit evenly against the body, no persistent droop or side-to-side difference. Feathers reasonably complete and clean.' },
    { key: 'head', label: 'Neck, head & crest', short: 'Head', rule: 'Neck moves freely, head held normally. For a crested (Toppy) bird the crest must not block vision or interfere with eating. Non-crested: judge neck and head only.' },
    { key: 'tail', label: 'Tail & tail set', short: 'Tail', rule: 'Tail balanced with the back and carried naturally, no persistent droop or twist. Feather wear (frayed sickles) is condition, not conformation, and lowers the score only slightly.' }
  ];

  var JUDGES = [
    { id: 'soundness', icon: '🦶', name: 'Soundness Judge', focus: 'You look hardest at toes, claws, pads, feet, shanks, hocks, stance and — when walking-video frames are attached — gait. You are strict about anything that may be a soundness problem.' },
    { id: 'type', icon: '⚖️', name: 'Type & Balance Judge', focus: 'You look hardest at body, keel, back, wings, shoulders, tail set and overall balance and symmetry.' },
    { id: 'eye', icon: '👁️', name: "Breeder's Eye Judge", focus: 'You judge the whole bird as an experienced breeder would: overall build, neck, head and crest, and you separate feather condition from conformation. You also comment on how the bird fits the owner\'s line standard, if one is given.' }
  ];

  function stdText(std) {
    if (!std) return '';
    var parts = [['body', 'Ideal body type'], ['legs', 'Leg color'], ['eyes', 'Eye color'], ['tail', 'Tail angle'], ['hackle', 'Hackle color'], ['notes', 'Other']]
      .filter(function (p) { return std[p[0]]; }).map(function (p) { return p[1] + ': ' + std[p[0]]; });
    return parts.length ? parts.join('; ') : '';
  }

  function judgePrompt(j, bird, media, std) {
    var line = stdText(std);
    return [
      'You are the ' + j.name + ' on a three-judge AI panel that analyzes gamefowl conformation and soundness for a breeder deciding which birds to keep and breed.',
      j.focus,
      '',
      'Bird: "' + (bird.band || 'unknown') + '", ' + (bird.cls || 'class not given') + (bird.line ? ', line: ' + bird.line : '') + ', crested: ' + (bird.crest === 'yes' ? 'yes' : 'no') + '.',
      'Attached images, in order: ' + media.join(', ') + '.',
      line && j.id === 'eye' ? 'Owner\'s line standard: ' + line + '.' : '',
      '',
      'Score each of these 8 checkpoints 1-10 (10 = ideal) from what the images actually show:',
      POINTS.map(function (p, i) { return (i + 1) + '. ' + p.key + ' (' + p.label + '): ' + p.rule; }).join('\n'),
      '',
      'Rules:',
      '- If an area cannot be clearly seen, give score null and note "not visible". Never guess.',
      '- Each note is 8 words or fewer.',
      '- Soundness flags are separate from scores: pad sores or swelling (possible bumblefoot), swollen joints, limping or favoring a leg, persistent wing droop, twisted keel. List only what you can see.',
      '- Set not_judgeable true if the images show sparring, attached gaffs or artificial spurs, fresh wounds, or no chicken. Analyze conformation only; never comment on fighting ability.',
      '- Do not state a bloodline as fact.',
      '- If photos are too poor to judge, score everything null and say which photo is needed.',
      j.id === 'eye' ? '- line_fit: one or two sentences on how the bird fits the owner\'s line standard, or "" if none was given.' : '- line_fit: "".',
      '',
      'Reply with JSON only, exactly this shape:',
      '{"points":{"toes":{"score":<1-10 or null>,"note":"..."},"feet":{...},"hocks":{...},"stance":{...},"body":{...},"wings":{...},"head":{...},"tail":{...}},',
      ' "gait":"one sentence on gait, or \\"no video\\"","strengths":["..."],"watch":["..."],"soundness_flags":["..."],"missing_photos":["..."],',
      ' "line_fit":"","not_judgeable":false,"not_judgeable_reason":"","confidence":"low|medium|high"}'
    ].filter(function (l) { return l !== ''; }).join('\n');
  }

  function headPrompt(bird, cards, consensus, measures) {
    return [
      'You are the Head Judge of a three-judge AI panel analyzing a gamefowl\'s conformation and soundness for its breeder.',
      'Bird: "' + (bird.band || 'unknown') + '", ' + (bird.cls || '') + (bird.line ? ', line ' + bird.line : '') + '.',
      'Panel scorecards (JSON): ' + JSON.stringify(cards.map(function (c) { return { judge: c.judge.name, result: c.result }; })),
      'Consensus (median per checkpoint): ' + JSON.stringify(consensus),
      measures && measures.length ? 'Owner\'s own angle measurements: ' + measures.map(function (m) { return m.kind + ' ' + m.value + '°'; }).join(', ') + '.' : '',
      '',
      'Write a short, practical analysis for the breeder: plain words, specific, honest. Mention where the judges disagreed. Give a breeding view (strong candidate / keep and watch / not a breeding prospect) based on conformation and soundness only. Never comment on fighting ability.',
      'Reply with JSON only: {"summary":"2-3 sentences","verdict":"Strong breeding candidate|Keep and watch|Not a breeding prospect|Needs better photos","top_strengths":["max 3"],"improve":["max 3"],"pairing_tip":"one sentence on what to look for in a mate to balance this bird","photo_tips":["max 2"],"needs_hands_on_check":true|false,"check_reason":"..."}'
    ].filter(Boolean).join('\n');
  }

  function arr(a) { return Array.isArray(a) ? a.map(String).slice(0, 6) : []; }

  function normalize(r) {
    r = r && typeof r === 'object' ? r : {};
    var pts = r.points || {};
    var out = {
      points: {}, gait: String(r.gait || ''), strengths: arr(r.strengths), watch: arr(r.watch), soundness_flags: arr(r.soundness_flags),
      missing_photos: arr(r.missing_photos), line_fit: String(r.line_fit || ''),
      not_judgeable: r.not_judgeable === true || r.disqualify === true, not_judgeable_reason: String(r.not_judgeable_reason || r.disqualify_reason || ''),
      confidence: ['low', 'medium', 'high'].indexOf(r.confidence) >= 0 ? r.confidence : 'medium'
    };
    POINTS.forEach(function (p) {
      var v = pts[p.key] || {}, n = Number(v.score);
      out.points[p.key] = { score: v.score == null || v.score === '' || !isFinite(n) ? null : Math.max(1, Math.min(10, Math.round(n))), note: String(v.note || '').slice(0, 80) };
    });
    return out;
  }

  function median(nums) {
    if (!nums.length) return null;
    var s = nums.slice().sort(function (a, b) { return a - b; }), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function consensus(cards) {
    var out = {};
    POINTS.forEach(function (p) {
      var vals = cards.map(function (c) { return c.result.points[p.key].score; }).filter(function (v) { return v != null; });
      var m = median(vals);
      out[p.key] = { score: m == null ? null : Math.round(m * 10) / 10, spread: vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : 0, judges: vals.length };
    });
    return out;
  }

  function overall(points) {
    var v = POINTS.map(function (p) { var x = points[p.key]; return x && x.score != null ? x.score : (typeof x === 'number' ? x : null); }).filter(function (x) { return x != null; });
    return v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10 : null;
  }

  function recordLine(date, band, cons, n) {
    var o = overall(cons);
    return date + ' | ' + (band || 'band?') + ' | Overall ' + (o == null ? '–' : o.toFixed(1)) + ' | ' +
      POINTS.map(function (p) { return p.short + ' ' + (cons[p.key].score == null ? '–' : cons[p.key].score); }).join(', ') + ' | AI panel (' + n + ' judges)';
  }

  // Angle at vertex b for points a-b-c, and slope of a->b from horizontal (degrees)
  function angle3(a, b, c) {
    var v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y];
    var d = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]);
    if (!d) return null;
    var cos = Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d));
    return Math.round(Math.acos(cos) * 180 / Math.PI);
  }
  function slope2(a, b) {
    var deg = Math.atan2(-(b.y - a.y), b.x - a.x) * 180 / Math.PI;
    if (deg > 90) deg -= 180; if (deg < -90) deg += 180;
    return Math.round(Math.abs(deg));
  }

  return { POINTS: POINTS, JUDGES: JUDGES, judgePrompt: judgePrompt, headPrompt: headPrompt, normalize: normalize,
    median: median, consensus: consensus, overall: overall, recordLine: recordLine, angle3: angle3, slope2: slope2, stdText: stdText };
})();
