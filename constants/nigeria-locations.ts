export type NigeriaState = {
  name: string;
  lgas: string[];
};

export const NIGERIA_STATES: NigeriaState[] = [
  { name: "Abia", lgas: ["Aba North","Aba South","Arochukwu","Bende","Ikwuano","Isiala Ngwa North","Isiala Ngwa South","Isuikwuato","Obi Ngwa","Ohafia","Osisioma","Ugwunagbo","Ukwa East","Ukwa West","Umuahia North","Umuahia South","Umu Nneochi"] },
  { name: "Adamawa", lgas: ["Demsa","Fufore","Ganye","Gayuk","Gombi","Grie","Hong","Jada","Lamurde","Madagali","Maiha","Mayo Belwa","Michika","Mubi North","Mubi South","Numan","Shelleng","Song","Toungo","Yola North","Yola South"] },
  { name: "Akwa Ibom", lgas: ["Abak","Eastern Obolo","Eket","Esit Eket","Essien Udim","Etim Ekpo","Etinan","Ibeno","Ibesikpo Asutan","Ibiono-Ibom","Ika","Ikono","Ikot Abasi","Ikot Ekpene","Ini","Itu","Mbo","Mkpat-Enin","Nsit-Atai","Nsit-Ibom","Nsit-Ubium","Obot Akara","Okobo","Onna","Oron","Oruk Anam","Udung-Uko","Ukanafun","Uruan","Urue-Offong/Oruko","Uyo"] },
  { name: "Anambra", lgas: ["Aguata","Anambra East","Anambra West","Anaocha","Awka North","Awka South","Ayamelum","Dunukofia","Ekwusigo","Idemili North","Idemili South","Ihiala","Njikoka","Nnewi North","Nnewi South","Ogbaru","Onitsha North","Onitsha South","Orumba North","Orumba South","Oyi"] },
  { name: "Bauchi", lgas: ["Alkaleri","Bauchi","Bogoro","Damban","Darazo","Dass","Gamawa","Ganjuwa","Giade","Itas/Gadau","Jama'are","Katagum","Kirfi","Misau","Ningi","Shira","Tafawa Balewa","Toro","Warji","Zaki"] },
  { name: "Bayelsa", lgas: ["Brass","Ekeremor","Kolokuma/Opokuma","Nembe","Ogbia","Sagbama","Southern Ijaw","Yenagoa"] },
  { name: "Benue", lgas: ["Ado","Agatu","Apa","Buruku","Gboko","Guma","Gwer East","Gwer West","Katsina-Ala","Konshisha","Kwande","Logo","Makurdi","Obi","Ogbadibo","Ohimini","Oju","Okpokwu","Oturkpo","Tarka","Ukum","Ushongo","Vandeikya"] },
  { name: "Borno", lgas: ["Abadam","Askira/Uba","Bama","Bayo","Biu","Chibok","Damboa","Dikwa","Gubio","Guzamala","Gwoza","Hawul","Jere","Kaga","Kala/Balge","Konduga","Kukawa","Kwaya Kusar","Mafa","Magumeri","Maiduguri","Marte","Mobbar","Monguno","Ngala","Nganzai","Shani"] },
  { name: "Cross River", lgas: ["Abi","Akamkpa","Akpabuyo","Bakassi","Bekwarra","Biase","Boki","Calabar Municipal","Calabar South","Etung","Ikom","Obanliku","Obubra","Obudu","Odukpani","Ogoja","Yakuur","Yala"] },
  { name: "Delta", lgas: ["Aniocha North","Aniocha South","Bomadi","Burutu","Ethiope East","Ethiope West","Ika North East","Ika South","Isoko North","Isoko South","Ndokwa East","Ndokwa West","Okpe","Oshimili North","Oshimili South","Patani","Sapele","Udu","Ughelli North","Ughelli South","Ukwuani","Uvwie","Warri North","Warri South","Warri South West"] },
  { name: "Ebonyi", lgas: ["Abakaliki","Afikpo North","Afikpo South","Ebonyi","Ezza North","Ezza South","Ikwo","Ishielu","Ivo","Izzi","Ohaozara","Ohaukwu","Onicha"] },
  { name: "Edo", lgas: ["Akoko-Edo","Egor","Esan Central","Esan North-East","Esan South-East","Esan West","Etsako Central","Etsako East","Etsako West","Igueben","Ikpoba Okha","Orhionmwon","Oredo","Ovia North-East","Ovia South-West","Owan East","Owan West","Uhunmwonde"] },
  { name: "Ekiti", lgas: ["Ado Ekiti","Efon","Ekiti East","Ekiti South-West","Ekiti West","Emure","Gbonyin","Ido Osi","Ijero","Ikere","Ikole","Ilejemeje","Irepodun/Ifelodun","Ise/Orun","Moba","Oye"] },
  { name: "Enugu", lgas: ["Aninri","Awgu","Enugu East","Enugu North","Enugu South","Ezeagu","Igbo Etiti","Igbo Eze North","Igbo Eze South","Isi Uzo","Nkanu East","Nkanu West","Nsukka","Oji River","Udenu","Udi","Uzo Uwani"] },
  { name: "FCT", lgas: ["Abaji","Abuja Municipal","Bwari","Gwagwalada","Kuje","Kwali"] },
  { name: "Gombe", lgas: ["Akko","Balanga","Billiri","Dukku","Funakaye","Gombe","Kaltungo","Kwami","Nafada","Shongom","Yamaltu/Deba"] },
  { name: "Imo", lgas: ["Aboh Mbaise","Ahiazu Mbaise","Ehime Mbano","Ezinihitte","Ideato North","Ideato South","Ihitte/Uboma","Ikeduru","Isiala Mbano","Isu","Mbaitoli","Ngor Okpala","Njaba","Nkwerre","Nwangele","Obowo","Oguta","Ohaji/Egbema","Okigwe","Orlu","Orsu","Oru East","Oru West","Owerri Municipal","Owerri North","Owerri West","Unuimo"] },
  { name: "Jigawa", lgas: ["Auyo","Babura","Biriniwa","Birnin Kudu","Buji","Dutse","Gagarawa","Garki","Gumel","Guri","Gwaram","Gwiwa","Hadejia","Jahun","Kafin Hausa","Kaugama","Kazaure","Kiri Kasama","Kiyawa","Maigatari","Malam Madori","Miga","Ringim","Roni","Sule Tankarkar","Taura","Yankwashi"] },
  { name: "Kaduna", lgas: ["Birnin Gwari","Chikun","Giwa","Igabi","Ikara","Jaba","Jema'a","Kachia","Kaduna North","Kaduna South","Kagarko","Kajuru","Kaura","Kauru","Kubau","Kudan","Lere","Makarfi","Sabon Gari","Sanga","Soba","Zangon Kataf","Zaria"] },
  { name: "Kano", lgas: ["Ajingi","Albasu","Bagwai","Bebeji","Bichi","Bunkure","Dala","Dambatta","Dawakin Kudu","Dawakin Tofa","Doguwa","Fagge","Gabasawa","Garko","Garun Mallam","Gaya","Gezawa","Gwale","Gwarzo","Kabo","Kano Municipal","Karaye","Kibiya","Kiru","Kumbotso","Kunchi","Kura","Madobi","Makoda","Minjibir","Nasarawa","Rano","Rimin Gado","Rogo","Shanono","Sumaila","Takai","Tarauni","Tofa","Tsanyawa","Tudun Wada","Ungogo","Warawa","Wudil"] },
  { name: "Katsina", lgas: ["Bakori","Batagarawa","Batsari","Baure","Bindawa","Charanchi","Dandume","Danja","Dan Musa","Daura","Dutsi","Dutsin Ma","Faskari","Funtua","Ingawa","Jibia","Kafur","Kaita","Kankara","Kankia","Katsina","Kurfi","Kusada","Mai'Adua","Malumfashi","Mani","Mashi","Matazu","Musawa","Rimi","Sabuwa","Safana","Sandamu","Zango"] },
  { name: "Kebbi", lgas: ["Aleiro","Arewa Dandi","Argungu","Augie","Bagudo","Birnin Kebbi","Bunza","Dandi","Fakai","Gwandu","Jega","Kalgo","Koko/Besse","Maiyama","Ngaski","Sakaba","Shanga","Suru","Wasagu/Danko","Yauri","Zuru"] },
  { name: "Kogi", lgas: ["Adavi","Ajaokuta","Ankpa","Bassa","Dekina","Ibaji","Idah","Igalamela Odolu","Ijumu","Kabba/Bunu","Kogi","Lokoja","Mopa Muro","Ofu","Ogori/Magongo","Okehi","Okene","Olamaboro","Omala","Yagba East","Yagba West"] },
  { name: "Kwara", lgas: ["Asa","Baruten","Edu","Ekiti","Ifelodun","Ilorin East","Ilorin South","Ilorin West","Irepodun","Isin","Kaiama","Moro","Offa","Oke Ero","Oyun","Pategi"] },
  { name: "Lagos", lgas: ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"] },
  { name: "Nasarawa", lgas: ["Akwanga","Awe","Doma","Karu","Keana","Keffi","Kokona","Lafia","Nasarawa","Nasarawa Egon","Obi","Toto","Wamba"] },
  { name: "Niger", lgas: ["Agaie","Agwara","Bida","Borgu","Bosso","Chanchaga","Edati","Gbako","Gurara","Katcha","Kontagora","Lapai","Lavun","Magama","Mariga","Mashegu","Mokwa","Moya","Paikoro","Rafi","Rijau","Shiroro","Suleja","Tafa","Wushishi"] },
  { name: "Ogun", lgas: ["Abeokuta North","Abeokuta South","Ado-Odo/Ota","Egbado North","Egbado South","Ewekoro","Ifo","Ijebu East","Ijebu North","Ijebu North East","Ijebu Ode","Ikenne","Imeko Afon","Ipokia","Obafemi Owode","Odeda","Odogbolu","Ogun Waterside","Remo North","Shagamu"] },
  { name: "Ondo", lgas: ["Akoko North-East","Akoko North-West","Akoko South-West","Akoko South-East","Akure North","Akure South","Ese Odo","Idanre","Ifedore","Ilaje","Ile Oluji/Okeigbo","Irele","Odigbo","Okitipupa","Ondo East","Ondo West","Ose","Owo"] },
  { name: "Osun", lgas: ["Atakunmosa East","Atakunmosa West","Aiyedaade","Aiyedire","Boluwaduro","Boripe","Ede North","Ede South","Ife Central","Ife East","Ife North","Ife South","Egbedore","Ejigbo","Ifedayo","Ifelodun","Ila","Ilesa East","Ilesa West","Irepodun","Irewole","Isokan","Iwo","Obokun","Odo Otin","Ola Oluwa","Olorunda","Oriade","Orolu","Osogbo"] },
  { name: "Oyo", lgas: ["Afijio","Akinyele","Atiba","Atisbo","Egbeda","Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Ibarapa Central","Ibarapa East","Ibarapa North","Ido","Irepo","Iseyin","Itesiwaju","Iwajowa","Kajola","Lagelu","Ogbomosho North","Ogbomosho South","Ogo Oluwa","Olorunsogo","Oluyole","Ona Ara","Orelope","Ori Ire","Oyo","Oyo East","Saki East","Saki West","Surulere"] },
  { name: "Plateau", lgas: ["Bokkos","Barkin Ladi","Bassa","Jos East","Jos North","Jos South","Kanam","Kanke","Langtang South","Langtang North","Mangu","Mikang","Pankshin","Qua'an Pan","Riyom","Shendam","Wase"] },
  { name: "Rivers", lgas: ["Abua/Odual","Ahoada East","Ahoada West","Akuku-Toru","Andoni","Asari-Toru","Bonny","Degema","Eleme","Emuoha","Etche","Gokana","Ikwerre","Khana","Obio/Akpor","Ogba/Egbema/Ndoni","Ogu/Bolo","Okrika","Omuma","Opobo/Nkoro","Oyigbo","Port Harcourt","Tai"] },
  { name: "Sokoto", lgas: ["Binji","Bodinga","Dange Shuni","Gada","Goronyo","Gudu","Gwadabawa","Illela","Isa","Kebbe","Kware","Rabah","Sabon Birni","Shagari","Silame","Sokoto North","Sokoto South","Tambuwal","Tangaza","Tureta","Wamako","Wurno","Yabo"] },
  { name: "Taraba", lgas: ["Ardo Kola","Bali","Donga","Gashaka","Gassol","Ibi","Jalingo","Karim Lamido","Kumi","Lau","Sardauna","Takum","Ussa","Wukari","Yorro","Zing"] },
  { name: "Yobe", lgas: ["Bade","Bursari","Damaturu","Fika","Fune","Geidam","Gujba","Gulani","Jakusko","Karasuwa","Machina","Nangere","Nguru","Potiskum","Tarmuwa","Yunusari","Yusufari"] },
  { name: "Zamfara", lgas: ["Anka","Bakura","Birnin Magaji/Kiyaw","Bukkuyum","Bungudu","Gummi","Gusau","Kaura Namoda","Maradun","Maru","Shinkafi","Talata Mafara","Chafe","Zurmi"] },
];

export const STATE_NAMES = NIGERIA_STATES.map((item) => item.name);

const fold = (value?: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/local government|area council|municipal|state|lga/g, " ")
    .replace(/[^a-z0-9]+/g, "");

const STATE_ALIASES: Record<string, string> = {
  abuja: "FCT",
  fct: "FCT",
  federalcapitalterritory: "FCT",
  federalcapital: "FCT",
  nasarawastate: "Nasarawa",
  nassarawa: "Nasarawa",
};

const LGA_ALIASES: Record<string, Record<string, string>> = {
  Lagos: {
    lekki: "Eti Osa",
    lekkiphase1: "Eti Osa",
    lekkiphase2: "Eti Osa",
    ikate: "Eti Osa",
    chevron: "Eti Osa",
    victoriaisland: "Eti Osa",
    vi: "Eti Osa",
    ikoyi: "Eti Osa",
    bananaisland: "Eti Osa",
    ajah: "Eti Osa",
    sangotedo: "Ibeju-Lekki",
    abijo: "Ibeju-Lekki",
    awoyaya: "Ibeju-Lekki",
    etiosa: "Eti Osa",
    alimosho: "Alimosho",
    ikeja: "Ikeja",
    ogba: "Ikeja",
    allen: "Ikeja",
    opebi: "Ikeja",
    alausa: "Ikeja",
    computervillage: "Ikeja",
    yaba: "Lagos Mainland",
    ebutemetta: "Lagos Mainland",
    surulere: "Surulere",
    gbagada: "Kosofe",
    magodo: "Kosofe",
    ketu: "Kosofe",
    maryland: "Kosofe",
    ojota: "Kosofe",
    ikorodu: "Ikorodu",
    festac: "Amuwo-Odofin",
    festactown: "Amuwo-Odofin",
    satellite: "Amuwo-Odofin",
    apapa: "Apapa",
    island: "Lagos Island",
    lagosisland: "Lagos Island",
    oshodi: "Oshodi-Isolo",
    isolo: "Oshodi-Isolo",
    mushin: "Mushin",
    agege: "Agege",
    ifako: "Ifako-Ijaiye",
    ojo: "Ojo",
    badagry: "Badagry",
    epe: "Epe",
    ibeju: "Ibeju-Lekki",
    shomolu: "Shomolu",
    palmgroove: "Shomolu",
  },
  FCT: {
    amac: "Abuja Municipal",
    municipa: "Abuja Municipal",
    abujamunicipal: "Abuja Municipal",
    abuja: "Abuja Municipal",
    wuse: "Abuja Municipal",
    wuse2: "Abuja Municipal",
    garki: "Abuja Municipal",
    maitama: "Abuja Municipal",
    asokoro: "Abuja Municipal",
    jabi: "Abuja Municipal",
    utako: "Abuja Municipal",
    wuye: "Abuja Municipal",
    gwarinpa: "Abuja Municipal",
    katampe: "Abuja Municipal",
    apo: "Abuja Municipal",
    lugbe: "Abuja Municipal",
    lokogoma: "Abuja Municipal",
    kubwa: "Bwari",
    bwari: "Bwari",
    gwagwalada: "Gwagwalada",
    kuje: "Kuje",
    kwali: "Kwali",
    abaji: "Abaji",
  },
  Rivers: {
    portharcourt: "Port Harcourt",
    phalga: "Port Harcourt",
    ph: "Port Harcourt",
    obioakpor: "Obio/Akpor",
    obio: "Obio/Akpor",
    rumuokoro: "Obio/Akpor",
    rumuola: "Obio/Akpor",
    eleme: "Eleme",
    oyigbo: "Oyigbo",
  },
};

export const lgasForState = (state?: string) =>
  NIGERIA_STATES.find(
    (item) => item.name.toLowerCase() === String(state || "").trim().toLowerCase(),
  )?.lgas || [];

export const matchStateName = (value?: string) => {
  const raw = String(value || "").trim();
  const key = fold(raw);
  if (!key || key === "nigeria") return "";
  if (STATE_ALIASES[key]) return STATE_ALIASES[key];
  const ranked = [...STATE_NAMES].sort((a, b) => b.length - a.length);
  return (
    ranked.find((name) => fold(name) === key || fold(`${name} state`) === key) ||
    ranked.find((name) => fold(name).length >= 8 && key.includes(fold(name))) ||
    ""
  );
};

export const matchLgaName = (state?: string, value?: string) => {
  const raw = String(value || "").trim();
  const key = fold(raw);
  if (!state || !key) return "";
  const aliased = LGA_ALIASES[state]?.[key];
  if (aliased) return aliased;
  const lgas = lgasForState(state);
  return (
    lgas.find((name) => fold(name) === key) ||
    lgas.find((name) => key.includes(fold(name)) && fold(name).length >= 5) ||
    lgas.find((name) => fold(name).includes(key) && key.length >= 5) ||
    ""
  );
};

export const resolveNigeriaPlace = (parts: Array<string | undefined | null>) => {
  const texts = parts.map((part) => String(part || "").trim()).filter(Boolean);
  const blob = texts.join(", ");
  const state =
    texts.map((part) => matchStateName(part)).find(Boolean) ||
    matchStateName(blob);
  const lga =
    texts.map((part) => matchLgaName(state, part)).find(Boolean) ||
    matchLgaName(state, blob);
  const landmark = texts.find((part) => {
    if (matchStateName(part) === state) return false;
    if (lga && matchLgaName(state, part) === lga) return false;
    return fold(part) !== "nigeria";
  }) || "";
  return { state: state || "", lga: lga || "", landmark };
};

export const formatListingLocation = ({
  landmark,
  lga,
  state,
}: {
  landmark?: string;
  lga?: string;
  state?: string;
}) =>
  [landmark, lga, state]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

export const parseListingLocation = (listing?: {
  state?: string;
  lga?: string;
  landmark?: string;
  location?: string;
}) => {
  const state =
    matchStateName(listing?.state) || matchStateName(listing?.location);
  const lga =
    matchLgaName(state, listing?.lga) ||
    matchLgaName(state, listing?.location);
  const leftover = String(listing?.location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      if (state && matchStateName(part) === state) return false;
      if (lga && matchLgaName(state, part) === lga) return false;
      return true;
    })
    .join(", ");

  return {
    state: state || String(listing?.state || "").trim(),
    lga: lga || String(listing?.lga || "").trim(),
    landmark: String(listing?.landmark || leftover || "").trim(),
  };
};
