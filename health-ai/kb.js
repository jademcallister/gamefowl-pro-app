// Poultry health knowledge base: body areas, symptoms and common conditions.
// Educational reference only — not a diagnosis. No medication doses by design.
window.HealthKB = (function () {
  var AREAS = [
    { id: 'general', label: 'Whole bird / behavior', x: 50, y: 8 },
    { id: 'comb', label: 'Comb & wattles', x: 73, y: 14 },
    { id: 'eyes', label: 'Eyes', x: 82, y: 25 },
    { id: 'nose', label: 'Beak & nostrils', x: 93, y: 31 },
    { id: 'breathing', label: 'Breathing', x: 68, y: 38 },
    { id: 'neck', label: 'Head & neck', x: 66, y: 27 },
    { id: 'crop', label: 'Crop', x: 72, y: 50 },
    { id: 'feathers', label: 'Feathers & skin', x: 40, y: 38 },
    { id: 'abdomen', label: 'Belly', x: 50, y: 64 },
    { id: 'vent', label: 'Vent', x: 18, y: 58 },
    { id: 'droppings', label: 'Droppings', x: 12, y: 80 },
    { id: 'legs', label: 'Legs & hocks', x: 52, y: 78 },
    { id: 'feet', label: 'Feet', x: 56, y: 93 },
    { id: 'eggs', label: 'Eggs & laying', x: 28, y: 92 }
  ];

  var SYMPTOMS = {
    general: [['lethargic', 'Sleepy, dull, lethargic'], ['fluffed_up', 'Fluffed up, hunched'], ['not_eating', 'Not eating'], ['not_drinking', 'Not drinking'], ['weight_loss', 'Losing weight / thin keel'], ['sudden_death', 'Sudden deaths in the flock'], ['many_sick', 'Several birds sick at once'], ['isolating', 'Hiding / standing alone'], ['wings_out', 'Wings held away from body']],
    comb: [['pale_comb', 'Pale comb or face'], ['purple_comb', 'Comb/wattles purple or dark'], ['swollen_comb', 'Swollen head, comb, wattles or face'], ['comb_scabs', 'Scabs or warty bumps on comb/face'], ['comb_black_tips', 'Black or grey tips (cold weather)']],
    eyes: [['watery_eyes', 'Watery eyes'], ['swollen_eye', 'Swollen eye or eyelid'], ['eye_foam', 'Bubbles or foam in eye'], ['cloudy_eye', 'Grey / irregular pupil'], ['closed_eye', 'Eye kept closed']],
    nose: [['nasal_discharge', 'Discharge from nostrils'], ['smelly_face', 'Foul smell from face/nose'], ['sneezing', 'Sneezing'], ['mouth_plaques', 'Yellow patches in mouth']],
    breathing: [['gasping', 'Open-mouth breathing / gasping'], ['rattling', 'Rattling, gurgling breath'], ['coughing', 'Coughing'], ['neck_stretch', 'Stretching neck up to breathe'], ['bloody_mucus', 'Blood or mucus coughed up'], ['panting', 'Panting in hot weather']],
    neck: [['twisted_neck', 'Twisted neck / star-gazing'], ['limp_neck', 'Limp neck, can’t lift head'], ['head_shaking', 'Head shaking'], ['tremors', 'Tremors or poor balance']],
    crop: [['crop_full_morning', 'Crop still full in the morning'], ['crop_sour', 'Squishy crop, sour smell'], ['crop_hard', 'Hard, packed crop']],
    feathers: [['feather_loss', 'Feather loss / bald patches'], ['lice_eggs', 'Egg clusters at feather base'], ['mites_seen', 'Mites or lice seen crawling'], ['scabby_skin', 'Scabby or red skin']],
    abdomen: [['swollen_abdomen', 'Swollen, fluid-filled belly'], ['penguin', 'Upright “penguin” stance']],
    vent: [['pasty_vent', 'Droppings stuck to vent (chick)'], ['vent_protrusion', 'Tissue protruding from vent'], ['straining', 'Straining, tail pumping'], ['vent_dirty', 'Dirty, crusty vent feathers']],
    droppings: [['bloody_droppings', 'Blood in droppings'], ['green_droppings', 'Bright green droppings'], ['watery_droppings', 'Very watery droppings'], ['worms_seen', 'Worms seen in droppings'], ['white_droppings', 'Chalky white diarrhea']],
    legs: [['limping', 'Limping'], ['leg_splay', 'One leg forward, one back'], ['raised_scales', 'Raised, crusty leg scales'], ['swollen_hock', 'Swollen hock joint'], ['cant_stand', 'Can’t stand or walk']],
    feet: [['foot_swelling', 'Swollen foot pad'], ['black_scab_foot', 'Black scab on foot pad'], ['curled_toes', 'Toes curled under (chick)']],
    eggs: [['drop_in_lay', 'Sudden drop in laying'], ['soft_shells', 'Soft or thin shells'], ['misshapen_eggs', 'Misshapen or wrinkled eggs'], ['egg_stuck', 'Straining with no egg']]
  };

  var LABEL = {};
  Object.keys(SYMPTOMS).forEach(function (a) { SYMPTOMS[a].forEach(function (s) { LABEL[s[0]] = s[1]; }); });

  // urgency: emergency | vet | monitor | normal
  var CONDITIONS = [
    { id: 'hpai', name: 'Avian influenza (bird flu)', urgency: 'emergency', reportable: true, contagious: true,
      signs: ['sudden_death', 'many_sick', 'purple_comb', 'swollen_comb', 'not_eating', 'lethargic', 'drop_in_lay', 'soft_shells', 'misshapen_eggs', 'nasal_discharge', 'coughing', 'twisted_neck', 'tremors', 'green_droppings'],
      summary: 'A reportable, highly contagious virus. Sudden deaths, purple or swollen combs and a crash in laying are classic warning signs.',
      actions: ['Do not move birds, eggs, manure or equipment off the property.', 'Isolate sick birds and wear dedicated boots and clothes.', 'Call your vet or state veterinarian today, or the USDA sick-bird line: 1-866-536-7593.'],
      prevention: 'Keep wild birds and waterfowl away from your flock, feed and water; quarantine new birds 30 days.' },
    { id: 'vnd', name: 'Virulent Newcastle disease', urgency: 'emergency', reportable: true, contagious: true,
      signs: ['gasping', 'coughing', 'sneezing', 'twisted_neck', 'tremors', 'leg_splay', 'cant_stand', 'green_droppings', 'watery_droppings', 'swollen_comb', 'sudden_death', 'many_sick', 'drop_in_lay', 'soft_shells'],
      summary: 'A reportable virus causing breathing problems, nervous signs such as twisted necks, green diarrhea and sudden deaths.',
      actions: ['Isolate the flock and stop all bird movement.', 'Call your vet or state veterinarian, or USDA at 1-866-536-7593.'],
      prevention: 'Biosecurity, quarantine of new birds, and never mixing birds from shows or swaps without quarantine.' },
    { id: 'ilt', name: 'Infectious laryngotracheitis (ILT)', urgency: 'vet', reportable: true, contagious: true,
      signs: ['neck_stretch', 'gasping', 'bloody_mucus', 'coughing', 'rattling', 'watery_eyes', 'drop_in_lay', 'sudden_death'],
      summary: 'A respiratory virus; birds stretch their necks to breathe and may cough up bloody mucus. Reportable in many states.',
      actions: ['Isolate affected birds.', 'Call your vet for testing; ask whether your state requires reporting.'],
      prevention: 'Biosecurity; vaccination plans should be made with a vet.' },
    { id: 'ib', name: 'Infectious bronchitis', urgency: 'vet', contagious: true,
      signs: ['coughing', 'sneezing', 'rattling', 'nasal_discharge', 'watery_eyes', 'drop_in_lay', 'soft_shells', 'misshapen_eggs', 'many_sick'],
      summary: 'A fast-spreading respiratory virus that often leaves wrinkled or soft-shelled eggs behind.',
      actions: ['Isolate sick birds; keep them warm and draft-free with easy access to water.', 'Have your vet confirm, since signs overlap with reportable diseases.'],
      prevention: 'Quarantine new birds; good ventilation without drafts.' },
    { id: 'mg', name: 'Mycoplasma (MG / chronic respiratory disease)', urgency: 'vet', contagious: true,
      signs: ['sneezing', 'nasal_discharge', 'rattling', 'swollen_eye', 'eye_foam', 'watery_eyes', 'coughing', 'weight_loss'],
      summary: 'A common bacterial respiratory infection; foamy eyes and rattling breath are typical. Birds can stay carriers.',
      actions: ['Isolate the bird and talk to your vet about testing and options.', 'Recovered birds may still carry it — discuss with your vet before selling or showing.'],
      prevention: 'Buy from tested flocks (NPIP), quarantine new birds.' },
    { id: 'coryza', name: 'Infectious coryza', urgency: 'vet', contagious: true,
      signs: ['smelly_face', 'swollen_eye', 'swollen_comb', 'nasal_discharge', 'closed_eye', 'drop_in_lay', 'not_eating'],
      summary: 'A bacterial infection known for a swollen face and a strong foul smell from the nose and eyes.',
      actions: ['Isolate affected birds immediately.', 'Call your vet; carriers are common, so plan with the vet before adding birds.'],
      prevention: 'Closed flock or strict quarantine of new birds.' },
    { id: 'mareks', name: 'Marek’s disease', urgency: 'vet', contagious: true,
      signs: ['leg_splay', 'cloudy_eye', 'weight_loss', 'limping', 'cant_stand', 'lethargic', 'wings_out'],
      summary: 'A herpes virus that causes paralysis — classically one leg forward, one leg back — and grey, irregular pupils.',
      actions: ['Separate the bird and keep it comfortable with food and water in reach.', 'A vet can confirm; vaccinate future chicks.'],
      prevention: 'Vaccinate day-old chicks; keep young chicks away from older birds’ dander.' },
    { id: 'pox', name: 'Fowl pox', urgency: 'monitor', contagious: true,
      signs: ['comb_scabs', 'mouth_plaques', 'gasping', 'drop_in_lay', 'watery_eyes'],
      summary: 'A slow-spreading virus. Dry pox makes scabs on the comb and face; wet pox makes yellow patches in the mouth that can block breathing.',
      actions: ['Isolate and keep the bird eating soft food and drinking.', 'See a vet if there are mouth patches or breathing trouble.'],
      prevention: 'Mosquito control; vaccination is available.' },
    { id: 'cocci', name: 'Coccidiosis', urgency: 'vet', contagious: true,
      signs: ['bloody_droppings', 'watery_droppings', 'fluffed_up', 'lethargic', 'not_eating', 'pale_comb', 'weight_loss'],
      summary: 'A gut parasite, most dangerous in chicks and growers. Bloody droppings and huddled, fluffed birds are the warning signs.',
      actions: ['Act the same day — it moves fast in young birds.', 'Call your vet or feed store about an approved coccidiosis treatment; keep litter dry.'],
      prevention: 'Dry litter, clean water, medicated starter or vaccination for chicks.' },
    { id: 'worms', name: 'Internal worms', urgency: 'monitor', contagious: true,
      signs: ['worms_seen', 'weight_loss', 'pale_comb', 'drop_in_lay', 'watery_droppings', 'lethargic'],
      summary: 'Roundworms and other worms rob nutrition; birds become thin and pale and lay less.',
      actions: ['Take a droppings sample to a vet for a fecal test.', 'Ask your vet which dewormer is approved for laying hens and its egg withdrawal time.'],
      prevention: 'Rotate runs, keep litter dry, routine fecal checks.' },
    { id: 'mites', name: 'Mites or lice', urgency: 'monitor', contagious: true,
      signs: ['lice_eggs', 'mites_seen', 'feather_loss', 'scabby_skin', 'pale_comb', 'vent_dirty', 'drop_in_lay'],
      summary: 'External parasites around the vent and under the wings; heavy mite loads cause pale combs (anemia).',
      actions: ['Check birds at night with a flashlight, including roosts and cracks.', 'Treat birds and coop together with a product labeled for poultry; follow the label.'],
      prevention: 'Dust-bathing area, regular checks, clean roosts.' },
    { id: 'scaly', name: 'Scaly leg mites', urgency: 'monitor', contagious: true,
      signs: ['raised_scales', 'limping'],
      summary: 'Tiny mites burrow under leg scales, which lift and crust.',
      actions: ['Ask your vet or feed store about a poultry-safe treatment for scaly leg.', 'Treat the whole flock and the roosts.'],
      prevention: 'Inspect legs of new birds before they join.' },
    { id: 'bumble', name: 'Bumblefoot', urgency: 'monitor',
      signs: ['foot_swelling', 'black_scab_foot', 'limping'],
      summary: 'A foot-pad infection, often from rough or high perches; a black scab with swelling is typical.',
      actions: ['Keep the bird on soft, clean bedding.', 'See a vet if swelling is large, hot or spreading — it can need minor surgery.'],
      prevention: 'Smooth, low perches and soft landing areas.' },
    { id: 'eggbound', name: 'Egg binding', urgency: 'emergency',
      signs: ['egg_stuck', 'straining', 'penguin', 'lethargic', 'fluffed_up', 'swollen_abdomen'],
      summary: 'A stuck egg. Hens strain, pump their tail and stand upright. It can become life-threatening within a day.',
      actions: ['Keep her warm and quiet in a crate.', 'Call a vet now if she is weak, or not better within a few hours.'],
      prevention: 'Layer feed with calcium available; healthy weight.' },
    { id: 'prolapse', name: 'Vent prolapse', urgency: 'emergency',
      signs: ['vent_protrusion', 'straining'],
      summary: 'Tissue pushes out of the vent. Other birds may peck it, so it is urgent.',
      actions: ['Separate the hen immediately so others can’t peck.', 'Keep the tissue clean and moist and call a vet.'],
      prevention: 'Avoid overweight hens; good calcium and diet.' },
    { id: 'sourcrop', name: 'Sour or impacted crop', urgency: 'monitor',
      signs: ['crop_full_morning', 'crop_sour', 'crop_hard', 'not_eating', 'weight_loss'],
      summary: 'The crop does not empty overnight — either squishy and sour or hard and packed.',
      actions: ['Check the crop first thing in the morning before feeding.', 'See a vet if it is still full the next morning or the bird is weak.'],
      prevention: 'Avoid long grass clippings and stringy foods; fresh grit.' },
    { id: 'ascites', name: 'Water belly / internal laying', urgency: 'vet',
      signs: ['swollen_abdomen', 'penguin', 'lethargic', 'gasping', 'pale_comb', 'purple_comb'],
      summary: 'Fluid or egg material builds up in the belly; the hen walks upright and may breathe hard.',
      actions: ['Have a vet examine her — this usually needs professional care.'],
      prevention: 'Discuss reproductive problems in a line with your vet.' },
    { id: 'heat', name: 'Heat stress', urgency: 'emergency',
      signs: ['panting', 'wings_out', 'lethargic', 'pale_comb', 'not_eating', 'sudden_death', 'drop_in_lay'],
      summary: 'Chickens can’t sweat. Panting with wings held out on a hot day is an emergency.',
      actions: ['Move to shade and moving air right away; offer cool water.', 'Mist legs and comb lightly; call a vet if the bird collapses.'],
      prevention: 'Shade, ventilation, cool water and frozen treats in summer.' },
    { id: 'frostbite', name: 'Frostbite', urgency: 'monitor',
      signs: ['comb_black_tips', 'swollen_comb', 'black_scab_foot'],
      summary: 'Cold damage to combs, wattles and toes — grey or black tips after freezing weather.',
      actions: ['Warm the bird gradually; do not rub the area.', 'Let damaged tips fall off on their own; see a vet if it smells or swells.'],
      prevention: 'Dry, well-ventilated coop; wide roosts so feet are covered.' },
    { id: 'vitE', name: 'Vitamin E / selenium deficiency (“crazy chick”)', urgency: 'vet',
      signs: ['twisted_neck', 'tremors', 'cant_stand', 'head_shaking'],
      summary: 'In young chicks, a twisted neck, tremors and falling over can come from vitamin E shortage.',
      actions: ['Call a vet — twisted neck can also be a reportable disease.', 'Ask about vitamin E support and check the feed’s age and storage.'],
      prevention: 'Fresh, properly stored chick starter.' },
    { id: 'ribo', name: 'Riboflavin (B2) deficiency — curled toe', urgency: 'vet',
      signs: ['curled_toes', 'cant_stand', 'limping'],
      summary: 'Chicks walk on their hocks with toes curled under.',
      actions: ['Talk to a vet or poultry nutritionist about B-vitamin support.', 'Check that chicks are on a complete chick starter.'],
      prevention: 'Complete starter feed; breeder hens on a breeder ration.' },
    { id: 'pasty', name: 'Pasty butt (chicks)', urgency: 'monitor',
      signs: ['pasty_vent'],
      summary: 'Droppings dry over a chick’s vent and can block it.',
      actions: ['Gently soften and remove the dried droppings with warm water.', 'Check brooder temperature — too hot or cold makes it worse.'],
      prevention: 'Correct brooder heat and clean water.' },
    { id: 'asper', name: 'Aspergillosis (brooder pneumonia)', urgency: 'vet',
      signs: ['gasping', 'lethargic', 'not_eating', 'watery_eyes', 'many_sick'],
      summary: 'A mold infection from damp or moldy bedding or feed, most common in chicks.',
      actions: ['Replace bedding and feed immediately.', 'Call a vet for affected birds.'],
      prevention: 'Dry, dust-free, mold-free bedding and feed.' },
    { id: 'botulism', name: 'Botulism (limberneck)', urgency: 'emergency',
      signs: ['limp_neck', 'cant_stand', 'closed_eye', 'sudden_death', 'many_sick'],
      summary: 'A toxin from rotting material or stagnant water causes paralysis that starts in the legs and moves to the neck.',
      actions: ['Remove any carcasses, rotten food and stagnant water now.', 'Call a vet immediately.'],
      prevention: 'Remove dead animals promptly; clean water; no spoiled scraps.' },
    { id: 'cholera', name: 'Fowl cholera', urgency: 'vet', contagious: true,
      signs: ['sudden_death', 'swollen_comb', 'purple_comb', 'green_droppings', 'nasal_discharge', 'swollen_hock', 'limping'],
      summary: 'A bacterial disease; can cause sudden deaths, dark swollen wattles and green diarrhea.',
      actions: ['Isolate sick birds and call a vet — signs overlap with reportable diseases.'],
      prevention: 'Rodent and wild-bird control; biosecurity.' },
    { id: 'molt', name: 'Normal molt (not a disease)', urgency: 'normal',
      signs: ['feather_loss', 'drop_in_lay'],
      summary: 'Yearly feather replacement, usually in late summer or fall. Laying slows or stops and birds look ragged.',
      actions: ['Raise protein for a few weeks; handle gently, new feathers are tender.'],
      prevention: 'Nothing to prevent — it’s normal.' }
  ];

  var URGENCY = {
    emergency: { rank: 4, label: 'Emergency', advice: 'Act now — call a vet today.' },
    vet: { rank: 3, label: 'See a vet soon', advice: 'Contact a vet within 24–48 hours.' },
    monitor: { rank: 2, label: 'Monitor & care', advice: 'Isolate if needed, give supportive care, and watch closely.' },
    normal: { rank: 1, label: 'Likely normal', advice: 'Probably not illness — keep an eye on it.' }
  };

  // Deterministic red-flag rules that always run, AI or not.
  function redFlags(sel) {
    var has = function (k) { return sel.indexOf(k) >= 0; }, flags = [];
    if (has('sudden_death') || has('many_sick')) flags.push('Several birds sick or dying quickly');
    if (has('purple_comb') && (has('swollen_comb') || has('not_eating'))) flags.push('Purple or swollen comb with illness');
    if ((has('twisted_neck') || has('tremors') || has('leg_splay')) && (has('gasping') || has('coughing') || has('green_droppings'))) flags.push('Nervous signs together with breathing or green droppings');
    if (has('drop_in_lay') && (has('coughing') || has('gasping') || has('sudden_death'))) flags.push('Laying crash with breathing signs or deaths');
    return { reportable: flags.length > 0, flags: flags };
  }

  function match(sel) {
    return CONDITIONS.map(function (c) {
      var hit = c.signs.filter(function (s) { return sel.indexOf(s) >= 0; });
      return { c: c, hit: hit, score: hit.length ? hit.length / Math.sqrt(c.signs.length) : 0 };
    }).filter(function (m) { return m.hit.length; }).sort(function (a, b) { return b.score - a.score || URGENCY[b.c.urgency].rank - URGENCY[a.c.urgency].rank; });
  }

  return { AREAS: AREAS, SYMPTOMS: SYMPTOMS, LABEL: LABEL, CONDITIONS: CONDITIONS, URGENCY: URGENCY, redFlags: redFlags, match: match,
    USDA_LINE: '1-866-536-7593' };
})();
