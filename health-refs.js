// Reference links per condition. Merck Veterinary Manual URLs were checked live.
// Forum and image links are searches, so they always show current real-world cases.

const MERCK = "https://www.merckvetmanual.com/poultry/";

const HEALTH_REFS = {
  ear_abscess: { merck: [["Staphylococcosis in poultry", "staphylococcosis/staphylococcosis-in-poultry"]], search: "chicken ear infection abscess pus" },
  pox_dry: { merck: [["Fowlpox in chickens and turkeys", "fowlpox/fowlpox-in-chickens-and-turkeys"]], search: "dry fowl pox comb scabs" },
  pox_wet: { merck: [["Fowlpox in chickens and turkeys", "fowlpox/fowlpox-in-chickens-and-turkeys"]], search: "wet fowl pox mouth throat lesions" },
  favus: { merck: [], search: "favus white comb chicken" },
  mites: { merck: [["Mites of poultry", "arthropods-in-poultry/mites-of-poultry"]], search: "northern fowl mites red mites chicken" },
  lice: { merck: [["Lice of poultry", "arthropods-in-poultry/lice-of-poultry"]], search: "chicken lice eggs feather base" },
  scaly_leg: { merck: [["Mites of poultry (scaly leg mite section)", "arthropods-in-poultry/mites-of-poultry"]], search: "scaly leg mites chicken" },
  fowl_cholera: { merck: [["Fowl cholera", "fowl-cholera/fowl-cholera"]], search: "fowl cholera swollen wattles" },
  coryza: { merck: [["Infectious coryza", "infectious-coryza/infectious-coryza"]], search: "infectious coryza swollen face smell" },
  myco: { merck: [["Mycoplasma gallisepticum infection", "mycoplasmosis/mycoplasma-gallisepticum-infection-in-poultry"]], search: "mycoplasma chicken foamy eye" },
  ib: { merck: [["Infectious bronchitis in chickens", "infectious-bronchitis/infectious-bronchitis-in-chickens"]], search: "infectious bronchitis chicken" },
  mareks: { merck: [["Marek's disease in poultry", "neoplasms-in-poultry/marek-s-disease-in-poultry"]], search: "marek's disease chicken leg paralysis" },
  bumblefoot: { merck: [["Staphylococcosis in poultry (bumblefoot)", "staphylococcosis/staphylococcosis-in-poultry"]], search: "bumblefoot chicken" },
  sour_crop: { merck: [["Candidiasis in poultry", "candidiasis-in-poultry/candidiasis-in-poultry"]], search: "sour crop chicken" },
  impact_crop: { merck: [["Pendulous crop in poultry", "miscellaneous-conditions-of-poultry/pendulous-crop-in-poultry"]], search: "impacted crop chicken" },
  cocci: { merck: [["Coccidiosis in poultry", "coccidiosis-in-poultry/coccidiosis-in-poultry"]], search: "coccidiosis bloody droppings chicken" },
  worms: { merck: [["Helminthiasis in poultry", "helminthiasis/helminthiasis-in-poultry"]], search: "roundworms chicken droppings" },
  frostbite: { merck: [], search: "frostbite chicken comb" },
  injury: { merck: [["Cannibalism in poultry", "miscellaneous-conditions-of-poultry/cannibalism-in-poultry"]], search: "chicken peck wound care" },
  vit_e: {
    merck: [["Nutritional myopathy in poultry", "myopathies-in-poultry/nutritional-myopathy-in-poultry"], ["Vitamin deficiencies in poultry", "nutrition-and-management-poultry/vitamin-deficiencies-in-poultry"]],
    search: "wry neck chicken vitamin e",
  },
  newcastle_ai: {
    merck: [["Avian influenza", "avian-influenza-in-poultry-and-wild-birds/avian-influenza-in-poultry-and-wild-birds"], ["Newcastle disease in poultry", "newcastle-disease-and-other-avian-paramyxovirus-infections/newcastle-disease-in-poultry"]],
    search: "avian influenza symptoms backyard chickens",
  },
  aspergillosis: { merck: [["Aspergillosis in poultry", "aspergillosis/aspergillosis-in-poultry"]], search: "aspergillosis chicken" },
  vit_a: { merck: [["Vitamin deficiencies in poultry", "nutrition-and-management-poultry/vitamin-deficiencies-in-poultry"]], search: "vitamin a deficiency chicken eye" },
  heat: { merck: [], search: "heat stress chickens panting" },
  ilt: { merck: [["Infectious laryngotracheitis", "infectious-laryngotracheitis/infectious-laryngotracheitis"]], search: "infectious laryngotracheitis chickens" },
  ms: { merck: [["Mycoplasma synoviae infection", "mycoplasmosis/mycoplasma-synoviae-infection-in-poultry"]], search: "mycoplasma synoviae swollen hocks chicken" },
  pullorum: { merck: [["Pullorum disease in poultry", "salmonelloses-in-poultry/pullorum-disease-in-poultry"]], search: "pullorum disease chicks NPIP" },
  colibacillosis: { merck: [["Colibacillosis in poultry", "colibacillosis/colibacillosis-in-poultry"]], search: "colibacillosis E coli chickens" },
  botulism: { merck: [["Botulism in poultry", "botulism/botulism-in-poultry"]], search: "limberneck botulism chicken" },
  egg_bound: { merck: [["Egg-bound or impacted oviducts", "disorders-of-the-reproductive-system-in-poultry/egg-bound-or-impacted-oviducts-in-poultry"]], search: "egg bound hen treatment" },
  prolapse: { merck: [["Prolapse of the oviduct", "disorders-of-the-reproductive-system-in-poultry/prolapse-of-the-oviduct-in-poultry"]], search: "prolapsed vent hen" },
  egg_peritonitis: { merck: [["Egg peritonitis in poultry", "disorders-of-the-reproductive-system-in-poultry/egg-peritonitis-in-poultry"]], search: "egg peritonitis hen swollen belly" },
  blackhead: { merck: [["Histomoniasis in poultry", "histomoniasis/histomoniasis-in-poultry"]], search: "blackhead histomoniasis chickens" },
  gapeworm: { merck: [["Helminthiasis in poultry (gapeworm)", "helminthiasis/helminthiasis-in-poultry"]], search: "gapeworm chickens" },
  ibd: { merck: [["Infectious bursal disease", "infectious-bursal-disease/infectious-bursal-disease-in-poultry"]], search: "gumboro infectious bursal disease chicks" },
  ae: { merck: [["Avian encephalomyelitis", "avian-encephalomyelitis/avian-encephalomyelitis"]], search: "avian encephalomyelitis epidemic tremor chicks" },
  leukosis: { merck: [["Avian leukosis in poultry", "neoplasms-in-poultry/avian-leukosis-in-poultry"]], search: "avian leukosis tumors chickens" },
  riboflavin: { merck: [["Vitamin deficiencies in poultry", "nutrition-and-management-poultry/vitamin-deficiencies-in-poultry"]], search: "curled toe paralysis riboflavin chicks" },
};

// Build the list of links shown on a condition card and given to the AI expert.
function healthRefLinks(conditionId) {
  const r = HEALTH_REFS[conditionId];
  if (!r) return [];
  const q = encodeURIComponent(r.search);
  return [
    ...r.merck.map(([title, path]) => ({ kind: "merck", title: `Merck Vet Manual: ${title}`, url: MERCK + path })),
    { kind: "forum", title: "Real cases on BackyardChickens.com", url: `https://www.google.com/search?q=site%3Abackyardchickens.com+${q}` },
    { kind: "pdvm", title: "PoultryDVM write-ups", url: `https://www.google.com/search?q=site%3Apoultrydvm.com+${q}` },
    { kind: "extension", title: "University extension guides", url: `https://www.google.com/search?q=${q}+poultry+extension+site%3Aedu` },
    { kind: "images", title: "More photos (image search)", url: `https://www.google.com/search?tbm=isch&q=${q}` },
  ];
}

// General sources shown in the Sources Library and searched by Ask an Expert.
const HEALTH_SOURCES = [
  { group: "Veterinary references", items: [
    ["Merck Veterinary Manual: Poultry", "https://www.merckvetmanual.com/poultry"],
    ["Merck: Vaccination programs for poultry", MERCK + "nutrition-and-management-poultry/vaccination-programs-for-poultry"],
    ["Merck: Nutritional requirements of poultry", MERCK + "nutrition-and-management-poultry/nutritional-requirements-of-poultry"],
    ["PoultryDVM: symptom checker and disease A-Z", "https://www.poultrydvm.com/"],
    ["American Association of Avian Pathologists", "https://www.aaap.info/"],
  ]},
  { group: "Government", items: [
    ["USDA APHIS: Defend the Flock (biosecurity)", "https://www.aphis.usda.gov/livestock-poultry-disease/avian/defend-the-flock-program"],
    ["USDA APHIS: Avian influenza", "https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza"],
    ["National Poultry Improvement Plan (NPIP)", "https://www.poultryimprovement.org/"],
    ["FDA: Veterinary Feed Directive and antibiotics", "https://www.fda.gov/animal-veterinary"],
  ]},
  { group: "University extension", items: [
    ["Poultry Extension (extension.org network)", "https://poultry.extension.org/"],
    ["Penn State Extension: Poultry", "https://extension.psu.edu/animals-and-livestock/poultry"],
    ["University of Minnesota Extension: Poultry", "https://extension.umn.edu/agriculture/animals-and-livestock/poultry"],
    ["UC Davis Veterinary Medicine: Poultry", "https://vetmed.ucdavis.edu/"],
    ["Mississippi State Extension: Poultry", "https://extension.msstate.edu/agriculture/livestock/poultry"],
    ["UGA Poultry Science Extension", "https://poultry.caes.uga.edu/extension.html"],
    ["NC State Poultry Extension", "https://poultry.ces.ncsu.edu/"],
    ["Texas A&M AgriLife: Poultry", "https://poultry.tamu.edu/"],
    ["Auburn University College of Agriculture (poultry science)", "https://agriculture.auburn.edu/"],
    ["Cornell Animal Health Diagnostic Center", "https://www.vet.cornell.edu/animal-health-diagnostic-center"],
  ]},
  { group: "Keepers and real cases", items: [
    ["BackyardChickens.com: Emergencies, Diseases, Injuries and Cures", "https://www.backyardchickens.com/forums/emergencies-diseases-injuries-and-cures.11/"],
    ["Wikimedia Commons: Poultry diseases (photos)", "https://commons.wikimedia.org/wiki/Category:Poultry_diseases"],
  ]},
  { group: "Get a diagnosis", items: [
    ["Find a state diagnostic lab (AAVLD)", "https://www.aavld.org/accredited-labs"],
    ["USDA sick-bird hotline: 1-866-536-7593", "tel:18665367593"],
  ]},
];

if (typeof module !== "undefined") module.exports = { HEALTH_REFS, HEALTH_SOURCES, healthRefLinks };
