// AI health panel: three examiners + a head reviewer, with safety rules the
// AI cannot override (most-urgent-wins, deterministic red flags, low-confidence fallback).
window.HealthAI = (function () {
  var KB = window.HealthKB;

  var EXAMINERS = [
    { id: 'signs', icon: '🔎', name: 'Signs Examiner', focus: 'You read the photos closely: comb and wattle color, eyes, nostrils, posture, feathers, vent, legs, feet and droppings. Report only what you can actually see.' },
    { id: 'diff', icon: '🧪', name: 'Differential Specialist', focus: 'You weigh the owner\'s symptoms and history against the photos and rank the most likely common poultry conditions, including normal explanations such as molt.' },
    { id: 'bio', icon: '🛡️', name: 'Biosecurity & Urgency Officer', focus: 'You judge how urgent this is, whether it could be contagious or a reportable disease (avian influenza, virulent Newcastle, ILT), and what the owner must do right now to protect the rest of the flock.' }
  ];

  var RULES = [
    'Safety rules (always follow):',
    '- You are not a veterinarian and this is not a diagnosis. Use words like "possible" and "consistent with".',
    '- Never give medication names with doses, dosing schedules, or injection instructions. Say "ask your vet about treatment options" instead, and remind the owner about egg and meat withdrawal times when medicine is involved.',
    '- If sudden deaths, several sick birds, purple or swollen combs, twisted necks with breathing signs, or a laying crash with breathing signs are present, set reportable_concern true and tell the owner to call their vet or state veterinarian, or the USDA sick-bird line ' + KB.USDA_LINE + ', and not to move birds or eggs off the property.',
    '- If photos are too poor or information too thin to judge, set confidence "low" and say what photo or information is needed.',
    '- Give practical, kind, plain-language supportive steps (isolation, warmth, shade, water, soft food, clean bedding).',
    '- Never discuss fighting, conditioning for fights, gaffs, or performance in a fight.'
  ].join('\n');

  function context(bird, symptoms, history, media) {
    var names = KB.CONDITIONS.map(function (c) { return c.name; }).join('; ');
    return [
      'Flock type: ' + (bird.mode === 'gamefowl' ? 'gamefowl breeder' : 'backyard chicken keeper') + '.',
      'Bird: "' + (bird.name || 'unnamed') + '", ' + (bird.age || 'age unknown') + ', ' + (bird.sex || 'sex unknown') + '.',
      'Owner-reported signs: ' + (symptoms.length ? symptoms.map(function (s) { return KB.LABEL[s] || s; }).join('; ') : 'none selected') + '.',
      'History: ' + Object.keys(history).filter(function (k) { return history[k]; }).map(function (k) { return k + ': ' + history[k]; }).join('; ') + '.',
      media.length ? 'Attached photos, in order: ' + media.join(', ') + '.' : 'No photos attached.',
      'Common conditions to consider (use these names when they fit; others allowed): ' + names + '.'
    ].join('\n');
  }

  function examinerPrompt(ex, bird, symptoms, history, media) {
    return [
      'You are the ' + ex.name + ' on a three-member AI poultry health panel helping a flock owner decide what to do next.',
      ex.focus, '', context(bird, symptoms, history, media), '', RULES, '',
      'Reply with JSON only, exactly this shape:',
      '{"observations":["what you see or note, max 6"],"urgency":"emergency|vet|monitor|normal",',
      ' "possible_conditions":[{"name":"...","likelihood":"high|moderate|low","why":"max 15 words"}],',
      ' "red_flags":["..."],"reportable_concern":false,"immediate_steps":["max 5"],"tell_vet":["facts to tell the vet, max 5"],',
      ' "photos_needed":["..."],"confidence":"low|medium|high"}'
    ].join('\n');
  }

  function headPrompt(bird, symptoms, history, cards, merged) {
    return [
      'You are the head reviewer of a three-member AI poultry health panel. Combine the panel\'s findings into one clear, calm answer for the owner.',
      context(bird, symptoms, history, []),
      'Panel findings (JSON): ' + JSON.stringify(cards.map(function (c) { return { member: c.ex.name, result: c.result }; })),
      'Most urgent level reached by the panel and safety rules: ' + merged.urgency + '. You may not lower it.',
      '', RULES, '',
      'Reply with JSON only: {"summary":"2-3 plain sentences","top_conditions":[{"name":"...","likelihood":"high|moderate|low","why":"..."}],',
      '"steps":["what to do now, max 6"],"tell_vet":["max 5"],"watch_for":["signs that mean get help now, max 4"],"reportable_concern":true|false,"confidence":"low|medium|high"}'
    ].join('\n');
  }

  function chatRules(bird, result) {
    return [
      'You are the Gamefowl Pro Flock Health Assistant answering follow-up questions about one bird\'s health check.',
      'Earlier panel result (JSON): ' + JSON.stringify(result),
      'Bird: ' + JSON.stringify(bird), '', RULES,
      'Answer in short plain paragraphs or a short list. If the owner describes worsening signs, tell them to call a vet now.'
    ].join('\n');
  }

  function arr(a, n) { return Array.isArray(a) ? a.map(function (x) { return typeof x === 'string' ? x : JSON.stringify(x); }).slice(0, n || 6) : []; }
  function lvl(u) { return KB.URGENCY[u] ? u : 'monitor'; }

  function normalize(r) {
    r = r && typeof r === 'object' ? r : {};
    return {
      observations: arr(r.observations), urgency: lvl(r.urgency),
      possible_conditions: (Array.isArray(r.possible_conditions) ? r.possible_conditions : []).slice(0, 6).map(function (c) {
        return { name: String(c && c.name || '').slice(0, 80), likelihood: ['high', 'moderate', 'low'].indexOf(c && c.likelihood) >= 0 ? c.likelihood : 'low', why: String(c && c.why || '').slice(0, 140) };
      }).filter(function (c) { return c.name; }),
      red_flags: arr(r.red_flags), reportable_concern: r.reportable_concern === true, immediate_steps: arr(r.immediate_steps),
      tell_vet: arr(r.tell_vet), photos_needed: arr(r.photos_needed),
      confidence: ['low', 'medium', 'high'].indexOf(r.confidence) >= 0 ? r.confidence : 'medium'
    };
  }

  function maxUrgency(list) {
    return list.reduce(function (best, u) { return KB.URGENCY[u] && KB.URGENCY[u].rank > KB.URGENCY[best].rank ? u : best; }, 'normal');
  }

  function merge(cards, symptoms) {
    var rf = KB.redFlags(symptoms);
    var urg = maxUrgency(cards.map(function (c) { return c.result.urgency; }).concat(rf.reportable ? ['emergency'] : []));
    var reportable = rf.reportable || cards.some(function (c) { return c.result.reportable_concern; });
    if (reportable) urg = 'emergency';
    var tally = {}, W = { high: 3, moderate: 2, low: 1 };
    cards.forEach(function (c) {
      c.result.possible_conditions.forEach(function (p) {
        var k = p.name.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z ]/g, '').trim();
        if (!tally[k]) tally[k] = { name: p.name, score: 0, votes: 0, why: p.why };
        tally[k].score += W[p.likelihood]; tally[k].votes++;
      });
    });
    var conditions = Object.keys(tally).map(function (k) { return tally[k]; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 5);
    var low = cards.filter(function (c) { return c.result.confidence === 'low'; }).length;
    return { urgency: urg, reportable: reportable, ruleFlags: rf.flags, conditions: conditions, unclear: low * 2 >= cards.length && cards.length > 0 };
  }

  return { EXAMINERS: EXAMINERS, examinerPrompt: examinerPrompt, headPrompt: headPrompt, chatRules: chatRules, normalize: normalize, merge: merge, maxUrgency: maxUrgency };
})();
