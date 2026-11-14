const HEALTH_IMAGES = {
  pox_dry: [
    { src: "img/health/pox_dry-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Ploketes_volantes_cok_parintrece.jpg/960px-Ploketes_volantes_cok_parintrece.jpg", caption: "Dry fowl pox: dark wart-like scabs on the comb of an unvaccinated rooster", credit: "Lucyin", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ploketes_volantes_cok_parintrece.jpg" },
    { src: "img/health/pox_dry-2.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Avian_pox_-_skin_affected_%28chicken%29.jpg/960px-Avian_pox_-_skin_affected_%28chicken%29.jpg", caption: "Dry fowl pox: scabs spread over the comb, face and around the eye", credit: "Roman Halouzka", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Avian_pox_-_skin_affected_(chicken).jpg" },
  ],
  favus: [
    { src: "img/health/favus-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Dermatomycosis_favus_%28chicken%29.jpg/960px-Dermatomycosis_favus_%28chicken%29.jpg", caption: "Favus: white, powdery, flaky crust over the comb and face skin", credit: "Roman Halouzka", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Dermatomycosis_favus_(chicken).jpg" },
  ],
  mites: [
    { src: "img/health/mites-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Dermanyssus_mite_of_birds.jpg/960px-Dermanyssus_mite_of_birds.jpg", caption: "Red poultry mite (Dermanyssus gallinae) after a blood meal, under a microscope", credit: "Daktaridudu", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Dermanyssus_mite_of_birds.jpg" },
  ],
  lice: [
    { src: "img/health/lice-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Menacanthus_stramineus.jpg/960px-Menacanthus_stramineus.jpg", caption: "Chicken body lice (Menacanthus stramineus) crawling at the base of a feather", credit: "Clemson University - USDA Cooperative Extension Slide Series", license: "CC BY 3.0 us", licenseUrl: "https://creativecommons.org/licenses/by/3.0/us/deed.en", sourceUrl: "https://commons.wikimedia.org/wiki/File:Menacanthus_stramineus.jpg" },
  ],
  scaly_leg: [
    { src: "img/health/scaly_leg-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Knemidokoptes_mutans.jpg/960px-Knemidokoptes_mutans.jpg", caption: "Scaly leg mites: thick, white, crusty scales built up on a bird's feet and toes", credit: "Stephen James McWilliam", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en", sourceUrl: "https://commons.wikimedia.org/wiki/File:Knemidokoptes_mutans.jpg" },
    { src: "img/health/scaly_leg-2.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Image_of_Scaly_leg_on_chicken.jpg/960px-Image_of_Scaly_leg_on_chicken.jpg", caption: "Early scaly leg on a chicken: leg scales starting to lift and look rough", credit: "Robins bird", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Image_of_Scaly_leg_on_chicken.jpg" },
  ],
  fowl_cholera: [
    { src: "img/health/fowl_cholera-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Colera_poyes_parintreces_cou.jpg/960px-Colera_poyes_parintreces_cou.jpg", caption: "Fowl cholera outbreak: vent feathers caked with green-white diarrhoea", credit: "Lucyin", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Colera_poyes_parintreces_cou.jpg" },
  ],
  ib: [
    { src: "img/health/ib-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Brontchite_o%C3%BBs4.jpg", caption: "Probable infectious bronchitis in a laying flock: misshapen, pale and rough-shelled eggs next to a normal brown egg", credit: "L. Mahin", license: "CC BY-SA 3.0", licenseUrl: "http://creativecommons.org/licenses/by-sa/3.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:Brontchite_o%C3%BBs4.jpg" },
  ],
  mareks: [
    { src: "img/health/mareks-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Maladeye_Marek_pate_sitindowe_divant.jpg", caption: "Marek's disease: young hen lying with one leg stretched forward (the \"splits\" posture of paralysis)", credit: "Lucyin", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Maladeye_Marek_pate_sitindowe_divant.jpg" },
    { src: "img/health/mareks-2.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/6/64/Ocular_Marek%27s_disease.jpg", caption: "Eyes removed after death: grey, irregular iris of Marek's eye form (left) compared with a normal eye (right)", credit: "USDA Agricultural Research Service", license: "Public domain", licenseUrl: "", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ocular_Marek%27s_disease.jpg" },
  ],
  bumblefoot: [
    { src: "img/health/bumblefoot-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Pododermatitis_%28Bumblefoot%29_in_a_rooster.jpg/960px-Pododermatitis_%28Bumblefoot%29_in_a_rooster.jpg", caption: "Bumblefoot: black scab over a swollen foot pad (rooster under anaesthesia before surgery)", credit: "Sylvain Larrat", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Pododermatitis_(Bumblefoot)_in_a_rooster.jpg" },
  ],
  cocci: [
    { src: "img/health/cocci-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Coccidi%C3%B4ze_sblarixhaedje_houf%C3%A8s_plomes.jpg/960px-Coccidi%C3%B4ze_sblarixhaedje_houf%C3%A8s_plomes.jpg", caption: "Coccidiosis: hunched, fluffed-up young chicken with eyes closed and a bloody dropping beside it", credit: "Lucyin", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Coccidi%C3%B4ze_sblarixhaedje_houf%C3%A8s_plomes.jpg" },
  ],
  worms: [
    { src: "img/health/worms-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Ascaridia_galli.jpg/960px-Ascaridia_galli.jpg", caption: "Large roundworms (Ascaridia galli) taken from a chicken", credit: "Chhandama", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ascaridia_galli.jpg" },
  ],
  newcastle_ai: [
    { src: "img/health/newcastle_ai-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/f/f9/F%C3%A5sse_pesse_toirtchaedje_c%C3%B41.jpg", caption: "Newcastle disease: young broiler with twisted neck (wry neck / stargazing nerve signs)", credit: "L. Mahin", license: "CC BY-SA 3.0", licenseUrl: "http://creativecommons.org/licenses/by-sa/3.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:F%C3%A5sse_pesse_toirtchaedje_c%C3%B41.jpg" },
    { src: "img/health/newcastle_ai-2.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Swollen_chicken.jpg", caption: "Highly pathogenic avian influenza: swollen face and dark purple comb and wattles", credit: "USDA file photo", license: "Public domain", licenseUrl: "", sourceUrl: "https://commons.wikimedia.org/wiki/File:Swollen_chicken.jpg" },
  ],
  pullorum: [
    { src: "img/health/pullorum-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Pulloroz1.jpg", caption: "Pullorum disease in grown broilers: vent feathers pasted with whitish-yellow diarrhoea (in chicks the vent pastes up the same way)", credit: "Erkinov SHokhbos", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Pulloroz1.jpg" },
  ],
  colibacillosis: [
    { src: "img/health/colibacillosis-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Colibacil%C3%B4ze_polet_pindant_d%27_l%27_aiye.JPG/960px-Colibacil%C3%B4ze_polet_pindant_d%27_l%27_aiye.JPG", caption: "Colibacillosis: dull, ruffled young broiler standing by medicated water", credit: "Lucyin", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Colibacil%C3%B4ze_polet_pindant_d%27_l%27_aiye.JPG" },
  ],
  blackhead: [
    { src: "img/health/blackhead-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Histomoniasis.jpg", caption: "Necropsy: blackhead liver with round, sunken yellow \"target\" spots caused by Histomonas (wild bird; looks the same in poultry)", credit: "U.S. Geological Survey", license: "Public domain", licenseUrl: "", sourceUrl: "https://commons.wikimedia.org/wiki/File:Histomoniasis.jpg" },
  ],
  gapeworm: [
    { src: "img/health/gapeworm-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/8/89/Gapeworms.jpg", caption: "Necropsy: red Y-shaped gapeworms (Syngamus trachea) inside an opened windpipe (pheasant)", credit: "Milton Friend at the Geological Survey National Wildlife Health Center", license: "Public domain", licenseUrl: "", sourceUrl: "https://commons.wikimedia.org/wiki/File:Gapeworms.jpg" },
  ],
  ibd: [
    { src: "img/health/ibd-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/8/87/Disease-3stage-bursa.jpg", caption: "Necropsy: bursas of Fabricius in Gumboro disease, swollen early (left), bleeding (middle), shrunken late (right)", credit: "LaiaOltra", license: "Public domain", licenseUrl: "", sourceUrl: "https://commons.wikimedia.org/wiki/File:Disease-3stage-bursa.jpg" },
  ],
  ae: [
    { src: "img/health/ae-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Ecefali-miy%C3%B4lite_des_poyons_racrapotaedje.jpg/960px-Ecefali-miy%C3%B4lite_des_poyons_racrapotaedje.jpg", caption: "Avian encephalomyelitis: young broiler collapsed and unable to stand, eyes half closed (tremors are often visible in live chicks)", credit: "Lucyin", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ecefali-miy%C3%B4lite_des_poyons_racrapotaedje.jpg" },
  ],
  riboflavin: [
    { src: "img/health/riboflavin-1.jpg", remote: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Poyon_17dj_mancance_riboflavene.JPG/960px-Poyon_17dj_mancance_riboflavene.JPG", caption: "Riboflavin (vitamin B2) deficiency: chick with toes curled inward, walking on its hocks", credit: "Lucyin", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Poyon_17dj_mancance_riboflavene.JPG" },
  ],
};
