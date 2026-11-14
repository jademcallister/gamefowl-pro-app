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
};

// Build the list of links shown on a condition card and given to the AI expert.
function healthRefLinks(conditionId) {
  const r = HEALTH_REFS[conditionId];
  if (!r) return [];
  const q = encodeURIComponent(r.search);
  return [
    ...r.merck.map(([title, path]) => ({ kind: "merck", title: `Merck Vet Manual: ${title}`, url: MERCK + path })),
    { kind: "forum", title: "Real cases on BackyardChickens.com", url: `https://www.google.com/search?q=site%3Abackyardchickens.com+${q}` },
    { kind: "images", title: "More photos (image search)", url: `https://www.google.com/search?tbm=isch&q=${q}` },
  ];
}

if (typeof module !== "undefined") module.exports = { HEALTH_REFS, healthRefLinks };
